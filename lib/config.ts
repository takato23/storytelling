import { z } from "zod";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
const DEFAULT_MERCADOPAGO_API_BASE = "https://api.mercadopago.com";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_API_BASE: z.string().url().optional(),
  MERCADOPAGO_WEBHOOK_URL: z.string().url().optional(),
  CHECKOUT_PROVIDER: z.enum(["mercadopago", "stripe"]).optional(),
  DEFAULT_USD_TO_ARS: z.coerce.number().positive().optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  GEMINI_IMAGE_MODEL: z.string().min(1).optional(),
  GEMINI_QUALITY_MODEL: z.string().min(1).optional(),
  GEMINI_TEXT_MODEL: z.string().min(1).optional(),
  STORY_IMAGE_EDGE_URL: z.string().url().optional(),
  STORY_IMAGE_EDGE_MODEL: z.string().min(1).optional(),
  // Image provider routing (see lib/image-providers/index.ts)
  IMAGE_PROVIDER: z
    .enum(["gemini", "flux-kontext-pro", "flux-kontext-max", "seedream"])
    .optional(),
  IMAGE_PROVIDER_FALLBACKS: z.string().optional(),
  // fal.ai credentials (shared by flux-kontext and seedream adapters)
  FAL_KEY: z.string().min(1).optional(),
  FAL_FLUX_KONTEXT_MODEL: z.string().min(1).optional(),
  FAL_SEEDREAM_MODEL: z.string().min(1).optional(),
  // Privacy: retention window (hours) for uploaded child reference photos
  CHILD_PHOTO_RETENTION_HOURS: z.coerce.number().int().min(1).max(720).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  ALLOW_STORY_FALLBACK: z.enum(["true", "false"]).optional(),
  DISABLE_FREE_PREVIEWS: z.enum(["true", "false"]).optional(),
  ALLOW_LOCAL_PREVIEW_BYPASS: z.enum(["true", "false"]).optional(),
  FREE_PREVIEW_CREDITS_DEFAULT: z.coerce.number().int().min(0).optional(),
  PREVIEW_IMAGE_ESTIMATED_COST_USD: z.coerce.number().nonnegative().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  STRICT_ENV_VALIDATION: z.enum(["true", "false"]).optional(),
});

type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;
let validatedProduction = false;

function normalizeEnv(source: NodeJS.ProcessEnv) {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );
}

function readEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(normalizeEnv(process.env));
  return cachedEnv;
}

function readPublicClientEnv() {
  return {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

function requireValue(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}

export function getEnv() {
  const env = readEnv();

  return {
    ...env,
    checkoutProvider: env.CHECKOUT_PROVIDER ?? "mercadopago",
    mercadopagoApiBase: env.MERCADOPAGO_API_BASE ?? DEFAULT_MERCADOPAGO_API_BASE,
    posthogHost: env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
    googleAiApiKey: env.GEMINI_API_KEY ?? env.GOOGLE_AI_API_KEY ?? null,
    allowStoryFallback: env.ALLOW_STORY_FALLBACK === "true" || env.NODE_ENV !== "production",
    previewsDisabled: env.DISABLE_FREE_PREVIEWS === "true",
    allowLocalPreviewBypass:
      env.ALLOW_LOCAL_PREVIEW_BYPASS === "true" || env.NODE_ENV !== "production",
    freePreviewCreditsDefault: env.FREE_PREVIEW_CREDITS_DEFAULT ?? 2,
    previewImageEstimatedCostUsd: env.PREVIEW_IMAGE_ESTIMATED_COST_USD ?? 0.05,
  };
}

export function isProduction() {
  return getEnv().NODE_ENV === "production";
}

function shouldValidateProductionEnvironment(env: AppEnv) {
  return env.VERCEL_ENV === "production" || env.STRICT_ENV_VALIDATION === "true";
}

export function getSiteUrl() {
  return getEnv().NEXT_PUBLIC_SITE_URL ?? null;
}

export function getCanonicalSiteUrl() {
  const siteUrl = getSiteUrl();
  return siteUrl ? siteUrl.replace(/\/$/, "") : null;
}

export function getBaseUrl(request?: Request) {
  const canonicalSiteUrl = getCanonicalSiteUrl();
  if (canonicalSiteUrl) return canonicalSiteUrl;

  if (!request) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }

  if (isProduction() && shouldValidateProductionEnvironment(getEnv())) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production");
  }

  const origin = request.headers.get("origin");
  return origin ?? new URL(request.url).origin;
}

export function getPublicSiteOriginForMetadata() {
  const siteUrl = getCanonicalSiteUrl();
  return siteUrl ? new URL(siteUrl) : undefined;
}

export function getSupabaseConfig() {
  const env = typeof window === "undefined" ? getEnv() : readPublicClientEnv();
  return {
    url: requireValue(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: typeof window === "undefined" ? getEnv().SUPABASE_SERVICE_ROLE_KEY : undefined,
  };
}

export function getStripeConfig() {
  const env = getEnv();
  return {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  };
}

export function getMercadoPagoConfig() {
  const env = getEnv();
  return {
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
    apiBase: env.mercadopagoApiBase,
    webhookUrl: env.MERCADOPAGO_WEBHOOK_URL ?? null,
  };
}

export function getAnalyticsConfig() {
  const env = getEnv();
  return {
    posthogKey: env.NEXT_PUBLIC_POSTHOG_KEY ?? null,
    posthogHost: env.posthogHost,
  };
}

export function getGeminiConfig() {
  const env = getEnv();
  return {
    apiKey: env.googleAiApiKey,
    imageModel: env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview",
    qualityModel: env.GEMINI_QUALITY_MODEL ?? env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash",
    // NOTE: no default fallback URL. The previous hardcoded Supabase endpoint
    // belonged to a retired project; configure STORY_IMAGE_EDGE_URL explicitly
    // if you want to route Gemini calls through an edge function.
    imageEdgeUrl: env.STORY_IMAGE_EDGE_URL ?? null,
    imageEdgeModel: env.STORY_IMAGE_EDGE_MODEL ?? null,
  };
}

/**
 * fal.ai configuration shared across Flux Kontext and Seedream adapters.
 * Without FAL_KEY, those providers are reported as not configured and the
 * router falls through to the next entry in the chain.
 */
export function getFalConfig() {
  const env = getEnv();
  return {
    apiKey: env.FAL_KEY ?? null,
    fluxKontextModel: env.FAL_FLUX_KONTEXT_MODEL ?? null,
    seedreamModel: env.FAL_SEEDREAM_MODEL ?? null,
  };
}

/**
 * Primary + fallback image provider chain. Example:
 *   IMAGE_PROVIDER=flux-kontext-max
 *   IMAGE_PROVIDER_FALLBACKS=seedream,gemini
 */
export function getImageRoutingConfig() {
  const env = getEnv();
  const fallbacks = (env.IMAGE_PROVIDER_FALLBACKS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    primary: env.IMAGE_PROVIDER ?? null,
    fallbacks,
  };
}

/**
 * Privacy / retention configuration for uploaded child photos. Defaults to
 * 24 hours. See docs/privacy/POLICY.md and scripts/privacy/purge-child-photos.ts.
 */
export function getPrivacyConfig() {
  const env = getEnv();
  return {
    childPhotoRetentionHours: env.CHILD_PHOTO_RETENTION_HOURS ?? 24,
  };
}

export function validateProductionEnvironment() {
  if (validatedProduction) return;

  const env = getEnv();
  if (env.NODE_ENV !== "production") return;
  if (!shouldValidateProductionEnvironment(env)) return;

  requireValue(env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");
  requireValue(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  requireValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  requireValue(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  requireValue(env.GEMINI_API_KEY ?? env.GOOGLE_AI_API_KEY ?? undefined, "GEMINI_API_KEY or GOOGLE_AI_API_KEY");

  if ((env.CHECKOUT_PROVIDER ?? "mercadopago") === "mercadopago") {
    requireValue(env.MERCADOPAGO_ACCESS_TOKEN, "MERCADOPAGO_ACCESS_TOKEN");
  }

  if (env.CHECKOUT_PROVIDER === "stripe") {
    requireValue(env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    requireValue(env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET");
  }

  validatedProduction = true;
}
