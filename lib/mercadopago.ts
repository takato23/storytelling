const MERCADOPAGO_API_BASE = process.env.MERCADOPAGO_API_BASE ?? "https://api.mercadopago.com";

type MpMetadata = Record<string, string | number | boolean | null | undefined>;

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");
  }
  return token;
}

function getWebhookUrl(baseUrl: string) {
  const explicitWebhookUrl = process.env.MERCADOPAGO_WEBHOOK_URL;
  if (explicitWebhookUrl) return explicitWebhookUrl;
  return `${baseUrl.replace(/\/$/, "")}/api/webhooks/mercadopago`;
}

export function getCheckoutProvider(): "mercadopago" | "stripe" {
  return process.env.CHECKOUT_PROVIDER === "stripe" ? "stripe" : "mercadopago";
}

export interface MercadoPagoPreferenceInput {
  baseUrl: string;
  title: string;
  orderId: string;
  quoteId: string;
  userId: string;
  amount: number;
  currency: "ARS" | "USD";
  payerEmail?: string | null;
}

export interface MercadoPagoPreferenceResult {
  id: string;
  initPoint: string;
}

export interface MercadoPagoPreferenceGenericInput {
  baseUrl: string;
  title: string;
  amount: number;
  currency: "ARS" | "USD";
  externalReference: string;
  metadata?: MpMetadata;
  payerEmail?: string | null;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  autoReturn?: "approved" | "all";
}

export async function createMercadoPagoPreferenceGeneric(
  input: MercadoPagoPreferenceGenericInput,
): Promise<MercadoPagoPreferenceResult> {
  const accessToken = getAccessToken();
  const webhookUrl = getWebhookUrl(input.baseUrl);
  const defaultBackUrls = {
    success: `${input.baseUrl}/success?provider=mercadopago`,
    failure: `${input.baseUrl}/crear?checkout=failed`,
    pending: `${input.baseUrl}/success?provider=mercadopago&status=pending`,
  };
  const backUrls = {
    ...defaultBackUrls,
    ...(input.backUrls ?? {}),
  };

  const response = await fetch(`${MERCADOPAGO_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: input.currency,
          unit_price: Number(input.amount.toFixed(2)),
        },
      ],
      payer: input.payerEmail
        ? {
            email: input.payerEmail,
          }
        : undefined,
      external_reference: input.externalReference,
      metadata: input.metadata ?? {},
      notification_url: webhookUrl,
      back_urls: backUrls,
      auto_return: input.autoReturn ?? "approved",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago preference error (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  const initPoint = payload.init_point || payload.sandbox_init_point;
  if (!payload.id || !initPoint) {
    throw new Error("Mercado Pago preference did not return init point");
  }

  return {
    id: payload.id,
    initPoint,
  };
}

export async function createMercadoPagoPreference(
  input: MercadoPagoPreferenceInput,
): Promise<MercadoPagoPreferenceResult> {
  return createMercadoPagoPreferenceGeneric({
    baseUrl: input.baseUrl,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    externalReference: input.orderId,
    metadata: {
      order_id: input.orderId,
      quote_id: input.quoteId,
      user_id: input.userId,
    } satisfies MpMetadata,
    payerEmail: input.payerEmail,
  });
}

export interface MercadoPagoPaymentPayload {
  id: string;
  status: string | null;
  status_detail: string | null;
  external_reference: string | null;
  metadata: Record<string, unknown>;
  transaction_amount: number | null;
  currency_id: string | null;
}

export async function getMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentPayload> {
  const accessToken = getAccessToken();
  const response = await fetch(`${MERCADOPAGO_API_BASE}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago payment error (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;

  return {
    id: String(payload.id),
    status: typeof payload.status === "string" ? payload.status : null,
    status_detail: typeof payload.status_detail === "string" ? payload.status_detail : null,
    external_reference:
      typeof payload.external_reference === "string" ? payload.external_reference : null,
    metadata:
      payload.metadata && typeof payload.metadata === "object"
        ? (payload.metadata as Record<string, unknown>)
        : {},
    transaction_amount:
      typeof payload.transaction_amount === "number" ? Number(payload.transaction_amount) : null,
    currency_id: typeof payload.currency_id === "string" ? payload.currency_id : null,
  };
}
