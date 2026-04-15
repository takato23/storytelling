// TODO: When MercadoPago credentials are available, add webhook signature verification.
// MercadoPago sends x-signature header with HMAC-SHA256. Verify using:
// ts + v1.{query_id}{data_id} signed with webhook secret.
// Docs: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { processOrderGeneration } from "@/lib/generation";
import { getMercadoPagoPayment } from "@/lib/mercadopago";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { insertOrderEvent } from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

type MercadoPagoPayment = Awaited<ReturnType<typeof getMercadoPagoPayment>>;
type StickerOrderStatus = "pending_payment" | "paid" | "failed" | "refunded";

function isDuplicateError(code: string | null | undefined, message: string | null | undefined) {
  if (code === "23505") return true;
  const text = (message || "").toLowerCase();
  return text.includes("duplicate") || text.includes("unique");
}

function normalizeTopic(payload: Record<string, unknown>, searchParams: URLSearchParams): string {
  const fromQuery = searchParams.get("type") || searchParams.get("topic");
  if (fromQuery) return fromQuery;

  if (typeof payload.type === "string") return payload.type;
  if (typeof payload.topic === "string") return payload.topic;
  if (typeof payload.action === "string") {
    return payload.action.split(".")[0];
  }
  return "";
}

function normalizeResourceId(payload: Record<string, unknown>, searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get("data.id") || searchParams.get("id");
  if (fromQuery) return fromQuery;

  const data = payload.data;
  if (data && typeof data === "object" && typeof (data as Record<string, unknown>).id === "string") {
    return (data as Record<string, unknown>).id as string;
  }

  if (typeof payload.id === "string") return payload.id;
  return null;
}

function resolveStickerOrderId(payment: MercadoPagoPayment): string | null {
  if (payment.external_reference?.startsWith("sticker:")) {
    return payment.external_reference.replace(/^sticker:/, "");
  }

  const metadataStickerOrderId = payment.metadata.sticker_order_id;
  if (typeof metadataStickerOrderId === "string" && metadataStickerOrderId.length > 0) {
    return metadataStickerOrderId;
  }

  return null;
}

function resolveStickerStatus(paymentStatus: string | null): StickerOrderStatus {
  if (paymentStatus === "approved") return "paid";
  if (paymentStatus === "refunded" || paymentStatus === "charged_back") return "refunded";
  if (paymentStatus === "rejected" || paymentStatus === "cancelled") return "failed";
  return "pending_payment";
}

async function markWebhookProcessed(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
) {
  await adminClient
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("event_id", eventId);
}

async function handleStickerPayment(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  payment: MercadoPagoPayment,
  stickerOrderId: string,
) {
  const { data: stickerOrder, error: stickerOrderError } = await adminClient
    .from("sticker_orders")
    .select("id,status")
    .eq("id", stickerOrderId)
    .maybeSingle();

  if (stickerOrderError) {
    throw new Error(stickerOrderError.message);
  }

  if (!stickerOrder?.id) {
    return false;
  }

  const nextStatus = resolveStickerStatus(payment.status);

  const { error: updateError } = await adminClient
    .from("sticker_orders")
    .update({
      status: nextStatus,
      provider_payment_id: payment.id,
      payment_provider: "mercadopago",
    })
    .eq("id", stickerOrderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}

async function resolveOrderId(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  payment: MercadoPagoPayment,
) {
  if (payment.external_reference) {
    if (payment.external_reference.startsWith("sticker:")) {
      return null;
    }
    return payment.external_reference;
  }

  const metadataOrderId = payment.metadata.order_id;
  if (typeof metadataOrderId === "string" && metadataOrderId.length > 0) {
    return metadataOrderId;
  }

  const { data } = await adminClient
    .from("payments")
    .select("order_id")
    .eq("provider", "mercadopago")
    .eq("provider_payment_intent", payment.id)
    .maybeSingle();

  return data?.order_id ? String(data.order_id) : null;
}

async function upsertPaymentRecord(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  params: {
    orderId: string;
    paymentId: string;
    amount: number | null;
    currency: string | null;
    status: "pending" | "paid" | "failed" | "refunded";
    rawPayload: Record<string, unknown>;
  },
) {
  const { data: existing } = await adminClient
    .from("payments")
    .select("id")
    .eq("order_id", params.orderId)
    .eq("provider", "mercadopago")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const { error: updateError } = await adminClient
      .from("payments")
      .update({
        provider_payment_intent: params.paymentId,
        status: params.status,
        amount: params.amount,
        currency: params.currency ?? "ARS",
        raw_payload: params.rawPayload,
      })
      .eq("id", existing[0].id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await adminClient.from("payments").upsert(
    {
      order_id: params.orderId,
      provider: "mercadopago",
      provider_payment_intent: params.paymentId,
      status: params.status,
      amount: params.amount ?? 0,
      currency: params.currency ?? "ARS",
      raw_payload: params.rawPayload,
    },
    { onConflict: "provider_payment_intent" },
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/webhooks/mercadopago";
  const adminClient = createSupabaseAdminClient();

  try {
    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    }

    const searchParams = new URL(request.url).searchParams;
    const topic = normalizeTopic(payload, searchParams);
    const resourceId = normalizeResourceId(payload, searchParams);
    const eventId = `mp:${topic || "unknown"}:${resourceId || "none"}`;

    const { error: eventInsertError } = await adminClient.from("webhook_events").insert({
      provider: "mercadopago",
      event_id: eventId,
      payload: payload,
    });

    if (eventInsertError) {
      if (isDuplicateError(eventInsertError.code, eventInsertError.message)) {
        const { data: existing } = await adminClient
          .from("webhook_events")
          .select("processed_at")
          .eq("event_id", eventId)
          .maybeSingle();

        if (existing?.processed_at) {
          const response = NextResponse.json({ received: true, idempotent: true });
          return setRequestIdHeader(response, requestId);
        }
      } else {
        throw new Error(eventInsertError.message);
      }
    }

    logEvent("info", "mercadopago_webhook.received", { request_id: requestId, route }, {
      event_id: eventId,
      topic,
      resource_id: resourceId,
    });

    if (topic !== "payment" || !resourceId) {
      await markWebhookProcessed(adminClient, eventId);
      const response = NextResponse.json({ received: true, ignored: true });
      return setRequestIdHeader(response, requestId);
    }

    const payment = await getMercadoPagoPayment(resourceId);
    const stickerOrderId = resolveStickerOrderId(payment);

    if (stickerOrderId) {
      const handled = await handleStickerPayment(adminClient, payment, stickerOrderId);
      await markWebhookProcessed(adminClient, eventId);

      logEvent("info", "mercadopago_webhook.processed", { request_id: requestId, route }, {
        event_id: eventId,
        topic,
        payment_id: payment.id,
        sticker_order_id: stickerOrderId,
        payment_status: payment.status,
      });

      if (!handled) {
        const response = NextResponse.json({ received: true, unresolved_sticker_order: true });
        return setRequestIdHeader(response, requestId);
      }

      const response = NextResponse.json({ received: true, source: "sticker" });
      return setRequestIdHeader(response, requestId);
    }

    const orderId = await resolveOrderId(adminClient, payment);

    if (!orderId) {
      await markWebhookProcessed(adminClient, eventId);
      const response = NextResponse.json({ received: true, unresolved_order: true });
      return setRequestIdHeader(response, requestId);
    }

    const { data: order } = await adminClient
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    const previousStatus = order?.status ? String(order.status) : "pending_payment";

    const rawPayload = {
      webhook_payload: payload,
      payment_payload: payment,
    };

    if (payment.status === "approved") {
      await upsertPaymentRecord(adminClient, {
        orderId,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: "paid",
        rawPayload,
      });

      await adminClient.from("orders").update({ status: "paid" }).eq("id", orderId);

      await insertOrderEvent(adminClient, {
        orderId,
        eventType: "payment_completed",
        fromStatus: previousStatus,
        toStatus: "paid",
        payload: {
          provider: "mercadopago",
          provider_payment_intent: payment.id,
          status_detail: payment.status_detail,
        },
      });

      try {
        await processOrderGeneration(adminClient, {
          orderId,
          triggerSource: "system",
        });
      } catch (generationError) {
        if (
          generationError instanceof ApiError &&
          generationError.code === "invalid_state"
        ) {
          // Ignore duplicate approved events once generation is already complete.
        } else {
          throw generationError;
        }
      }
    } else if (payment.status === "refunded" || payment.status === "charged_back") {
      await upsertPaymentRecord(adminClient, {
        orderId,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: "refunded",
        rawPayload,
      });

      await adminClient.from("orders").update({ status: "refunded" }).eq("id", orderId);

      await insertOrderEvent(adminClient, {
        orderId,
        eventType: "payment_refunded",
        fromStatus: previousStatus,
        toStatus: "refunded",
        payload: {
          provider: "mercadopago",
          provider_payment_intent: payment.id,
          status_detail: payment.status_detail,
        },
      });
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await upsertPaymentRecord(adminClient, {
        orderId,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: "failed",
        rawPayload,
      });

      await adminClient.from("orders").update({ status: "failed" }).eq("id", orderId);

      await insertOrderEvent(adminClient, {
        orderId,
        eventType: "payment_failed",
        fromStatus: previousStatus,
        toStatus: "failed",
        payload: {
          provider: "mercadopago",
          provider_payment_intent: payment.id,
          status_detail: payment.status_detail,
        },
      });
    } else {
      await upsertPaymentRecord(adminClient, {
        orderId,
        paymentId: payment.id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: "pending",
        rawPayload,
      });
    }

    await markWebhookProcessed(adminClient, eventId);

    logEvent("info", "mercadopago_webhook.processed", { request_id: requestId, route }, {
      event_id: eventId,
      topic,
      payment_id: payment.id,
      order_id: orderId,
      payment_status: payment.status,
    });

    const response = NextResponse.json({ received: true });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "mercadopago_webhook.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
