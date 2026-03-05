import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { checkoutPayloadSchema, createOrderQuote } from "@/lib/checkout";
import { logEvent, getRequestId, setRequestIdHeader } from "@/lib/observability";
import { insertOrderEvent } from "@/lib/orders";
import {
  buildPricing,
  getLatestFxUsdArs,
  getShippingRateForAddress,
  getStoryPricing,
} from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { OrderQuoteRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/orders/quote";
  try {
    const { user } = await requireAuthenticatedUser();
    logEvent("info", "orders_quote.request", { request_id: requestId, route, user_id: user.id });
    const rawPayload = await request.json();

    const cartPayload = checkoutPayloadSchema.safeParse(rawPayload);
    if (cartPayload.success) {
      const quote = createOrderQuote(cartPayload.data.items);
      const response = NextResponse.json({ quote, source: "cart" });
      return setRequestIdHeader(response, requestId);
    }

    const payload = OrderQuoteRequestSchema.parse(rawPayload);
    const adminClient = createSupabaseAdminClient();

    const story = await getStoryPricing(adminClient, payload.story_id);
    const fx = await getLatestFxUsdArs(adminClient);
    const shippingSelection =
      payload.format === "print" && payload.shipping_address
        ? await getShippingRateForAddress(adminClient, {
            city: payload.shipping_address.city,
            state: payload.shipping_address.state,
            postalCode: payload.shipping_address.postalCode,
            countryCode: payload.shipping_address.countryCode,
          })
        : null;
    const pricing = buildPricing({
      story,
      format: payload.format,
      currency: payload.currency,
      fxRateUsdArs: fx.usd_to_ars,
      shippingFeeArs: shippingSelection?.feeArs ?? 0,
      shippingRuleId: shippingSelection?.ruleId ?? null,
      shippingEtaDays: shippingSelection?.etaDays ?? null,
    });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    if (payload.order_id) {
      const { data: order, error: orderError } = await adminClient
        .from("orders")
        .select("id,user_id,status")
        .eq("id", payload.order_id)
        .maybeSingle();

      if (orderError || !order) {
        throw new ApiError(404, "not_found", "Order not found");
      }

      if (String(order.user_id) !== user.id) {
        throw new ApiError(404, "not_found", "Order not found");
      }

      const allowedStatuses = ["draft", "pending_payment", "failed"];
      if (!allowedStatuses.includes(String(order.status))) {
        throw new ApiError(409, "invalid_state", "Order cannot be requoted in current status");
      }

      const { error: orderUpdateError } = await adminClient
        .from("orders")
        .update({
          status: "draft",
          currency: payload.currency,
          fx_rate_snapshot: pricing.fx_rate_snapshot,
          subtotal: pricing.subtotal,
          shipping_fee: pricing.shipping_fee,
          total: pricing.total,
          quote_expires_at: expiresAt,
        })
        .eq("id", payload.order_id);

      if (orderUpdateError) {
        throw new Error(orderUpdateError.message);
      }

      const { error: itemUpdateError } = await adminClient
        .from("order_items")
        .update({
          story_id: payload.story_id,
          format: payload.format,
          print_options_snapshot: payload.print_options,
          price_snapshot: {
            subtotal: pricing.subtotal,
            shipping_fee: pricing.shipping_fee,
            total: pricing.total,
            currency: payload.currency,
            fx_rate_snapshot: pricing.fx_rate_snapshot,
            shipping_rule_id: pricing.shipping_rule_id,
            shipping_eta_days: pricing.shipping_eta_days,
          },
        })
        .eq("order_id", payload.order_id);

      if (itemUpdateError) {
        throw new Error(itemUpdateError.message);
      }

      await insertOrderEvent(adminClient, {
        orderId: payload.order_id,
        eventType: "quote_refreshed",
        fromStatus: String(order.status),
        toStatus: "draft",
        payload: {
          currency: payload.currency,
          subtotal: pricing.subtotal,
          shipping_fee: pricing.shipping_fee,
          total: pricing.total,
          fx_rate_snapshot: pricing.fx_rate_snapshot,
          shipping_rule_id: pricing.shipping_rule_id,
          shipping_eta_days: pricing.shipping_eta_days,
        },
      });

      if (payload.shipping_address) {
        const { error: shippingAddressError } = await adminClient.from("shipping_addresses").upsert(
          {
            order_id: payload.order_id,
            recipient_name: payload.shipping_address.recipientName,
            line1: payload.shipping_address.line1,
            line2: payload.shipping_address.line2 ?? null,
            city: payload.shipping_address.city,
            state: payload.shipping_address.state ?? null,
            postal_code: payload.shipping_address.postalCode,
            country_code: payload.shipping_address.countryCode.toUpperCase(),
            phone: payload.shipping_address.phone ?? null,
          },
          { onConflict: "order_id" },
        );

        if (shippingAddressError) {
          throw new Error(shippingAddressError.message);
        }
      }
    }

    const { data: quoteRow, error: quoteError } = await adminClient
      .from("order_quotes")
      .insert({
        user_id: user.id,
        order_id: payload.order_id ?? null,
        story_id: payload.story_id,
        format: payload.format,
        print_options: payload.print_options,
        shipping_city: payload.shipping_address?.city ?? null,
        shipping_address: payload.shipping_address ?? null,
        shipping_rule_id: pricing.shipping_rule_id,
        shipping_eta_days: pricing.shipping_eta_days,
        currency: payload.currency,
        fx_rate_snapshot: pricing.fx_rate_snapshot,
        subtotal: pricing.subtotal,
        shipping_fee: pricing.shipping_fee,
        total: pricing.total,
        expires_at: expiresAt,
      })
      .select("id, subtotal, shipping_fee, total, fx_rate_snapshot, expires_at, currency, shipping_rule_id, shipping_eta_days")
      .single();

    if (quoteError || !quoteRow) {
      throw new Error(quoteError?.message ?? "Failed to create quote");
    }

    const response = NextResponse.json({
      quote_id: quoteRow.id,
      subtotal: Number(quoteRow.subtotal),
      shipping_fee: Number(quoteRow.shipping_fee),
      total: Number(quoteRow.total),
      fx_rate_snapshot: quoteRow.fx_rate_snapshot === null ? null : Number(quoteRow.fx_rate_snapshot),
      expires_at: String(quoteRow.expires_at),
      currency: quoteRow.currency,
      shipping_rule_id: quoteRow.shipping_rule_id ? String(quoteRow.shipping_rule_id) : null,
      shipping_eta_days: quoteRow.shipping_eta_days === null ? null : Number(quoteRow.shipping_eta_days),
      source: "order_quote",
    });
    logEvent("info", "orders_quote.created", {
      request_id: requestId,
      route,
      user_id: user.id,
      order_id: payload.order_id,
    });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "orders_quote.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
