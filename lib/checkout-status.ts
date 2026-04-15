import { getEnv } from "@/lib/config";

export interface CheckoutAvailability {
  provider: "mercadopago" | "stripe";
  enabled: boolean;
  reason: string | null;
  message: string | null;
}

export function getCheckoutAvailability(): CheckoutAvailability {
  const env = getEnv();
  const provider = env.checkoutProvider;

  if (provider === "mercadopago") {
    const enabled = Boolean(env.MERCADOPAGO_ACCESS_TOKEN);
    return {
      provider,
      enabled,
      reason: enabled ? null : "missing_mercadopago_credentials",
      message: enabled
        ? null
        : "Mercado Pago todavía está en configuración. La experiencia se puede revisar, pero el cobro queda desactivado hasta cargar las credenciales finales.",
    };
  }

  const enabled = Boolean(env.STRIPE_SECRET_KEY);
  return {
    provider,
    enabled,
    reason: enabled ? null : "missing_stripe_credentials",
    message: enabled
      ? null
      : "Stripe todavía está en configuración. La experiencia se puede revisar, pero el cobro queda desactivado hasta cargar las credenciales finales.",
  };
}
