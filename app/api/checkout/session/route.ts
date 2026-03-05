import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { checkoutPayloadSchema, createOrderQuote } from "@/lib/checkout";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { insertOrderEvent } from "@/lib/orders";
import {
  createMercadoPagoPreference,
  getCheckoutProvider,
} from "@/lib/mercadopago";
import { toMinorUnits } from "@/lib/pricing";
import { getStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { CreateCheckoutSessionRequestSchema } from "@/lib/types";

function getBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || new URL(request.url).origin;
}

async function createStripeCheckoutForCart(
  user: { id: string; email?: string | null },
  baseUrl: string,
  quote: ReturnType<typeof createOrderQuote>,
) {
  const stripe = getStripeClient();
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/crear`,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      source: "cart",
    },
    line_items: quote.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: quote.currency.toLowerCase(),
        unit_amount: toMinorUnits(item.unitPrice),
        product_data: {
          name: item.title,
          description: item.description || undefined,
          images: item.image && item.image.startsWith("http") ? [item.image] : undefined,
        },
      },
    })),
  });

  if (!stripeSession.url) {
    throw new Error("Stripe checkout session did not return a URL");
  }

  return {
    checkoutUrl: stripeSession.url,
    sessionId: stripeSession.id,
    provider: "stripe" as const,
  };
}

async function createStripeCheckoutForQuote(params: {
  baseUrl: string;
  user: { id: string; email?: string | null };
  quote: Record<string, unknown>;
  orderId: string;
  storyTitle: string | null;
}) {
  const stripe = getStripeClient();
  const quoteId = String(params.quote.id);
  const quoteTotal = Number(params.quote.total);
  const quoteCurrency = String(params.quote.currency);
  const quoteFormat = String(params.quote.format);

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${params.baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.baseUrl}/crear`,
    customer_email: params.user.email ?? undefined,
    metadata: {
      order_id: params.orderId,
      quote_id: quoteId,
      user_id: params.user.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: quoteCurrency.toLowerCase(),
          unit_amount: toMinorUnits(quoteTotal),
          product_data: {
            name: params.storyTitle
              ? `${params.storyTitle} (${quoteFormat})`
              : `StoryMagic (${quoteFormat})`,
          },
        },
      },
    ],
    shipping_address_collection:
      quoteFormat === "print"
        ? {
            allowed_countries: ["AR"],
          }
        : undefined,
    phone_number_collection:
      quoteFormat === "print"
        ? {
            enabled: true,
          }
        : undefined,
  });

  if (!stripeSession.url) {
    throw new Error("Stripe checkout session did not return a URL");
  }

  return {
    checkoutUrl: stripeSession.url,
    sessionId: stripeSession.id,
    provider: "stripe" as const,
  };
}

async function createMercadoPagoCheckoutForQuote(params: {
  baseUrl: string;
  user: { id: string; email?: string | null };
  quote: Record<string, unknown>;
  orderId: string;
  storyTitle: string | null;
}) {
  const quoteId = String(params.quote.id);
  const quoteTotal = Number(params.quote.total);
  const quoteCurrency = String(params.quote.currency) === "USD" ? "USD" : "ARS";
  const quoteFormat = String(params.quote.format);

  const preference = await createMercadoPagoPreference({
    baseUrl: params.baseUrl,
    title: params.storyTitle
      ? `${params.storyTitle} (${quoteFormat})`
      : `StoryMagic (${quoteFormat})`,
    orderId: params.orderId,
    quoteId,
    userId: params.user.id,
    amount: quoteTotal,
    currency: quoteCurrency,
    payerEmail: params.user.email ?? undefined,
  });

  return {
    checkoutUrl: preference.initPoint,
    sessionId: preference.id,
    provider: "mercadopago" as const,
  };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/checkout/session";
  try {
    const { user } = await requireAuthenticatedUser();
    logEvent("info", "checkout_session.request", { request_id: requestId, route, user_id: user.id });
    const rawPayload = await request.json();
    const baseUrl = getBaseUrl(request);

    const cartPayload = checkoutPayloadSchema.safeParse(rawPayload);
    if (cartPayload.success) {
      const quote = createOrderQuote(cartPayload.data.items);
      const checkout = await createStripeCheckoutForCart(
        { id: user.id, email: user.email },
        baseUrl,
        quote,
      );

      const response = NextResponse.json({
        checkout_url: checkout.checkoutUrl,
        url: checkout.checkoutUrl,
        session_id: checkout.sessionId,
        provider: checkout.provider,
      });
      logEvent(
        "info",
        "checkout_session.created",
        {
          request_id: requestId,
          route,
          user_id: user.id,
        },
        {
          source: "cart",
          session_id: checkout.sessionId,
          provider: checkout.provider,
        },
      );
      return setRequestIdHeader(response, requestId);
    }

    const payload = CreateCheckoutSessionRequestSchema.parse(rawPayload);
    const adminClient = createSupabaseAdminClient();

    const { data: quote, error: quoteError } = await adminClient
      .from("order_quotes")
      .select("*")
      .eq("id", payload.quote_id)
      .maybeSingle();

    if (quoteError || !quote) {
      throw new ApiError(404, "not_found", "Quote not found");
    }

    if (quote.user_id !== user.id) {
      throw new ApiError(404, "not_found", "Quote not found");
    }

    if (new Date(String(quote.expires_at)).getTime() < Date.now()) {
      throw new ApiError(409, "quote_expired", "Quote expired");
    }

    const selectedProvider = getCheckoutProvider();
    let orderId = quote.order_id as string | null;
    let orderStatusBeforeCheckout: string | null = null;

    if (!orderId) {
      const { data: order, error: orderError } = await adminClient
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending_payment",
          payment_provider: selectedProvider,
          currency: quote.currency,
          fx_rate_snapshot: quote.fx_rate_snapshot,
          subtotal: quote.subtotal,
          shipping_fee: quote.shipping_fee,
          total: quote.total,
          quote_expires_at: quote.expires_at,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message ?? "Failed to create order");
      }

      orderId = String(order.id);
      orderStatusBeforeCheckout = "pending_payment";

      const { error: itemError } = await adminClient.from("order_items").insert({
        order_id: orderId,
        story_id: quote.story_id,
        format: quote.format,
        print_options_snapshot: quote.print_options || {},
        price_snapshot: {
          subtotal: quote.subtotal,
          shipping_fee: quote.shipping_fee,
          total: quote.total,
          currency: quote.currency,
          fx_rate_snapshot: quote.fx_rate_snapshot,
          quote_id: quote.id,
        },
        quantity: 1,
      });

      if (itemError) {
        throw new Error(itemError.message);
      }

      const { error: linkError } = await adminClient
        .from("order_quotes")
        .update({ order_id: orderId })
        .eq("id", quote.id);

      if (linkError) {
        throw new Error(linkError.message);
      }

      await insertOrderEvent(adminClient, {
        orderId,
        eventType: "order_created_from_quote",
        fromStatus: null,
        toStatus: "pending_payment",
        note: "Order created from quote",
      });
    } else {
      const { data: existingOrder, error: existingOrderError } = await adminClient
        .from("orders")
        .select("id,user_id,status")
        .eq("id", orderId)
        .maybeSingle();

      if (existingOrderError || !existingOrder) {
        throw new ApiError(404, "not_found", "Order not found");
      }

      if (String(existingOrder.user_id) !== user.id) {
        throw new ApiError(404, "not_found", "Order not found");
      }

      orderStatusBeforeCheckout = String(existingOrder.status);
    }

    const { data: story } = await adminClient
      .from("stories")
      .select("title")
      .eq("id", quote.story_id)
      .maybeSingle();

    const checkout =
      selectedProvider === "mercadopago"
        ? await createMercadoPagoCheckoutForQuote({
            baseUrl,
            user: { id: user.id, email: user.email },
            quote: quote as Record<string, unknown>,
            orderId: String(orderId),
            storyTitle: story?.title ? String(story.title) : null,
          })
        : await createStripeCheckoutForQuote({
            baseUrl,
            user: { id: user.id, email: user.email },
            quote: quote as Record<string, unknown>,
            orderId: String(orderId),
            storyTitle: story?.title ? String(story.title) : null,
          });

    const { error: paymentError } = await adminClient.from("payments").upsert(
      {
        order_id: orderId,
        provider: checkout.provider,
        provider_session_id: checkout.sessionId,
        status: "pending",
        amount: quote.total,
        currency: quote.currency,
      },
      { onConflict: "provider_session_id" },
    );

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: orderUpdateError } = await adminClient
      .from("orders")
      .update({ status: "pending_payment", payment_provider: checkout.provider })
      .eq("id", orderId);

    if (orderUpdateError) {
      throw new Error(orderUpdateError.message);
    }

    await insertOrderEvent(adminClient, {
      orderId: String(orderId),
      eventType: "checkout_session_created",
      fromStatus: orderStatusBeforeCheckout ?? "draft",
      toStatus: "pending_payment",
      payload: {
        provider: checkout.provider,
        provider_session_id: checkout.sessionId,
      },
    });

    const response = NextResponse.json({
      checkout_url: checkout.checkoutUrl,
      url: checkout.checkoutUrl,
      session_id: checkout.sessionId,
      provider: checkout.provider,
    });
    logEvent(
      "info",
      "checkout_session.created",
      {
        request_id: requestId,
        route,
        user_id: user.id,
        order_id: String(orderId),
      },
      {
        source: "order_quote",
        session_id: checkout.sessionId,
        quote_id: String(quote.id),
        provider: checkout.provider,
      },
    );
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "checkout_session.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
