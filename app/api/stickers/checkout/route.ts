import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import {
  createMercadoPagoPreferenceGeneric,
  getCheckoutProvider,
} from "@/lib/mercadopago";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { getShippingRateForAddress, toMinorUnits } from "@/lib/pricing";
import { getStripeClient } from "@/lib/stripe";
import {
  DEFAULT_STICKER_STYLE_ID,
  STICKER_STYLE_IDS,
  STICKER_UNIT_PRICE_ARS,
} from "@/lib/stickers";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ShippingAddressSchema } from "@/lib/types";

const StickerCheckoutPayloadSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(180),
  customerPhone: z.string().trim().max(40).optional(),
  childGender: z.enum(["niña", "niño"]),
  themes: z.array(z.string().min(2)).min(1).max(6),
  styleId: z.enum(STICKER_STYLE_IDS).default(DEFAULT_STICKER_STYLE_ID),
  quantity: z.number().int().min(1).max(10),
  previewImageUrl: z.string().url().optional(),
  shippingAddress: ShippingAddressSchema,
});

function getBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || new URL(request.url).origin;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function isMissingSelectedStyleColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("selected_style");
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/stickers/checkout";
  try {
    const payload = StickerCheckoutPayloadSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();
    const baseUrl = getBaseUrl(request);

    const shippingSelection = await getShippingRateForAddress(adminClient, {
      city: payload.shippingAddress.city,
      state: payload.shippingAddress.state,
      postalCode: payload.shippingAddress.postalCode,
      countryCode: payload.shippingAddress.countryCode,
    });

    const subtotal = round2(STICKER_UNIT_PRICE_ARS * payload.quantity);
    const shippingFee = round2(shippingSelection.feeArs);
    const total = round2(subtotal + shippingFee);
    const checkoutProvider = getCheckoutProvider();

    const insertPayload = {
      customer_name: payload.customerName,
      customer_email: payload.customerEmail,
      customer_phone: payload.customerPhone ?? null,
      child_gender: payload.childGender,
      selected_themes: payload.themes,
      selected_style: payload.styleId,
      preview_image_url: payload.previewImageUrl ?? null,
      quantity: payload.quantity,
      unit_price_ars: STICKER_UNIT_PRICE_ARS,
      shipping_fee_ars: shippingFee,
      total_ars: total,
      shipping_address: payload.shippingAddress,
      shipping_rule_id: shippingSelection.ruleId,
      shipping_eta_days: shippingSelection.etaDays,
      payment_provider: checkoutProvider,
      status: "pending_payment",
    };

    let insertResult = await adminClient
      .from("sticker_orders")
      .insert(insertPayload)
      .select("id")
      .single();

    if (isMissingSelectedStyleColumn(insertResult.error)) {
      const legacyPayload = { ...insertPayload };
      delete (legacyPayload as { selected_style?: string }).selected_style;
      insertResult = await adminClient.from("sticker_orders").insert(legacyPayload).select("id").single();
    }

    const { data: inserted, error: insertError } = insertResult;

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "No se pudo crear la orden de stickers.");
    }

    const stickerOrderId = String(inserted.id);
    let checkoutUrl: string;
    let providerSessionId: string;

    if (checkoutProvider === "mercadopago") {
      const preference = await createMercadoPagoPreferenceGeneric({
        baseUrl,
        title: `Plancha de stickers personalizada x${payload.quantity}`,
        amount: total,
        currency: "ARS",
        externalReference: `sticker:${stickerOrderId}`,
        metadata: {
          source: "sticker",
          sticker_order_id: stickerOrderId,
          style_id: payload.styleId,
        },
        payerEmail: payload.customerEmail,
        backUrls: {
          success: `${baseUrl}/success?provider=mercadopago&source=stickers`,
          failure: `${baseUrl}/stickers?checkout=failed`,
          pending: `${baseUrl}/success?provider=mercadopago&source=stickers&status=pending`,
        },
      });

      checkoutUrl = preference.initPoint;
      providerSessionId = preference.id;
    } else {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${baseUrl}/success?provider=stripe&source=stickers`,
        cancel_url: `${baseUrl}/stickers`,
        customer_email: payload.customerEmail,
        metadata: {
          source: "sticker",
          sticker_order_id: stickerOrderId,
          style_id: payload.styleId,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "ars",
              unit_amount: toMinorUnits(total),
              product_data: {
                name: `Plancha de stickers personalizada x${payload.quantity}`,
                description: `Incluye envío (${shippingSelection.etaDays ?? 7} días aprox.)`,
              },
            },
          },
        ],
        shipping_address_collection: { allowed_countries: ["AR"] },
        phone_number_collection: { enabled: true },
      });

      if (!session.url) {
        throw new Error("Stripe checkout session did not return a URL");
      }

      checkoutUrl = session.url;
      providerSessionId = session.id;
    }

    const { error: updateError } = await adminClient
      .from("sticker_orders")
      .update({ provider_session_id: providerSessionId })
      .eq("id", stickerOrderId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    logEvent("info", "stickers_checkout.created", { request_id: requestId, route }, {
      sticker_order_id: stickerOrderId,
      provider: checkoutProvider,
      total_ars: total,
    });

    const response = NextResponse.json({
      checkout_url: checkoutUrl,
      provider: checkoutProvider,
      session_id: providerSessionId,
      sticker_order_id: stickerOrderId,
      total_ars: total,
      shipping_eta_days: shippingSelection.etaDays,
    });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "stickers_checkout.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
