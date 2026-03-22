import Stripe from "stripe";
import { getStripeConfig } from "@/lib/config";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const { secretKey } = getStripeConfig();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const { webhookSecret } = getStripeConfig();
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  return webhookSecret;
}
