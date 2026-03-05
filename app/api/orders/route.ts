import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createOrderDraft } from "@/lib/orders";
import {
  buildPricing,
  getLatestFxUsdArs,
  getShippingRateForAddress,
  getStoryPricing,
} from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { CreateOrderRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthenticatedUser();
    const payload = CreateOrderRequestSchema.parse(await request.json());

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

    const orderId = await createOrderDraft(adminClient, {
      userId: user.id,
      storyId: payload.story_id,
      format: payload.format,
      currency: payload.currency,
      paymentProvider: payload.payment_provider,
      subtotal: pricing.subtotal,
      shippingFee: pricing.shipping_fee,
      total: pricing.total,
      fxRateSnapshot: pricing.fx_rate_snapshot,
      printOptions: payload.print_options,
      childProfile: payload.child_profile,
      personalizationPayload: payload.personalization_payload,
      shippingAddress: payload.shipping_address,
    });

    return NextResponse.json(
      {
        order_id: orderId,
        status: "draft",
        shipping_rule_id: pricing.shipping_rule_id,
        shipping_eta_days: pricing.shipping_eta_days,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
