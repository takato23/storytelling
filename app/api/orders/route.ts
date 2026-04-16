import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { getOptionalAuthenticatedUser } from "@/lib/auth";
import { getCheckoutAvailability } from "@/lib/checkout-status";
import { resolveCheckoutIdentity } from "@/lib/guest-checkout";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { createOrderDraft } from "@/lib/orders";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCheckoutProvider } from "@/lib/mercadopago";
import {
  buildPricing,
  getLatestFxUsdArs,
  getShippingRateForAddress,
  getStoryPricing,
} from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { CreateOrderRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/orders";

  try {
    const limited = enforceRateLimit(request, { key: route, limit: 10, windowMs: 60_000 });
    if (limited) return setRequestIdHeader(limited, requestId);

    const { user } = await getOptionalAuthenticatedUser();
    const checkoutAvailability = getCheckoutAvailability();
    if (!checkoutAvailability.enabled) {
      const response = NextResponse.json(
        {
          error: "checkout_unavailable",
          message: checkoutAvailability.message,
          provider: checkoutAvailability.provider,
          reason: checkoutAvailability.reason,
        },
        { status: 503 },
      );
      return setRequestIdHeader(response, requestId);
    }

    const payload = CreateOrderRequestSchema.parse(await request.json());

    const adminClient = createSupabaseAdminClient();

    // Resolve checkout identity (authenticated user or guest)
    const identity = await resolveCheckoutIdentity(adminClient, {
      authenticatedUserId: user?.id,
      customerEmail: payload.customer_email,
    });

    logEvent("info", "orders_create.request", {
      request_id: requestId,
      route,
      user_id: identity.userId ?? undefined,
      is_guest: identity.isGuest,
    });

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
      printOptions: payload.print_options,
      fxRateUsdArs: fx.usd_to_ars,
      shippingFeeArs: shippingSelection?.feeArs ?? 0,
      shippingRuleId: shippingSelection?.ruleId ?? null,
      shippingEtaDays: shippingSelection?.etaDays ?? null,
    });

    const orderId = await createOrderDraft(adminClient, {
      userId: identity.userId,
      storyId: payload.story_id,
      format: payload.format,
      currency: payload.currency,
      paymentProvider: getCheckoutProvider(),
      subtotal: pricing.subtotal,
      shippingFee: pricing.shipping_fee,
      total: pricing.total,
      fxRateSnapshot: pricing.fx_rate_snapshot,
      printOptions: payload.print_options,
      childProfile: payload.child_profile,
      personalizationPayload: payload.personalization_payload,
      customerEmail: identity.customerEmail,
      shippingAddress: payload.shipping_address,
    });

    logEvent("info", "orders_create.created", {
      request_id: requestId,
      route,
      user_id: identity.userId ?? undefined,
      order_id: orderId,
      is_guest: identity.isGuest,
    });

    const response = NextResponse.json(
      {
        order_id: orderId,
        status: "draft",
        shipping_rule_id: pricing.shipping_rule_id,
        shipping_eta_days: pricing.shipping_eta_days,
      },
      { status: 201 },
    );

    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "orders_create.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
