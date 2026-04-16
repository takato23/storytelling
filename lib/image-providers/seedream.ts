/**
 * Seedream 4.5 provider adapter via fal.ai.
 *
 * ByteDance's Seedream supports multi-reference image-to-image with
 * native 4K output and strong character consistency across scenes.
 * v4.5 brings improved facial consistency (9.6/10) with Cross-Image Consistency Module.
 * Very competitive pricing (~$0.025–$0.04 / image).
 *
 * Model id is configurable via env:
 *   FAL_SEEDREAM_MODEL=fal-ai/bytedance/seedream/v4.5/edit       (default, multi-ref edit)
 */

import { getFalConfig } from "@/lib/config";
import { ensureFalConfigured, fal, fetchUrlAsDataUrl, toDataUrl } from "./fal-client";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
} from "./types";

interface SeedreamImageResult {
  images?: Array<{ url?: string; content_type?: string }>;
  image?: { url?: string };
}

function getModelId(override?: string): string {
  if (override) return override;
  const { seedreamModel } = getFalConfig();
  return seedreamModel ?? "fal-ai/bytedance/seedream/v4.5/edit";
}

/**
 * Seedream accepts explicit pixel dimensions rather than aspect ratios
 * in the edit endpoint. We map our `imageSize` + aspect ratio to the
 * closest multiple of 64 pixels Seedream can handle.
 */
function computeImageSize(imageSize: GenerateImageInput["imageSize"], aspectRatio?: string) {
  const target = imageSize === "4K" ? 3840 : imageSize === "2K" ? 2048 : 1024;
  const match = aspectRatio?.match(/^(\d+):(\d+)$/);
  if (!match) return { width: target, height: target };
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (w === h) return { width: target, height: target };
  if (w > h) {
    return { width: target, height: Math.round((target * h) / w / 64) * 64 };
  }
  return { width: Math.round((target * w) / h / 64) * 64, height: target };
}

async function generate(input: GenerateImageInput): Promise<GenerateImageResult> {
  const modelId = getModelId(input.modelOverride);

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
  if (refs.length === 0) {
    return {
      imageDataUrl: null,
      provider: "fallback",
      model: modelId,
      errorMessage: "Seedream edit requires at least one reference image",
    };
  }
  const imageUrls = refs.map((r) => toDataUrl(r));
  const { width, height } = computeImageSize(input.imageSize, input.aspectRatio);

  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    image_urls: imageUrls,
    image_size: { width, height },
    num_images: 1,
    enable_safety_checker: true,
  };

  console.log(
    `[seedream] model=${modelId} refs=${imageUrls.length} size=${width}x${height} promptLen=${input.prompt.length}`,
  );

  const maxRetries = input.maxRetries ?? 2;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fal.subscribe(modelId, {
        input: falInput,
        logs: false,
      });

      const data = (result?.data ?? {}) as SeedreamImageResult;
      const imageUrl = data.images?.[0]?.url ?? data.image?.url ?? null;

      if (!imageUrl) {
        lastError = "Seedream returned no image url";
        continue;
      }

      const dataUrl = await fetchUrlAsDataUrl(imageUrl, input.timeoutMs ?? 60_000);
      return {
        imageDataUrl: dataUrl,
        provider: "seedream",
        model: modelId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      const delayMs = 4_000 * (attempt + 1);
      console.warn(
        `[seedream] attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.slice(0, 240)}`,
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
    errorMessage: lastError ?? "Seedream exhausted retries",
  };
}

export const seedreamProvider: ImageProvider = {
  name: "seedream",
  isConfigured() {
    return Boolean(getFalConfig().apiKey);
  },
  generate,
};
