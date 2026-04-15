/**
 * Flux Kontext (Pro / Max) provider adapter via fal.ai.
 *
 * Flux Kontext is Black Forest Labs' image-to-image editor/compositor
 * that accepts reference images and keeps character consistency across
 * scenes. It's the most likely drop-in replacement for Nano Banana 2
 * at a fraction of the cost and latency.
 *
 * Two variants are supported via env:
 *   - FAL_FLUX_KONTEXT_MODEL=fal-ai/flux-pro/kontext             (Pro, single ref)
 *   - FAL_FLUX_KONTEXT_MODEL=fal-ai/flux-pro/kontext/max/multi   (Max, multi-ref, recommended)
 *
 * We default to the Max/multi variant because every call in this app
 * passes at least 2 references (child photo + base scene template).
 *
 * Pricing on fal.ai as of April 2026:
 *   Flux Kontext Pro  ≈ $0.04 / image
 *   Flux Kontext Max  ≈ $0.08 / image (multi-ref)
 */

import { getFalConfig } from "@/lib/config";
import { ensureFalConfigured, fal, fetchUrlAsDataUrl, toDataUrl } from "./fal-client";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
  ImageProviderName,
} from "./types";

type FluxVariant = "pro" | "max";

interface FluxImageResult {
  images?: Array<{ url?: string; content_type?: string }>;
  image?: { url?: string; content_type?: string };
}

function getModelId(variant: FluxVariant, override?: string): string {
  if (override) return override;
  const { fluxKontextModel } = getFalConfig();
  if (fluxKontextModel) return fluxKontextModel;
  return variant === "max"
    ? "fal-ai/flux-pro/kontext/max/multi"
    : "fal-ai/flux-pro/kontext";
}

/** Flux Kontext only accepts a handful of aspect ratio presets. Pick the closest one. */
function normalizeAspectRatio(aspectRatio?: string): string {
  if (!aspectRatio) return "1:1";
  const accepted = ["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"];
  if (accepted.includes(aspectRatio)) return aspectRatio;
  // Best-effort: convert common "WxH" notations to a ratio if needed.
  const match = aspectRatio.match(/^(\d+):(\d+)$/);
  if (!match) return "1:1";
  const w = Number(match[1]);
  const h = Number(match[2]);
  const ratio = w / h;
  // Map numeric ratio to nearest preset.
  const presets: Array<[string, number]> = [
    ["21:9", 21 / 9],
    ["16:9", 16 / 9],
    ["4:3", 4 / 3],
    ["3:2", 3 / 2],
    ["1:1", 1],
    ["2:3", 2 / 3],
    ["3:4", 3 / 4],
    ["9:16", 9 / 16],
    ["9:21", 9 / 21],
  ];
  let best = presets[0];
  for (const preset of presets) {
    if (Math.abs(preset[1] - ratio) < Math.abs(best[1] - ratio)) best = preset;
  }
  return best[0];
}

async function generateWithVariant(
  input: GenerateImageInput,
  variant: FluxVariant,
): Promise<GenerateImageResult> {
  const providerName: ImageProviderName =
    variant === "max" ? "flux-kontext-max" : "flux-kontext-pro";
  const modelId = getModelId(variant, input.modelOverride);

  try {
    ensureFalConfigured();
  } catch (error) {
    return {
      imageDataUrl: null,
      provider: "fallback",
      model: modelId,
      errorMessage: error instanceof Error ? error.message : "FAL not configured",
    };
  }

  const refs = (input.references ?? []).filter(Boolean);
  const imageUrls = refs.map((r) => toDataUrl(r));

  if (imageUrls.length === 0) {
    return {
      imageDataUrl: null,
      provider: "fallback",
      model: modelId,
      errorMessage:
        "Flux Kontext requires at least one reference image; none provided.",
    };
  }

  // Both pro and max/multi accept `image_url` (single) or `image_urls` (multi).
  // We use `image_urls` when the model is a multi endpoint, otherwise take the first.
  const isMulti = modelId.includes("/multi");
  const baseInput: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: normalizeAspectRatio(input.aspectRatio),
    num_images: 1,
    safety_tolerance: "2",
    output_format: "png",
  };
  if (isMulti) {
    baseInput.image_urls = imageUrls;
  } else {
    baseInput.image_url = imageUrls[0];
  }

  console.log(
    `[flux-kontext] model=${modelId} variant=${variant} refs=${imageUrls.length} promptLen=${input.prompt.length}`,
  );

  const maxRetries = input.maxRetries ?? 2;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fal.subscribe(modelId, {
        input: baseInput,
        logs: false,
      });

      const data = (result?.data ?? {}) as FluxImageResult;
      const imageUrl = data.images?.[0]?.url ?? data.image?.url ?? null;

      if (!imageUrl) {
        lastError = "Flux Kontext returned no image url";
        continue;
      }

      const dataUrl = await fetchUrlAsDataUrl(imageUrl, input.timeoutMs ?? 60_000);
      return {
        imageDataUrl: dataUrl,
        provider: providerName,
        model: modelId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      const delayMs = 4_000 * (attempt + 1);
      console.warn(
        `[flux-kontext] attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.slice(0, 240)}`,
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return {
    imageDataUrl: null,
    provider: "fallback",
    model: modelId,
    errorMessage: lastError ?? "Flux Kontext exhausted retries",
  };
}

export const fluxKontextProProvider: ImageProvider = {
  name: "flux-kontext-pro",
  isConfigured() {
    return Boolean(getFalConfig().apiKey);
  },
  generate(input) {
    return generateWithVariant(input, "pro");
  },
};

export const fluxKontextMaxProvider: ImageProvider = {
  name: "flux-kontext-max",
  isConfigured() {
    return Boolean(getFalConfig().apiKey);
  },
  generate(input) {
    return generateWithVariant(input, "max");
  },
};
