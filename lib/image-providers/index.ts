/**
 * Image provider router.
 *
 * Reads `IMAGE_PROVIDER` from env and returns the matching adapter.
 * Supports a fallback chain via `IMAGE_PROVIDER_FALLBACKS` (comma-
 * separated) so a single provider outage degrades gracefully instead
 * of crashing the pipeline.
 *
 * Usage:
 *   import { generateImage } from "@/lib/image-providers";
 *   const result = await generateImage({ prompt, references, imageSize });
 */

import { getImageRoutingConfig } from "@/lib/config";
import { geminiProvider } from "./gemini";
import { fluxKontextMaxProvider, fluxKontextProProvider } from "./flux-kontext";
import { seedreamProvider } from "./seedream";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
  ImageProviderName,
} from "./types";

const REGISTRY: Record<ImageProviderName, ImageProvider> = {
  gemini: geminiProvider,
  "flux-kontext-pro": fluxKontextProProvider,
  "flux-kontext-max": fluxKontextMaxProvider,
  seedream: seedreamProvider,
};

export function getProvider(name: ImageProviderName): ImageProvider {
  const provider = REGISTRY[name];
  if (!provider) {
    throw new Error(`Unknown image provider: ${name}`);
  }
  return provider;
}

export function listProviders(): ImageProvider[] {
  return Object.values(REGISTRY);
}

function parseProviderName(raw: string | null | undefined): ImageProviderName | null {
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized in REGISTRY ? (normalized as ImageProviderName) : null;
}

/** Resolve the primary + fallback chain from env. */
function resolveProviderChain(overridePrimary?: ImageProviderName): ImageProvider[] {
  const routing = getImageRoutingConfig();
  const primary =
    overridePrimary ??
    parseProviderName(routing.primary) ??
    "gemini";

  const fallbacks = routing.fallbacks
    .map(parseProviderName)
    .filter((name): name is ImageProviderName => name !== null && name !== primary);

  const seen = new Set<ImageProviderName>();
  const chain: ImageProvider[] = [];
  for (const name of [primary, ...fallbacks]) {
    if (seen.has(name)) continue;
    seen.add(name);
    chain.push(REGISTRY[name]);
  }
  return chain;
}

export interface RouterOptions {
  /** Force a specific primary provider regardless of env. */
  provider?: ImageProviderName;
  /** Disable the fallback chain (return the first provider's result even on failure). */
  disableFallback?: boolean;
  /** Profile-aware routing: "preview" uses faster provider (Gemini), "print" uses primary (Seedream). */
  profile?: "preview" | "print";
}

/**
 * Primary entrypoint. Picks the active provider (from env or override),
 * tries it, and falls through the configured fallback chain on failure.
 */
export async function generateImage(
  input: GenerateImageInput,
  options: RouterOptions = {},
): Promise<GenerateImageResult> {
  // Profile-aware routing: preview uses faster provider (Gemini), print uses primary (Seedream)
  let primaryOverride = options.provider;
  if (options.profile === "preview") {
    console.log("[image-router] profile=preview, using gemini for faster generation (1-3s vs 10-15s)");
    primaryOverride = "gemini";
  } else if (options.profile === "print") {
    console.log("[image-router] profile=print, using configured primary provider (seedream)");
  }

  const chain = resolveProviderChain(primaryOverride);
  const effectiveChain = options.disableFallback ? chain.slice(0, 1) : chain;

  let lastResult: GenerateImageResult | null = null;

  for (const provider of effectiveChain) {
    if (!provider.isConfigured()) {
      console.warn(`[image-router] provider ${provider.name} is not configured; skipping`);
      continue;
    }

    const startedAt = Date.now();
    const result = await provider.generate(input);
    result.latencyMs = Date.now() - startedAt;

    if (result.imageDataUrl) {
      return result;
    }

    lastResult = result;
    console.warn(
      `[image-router] provider ${provider.name} failed: ${result.errorMessage?.slice(0, 200) ?? "unknown"}`,
    );
  }

  return (
    lastResult ?? {
      imageDataUrl: null,
      provider: "fallback",
      model: "none",
      errorMessage: "No image provider is configured",
    }
  );
}

export type { GenerateImageInput, GenerateImageResult, ImageProvider, ImageProviderName } from "./types";
