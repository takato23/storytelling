import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { handleRouteError } from "@/lib/api";
import { processOrderGeneration } from "@/lib/generation";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { insertOrderEvent } from "@/lib/orders";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

function isDuplicateError(code: string | null | undefined, message: string | null | undefined) {
  if (code === "23505") return true;
  const text = (message || "").toLowerCase();
  return text.includes("duplicate") || text.includes("unique");
}

async function resolveOrderIdFromSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.order_id) {
    return session.metadata.order_id;
  }

  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("payments")
    .select("order_id")
    .eq("provider", "stripe")
    .eq("provider_session_id", session.id)
    .maybeSingle();

  return data?.order_id ? String(data.order_id) : null;
}

async function upsertShippingAddressFromSession(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
  session: Stripe.Checkout.Session,
) {
  const shipping = session.collected_information?.shipping_details;
  const shippingAddress = shipping?.address;
  const fallbackAddress = session.customer_details?.address ?? null;
  const address = shippingAddress ?? fallbackAddress;
  const recipientName = shipping?.name ?? session.customer_details?.name ?? null;

  if (!recipientName || !address?.line1 || !address.city || !address.postal_code || !address.country) {
    return false;
  }

  const { error: shippingUpsertError } = await adminClient.from("shipping_addresses").upsert(
    {
      order_id: orderId,
      recipient_name: recipientName,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state ?? null,
      postal_code: address.postal_code,
      country_code: address.country.toUpperCase(),
      phone: session.customer_details?.phone ?? null,
    },
    { onConflict: "order_id" },
  );

  if (shippingUpsertError) {
    throw new Error(shippingUpsertError.message);
  }

  await insertOrderEvent(adminClient, {
    orderId,
    eventType: "shipping_address_captured",
    payload: {
      city: address.city,
      country_code: address.country.toUpperCase(),
      postal_code: address.postal_code,
    },
  });

  return true;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const adminClient = createSupabaseAdminClient();
  const source = session.metadata?.source;

  if (source === "sticker" && session.metadata?.sticker_order_id) {
    const stickerOrderId = session.metadata.sticker_order_id;
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    await adminClient
      .from("sticker_orders")
      .update({
        status: "paid",
        provider_payment_id: paymentIntent,
      })
      .eq("id", stickerOrderId);

    return;
  }

  const orderId = await resolveOrderIdFromSession(session);

  if (!orderId) {
    return;
  }

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;

  await adminClient
    .from("payments")
    .update({
      provider_payment_intent: paymentIntent,
      status: "paid",
      raw_payload: session,
    })
    .eq("provider", "stripe")
    .eq("provider_session_id", session.id);

  const [{ data: order }, { data: item }] = await Promise.all([
    adminClient
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle(),
    adminClient
      .from("order_items")
      .select("format")
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle(),
  ]);

  const previousStatus = order?.status ? String(order.status) : "pending_payment";
  await adminClient.from("orders").update({ status: "paid" }).eq("id", orderId);

  await insertOrderEvent(adminClient, {
    orderId,
    eventType: "payment_completed",
    fromStatus: previousStatus,
    toStatus: "paid",
    payload: {
      provider: "stripe",
      provider_session_id: session.id,
      provider_payment_intent: paymentIntent,
    },
  });

  if (item?.format === "print") {
    await upsertShippingAddressFromSession(adminClient, orderId, session);
  }

  await processOrderGeneration(adminClient, {
    orderId,
    triggerSource: "stripe_webhook",
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const adminClient = createSupabaseAdminClient();
  const { data: stickerOrder } = await adminClient
    .from("sticker_orders")
    .select("id")
    .eq("provider_payment_id", paymentIntent.id)
    .maybeSingle();

  if (stickerOrder?.id) {
    await adminClient
      .from("sticker_orders")
      .update({ status: "failed" })
      .eq("id", stickerOrder.id);
    return;
  }

  const { data: payment } = await adminClient
    .from("payments")
    .select("order_id")
    .eq("provider", "stripe")
    .eq("provider_payment_intent", paymentIntent.id)
    .maybeSingle();

  if (!payment?.order_id) {
    return;
  }

  await adminClient
    .from("payments")
    .update({ status: "failed", raw_payload: paymentIntent })
    .eq("provider", "stripe")
    .eq("provider_payment_intent", paymentIntent.id);

  await adminClient.from("orders").update({ status: "failed" }).eq("id", payment.order_id);

  await insertOrderEvent(adminClient, {
    orderId: String(payment.order_id),
    eventType: "payment_failed",
    fromStatus: "pending_payment",
    toStatus: "failed",
    payload: { provider_payment_intent: paymentIntent.id },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!paymentIntent) return;

  const adminClient = createSupabaseAdminClient();
  const { data: stickerOrder } = await adminClient
    .from("sticker_orders")
    .select("id")
    .eq("provider_payment_id", paymentIntent)
    .maybeSingle();

  if (stickerOrder?.id) {
    await adminClient
      .from("sticker_orders")
      .update({ status: "refunded" })
      .eq("id", stickerOrder.id);
    return;
  }

  const { data: payment } = await adminClient
    .from("payments")
    .select("order_id")
    .eq("provider", "stripe")
    .eq("provider_payment_intent", paymentIntent)
    .maybeSingle();

  if (!payment?.order_id) {
    return;
  }

  await adminClient
    .from("payments")
    .update({ status: "refunded", raw_payload: charge })
    .eq("provider", "stripe")
    .eq("provider_payment_intent", paymentIntent);

  await adminClient.from("orders").update({ status: "refunded" }).eq("id", payment.order_id);

  await insertOrderEvent(adminClient, {
    orderId: String(payment.order_id),
    eventType: "payment_refunded",
    fromStatus: "paid",
    toStatus: "refunded",
    payload: { provider_payment_intent: paymentIntent },
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/webhooks/stripe";
  const adminClient = createSupabaseAdminClient();

  try {
    logEvent("info", "stripe_webhook.received", { request_id: requestId, route });
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      const response = NextResponse.json({ error: "invalid_signature" }, { status: 400 });
      return setRequestIdHeader(response, requestId);
    }

    const rawBody = await request.text();
    const event = getStripeClient().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());

    const { error: eventInsertError } = await adminClient.from("webhook_events").insert({
      provider: "stripe",
      event_id: event.id,
      payload: event,
    });

    if (eventInsertError) {
      if (isDuplicateError(eventInsertError.code, eventInsertError.message)) {
        const { data: existing } = await adminClient
          .from("webhook_events")
          .select("processed_at")
          .eq("provider", "stripe")
          .eq("event_id", event.id)
          .maybeSingle();

        if (existing?.processed_at) {
          const response = NextResponse.json({ received: true, idempotent: true });
          return setRequestIdHeader(response, requestId);
        }
      } else {
        throw new Error(eventInsertError.message);
      }
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }

    await adminClient
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("event_id", event.id);

    logEvent("info", "stripe_webhook.processed", { request_id: requestId, route }, {
      event_id: event.id,
      event_type: event.type,
    });
    const response = NextResponse.json({ received: true });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "stripe_webhook.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
