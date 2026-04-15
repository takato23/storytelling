/**
 * Gemini (Nano Banana 2) image provider adapter.
 *
 * Wraps the existing Supabase edge function + direct SDK fallback that
 * previously lived in `lib/image-generator.ts`. The public contract is
 * now the `ImageProvider` interface.
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { getGeminiConfig } from "@/lib/config";
import { normalizeImageDataUrlForGemini } from "@/lib/image-normalize";
import { recordGeminiCall } from "@/lib/gemini-quota";
import {
  BASE_RETRY_DELAY_MS,
  MAX_RETRIES,
  isQuotaZeroError,
  isRateLimitError,
  parseRetryDelayMs,
} from "@/lib/gemini-retry";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageProvider,
} from "./types";

const EDGE_MAX_RETRIES = 2;
const EDGE_RETRY_DELAY_MS = 8_000;

function stripBase64Prefix(value: string) {
  return value.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
}

function toRemoteModelName(model: string) {
  return model.startsWith("models/") ? model : `models/${model}`;
}

function toImagePart(base64: string) {
  return {
    inlineData: {
      data: stripBase64Prefix(base64),
      mimeType: "image/jpeg",
    },
  };
}

function extractInlineImageData(candidates: Array<unknown> | undefined) {
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } })
      ?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }
  }
  return null;
}

function extractTextFromCandidates(candidates: Array<unknown> | undefined): string | null {
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: Array<{ text?: string }> } })?.content?.parts;
    if (!Array.isArray(parts)) continue;
    const textParts = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter((value) => value.length > 0);
    if (textParts.length > 0) return textParts.join("\n").trim();
  }
  return null;
}

async function generateImageViaEdgeFunction(input: {
  prompt: string;
  references: string[];
  model: string;
  timeoutMs?: number;
}): Promise<GenerateImageResult | null> {
  const { imageEdgeUrl, imageEdgeModel } = getGeminiConfig();
  if (!imageEdgeUrl) return null;

  const requestBody = JSON.stringify({
    prompt: input.prompt,
    model: toRemoteModelName(imageEdgeModel || input.model),
    referenceImageBase64s: input.references,
  });

  for (let attempt = 0; attempt <= EDGE_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 90_000);

    try {
      if (attempt > 0) {
        console.log(`[gemini edge] retry ${attempt}/${EDGE_MAX_RETRIES}`);
      }

      const response = await fetch(imageEdgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; imageDataUrl?: string; model?: string; error?: string; message?: string }
        | null;

      if (response.ok && payload?.success && typeof payload.imageDataUrl === "string") {
        return {
          imageDataUrl: payload.imageDataUrl,
          provider: "gemini",
          model: typeof payload.model === "string" ? payload.model : input.model,
        };
      }

      const isTransient = response.status === 503 || response.status === 429 || response.status === 500;
      if (isTransient && attempt < EDGE_MAX_RETRIES) {
        const delayMs = EDGE_RETRY_DELAY_MS * (attempt + 1);
        console.warn(`[gemini edge] transient ${response.status}, retry in ${Math.round(delayMs / 1000)}s`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      const errorMessage =
        (payload && typeof payload.error === "string" && payload.error) ||
        (payload && typeof payload.message === "string" && payload.message) ||
        `Edge image generation failed with status ${response.status}`;

      return {
        imageDataUrl: null,
        provider: "fallback",
        model: input.model,
        errorMessage,
      };
    } catch (error) {
      if (attempt < EDGE_MAX_RETRIES) {
        const delayMs = EDGE_RETRY_DELAY_MS * (attempt + 1);
        console.warn(
          `[gemini edge] network error, retry in ${Math.round(delayMs / 1000)}s`,
          error instanceof Error ? error.message : error,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return {
        imageDataUrl: null,
        provider: "fallback",
        model: input.model,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

async function generate(input: GenerateImageInput): Promise<GenerateImageResult> {
  const { apiKey, imageModel, imageEdgeUrl } = getGeminiConfig();
  const model = input.modelOverride ?? imageModel;
  const maxRetries = input.maxRetries ?? MAX_RETRIES;
  const rawReferences = (input.references ?? []).filter(
    (value, index, array) => Boolean(value) && array.indexOf(value) === index,
  );

  console.log(
    `[gemini] model=${model} refs=${rawReferences.length} promptLen=${input.prompt.length} size=${input.imageSize ?? "2K"}`,
  );

  let references: string[] = [];
  try {
    references = await Promise.all(
      rawReferences.map((reference) =>
        normalizeImageDataUrlForGemini(reference, {
          maxDimension: 768,
          quality: 84,
        }),
      ),
    );
  } catch (normalizeError) {
    console.error(
      "[gemini] failed to normalize references:",
      normalizeError instanceof Error ? normalizeError.message : normalizeError,
    );
    return {
      imageDataUrl: null,
      provider: "fallback",
      model,
      errorMessage: normalizeError instanceof Error ? normalizeError.message : "Failed to normalize references",
    };
  }

  // 1) Try the Supabase edge function first when configured.
  const edgeResult = await generateImageViaEdgeFunction({
    prompt: input.prompt,
    references,
    model,
    timeoutMs: input.timeoutMs,
  });

  if (edgeResult?.imageDataUrl) {
    recordGeminiCall("image", "success");
    return edgeResult;
  }

  if (edgeResult?.errorMessage) {
    console.warn(`[gemini] edge failed: ${edgeResult.errorMessage.slice(0, 220)}`);
    if (imageEdgeUrl) {
      // Edge is the authoritative billed path; don't fall back to a key that is likely exhausted.
      recordGeminiCall("image", "error");
      return edgeResult;
    }
  }

  // 2) Direct SDK fallback (only when no edge is configured OR edge returned null).
  if (!apiKey) {
    recordGeminiCall("image", "fallback");
    return {
      imageDataUrl: null,
      provider: "fallback",
      model,
      errorMessage: imageEdgeUrl
        ? "Edge image generation failed and no local API key is configured"
        : "No API key configured",
    };
  }

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: input.prompt },
  ];
  for (const reference of references) {
    parts.push(toImagePart(reference));
  }

  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) console.log(`[gemini direct] retry ${attempt}/${maxRetries}`);

      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          imageConfig: {
            aspectRatio: input.aspectRatio ?? "1:1",
            imageSize: input.imageSize ?? "2K",
          },
        },
      });

      const image = extractInlineImageData(result.candidates as Array<unknown> | undefined);

      if (!image?.data) {
        const textContent = extractTextFromCandidates(result.candidates as Array<unknown> | undefined);
        console.warn(`[gemini direct] no image in response. Text: ${textContent?.slice(0, 200) ?? "none"}`);
        return {
          imageDataUrl: null,
          provider: "fallback",
          model,
          errorMessage: textContent?.slice(0, 280) ?? "Provider returned no image data",
        };
      }

      recordGeminiCall("image", "success");
      return {
        imageDataUrl: `data:${image.mimeType};base64,${image.data}`,
        provider: "gemini",
        model,
      };
    } catch (error) {
      const isRateLimit = isRateLimitError(error);
      const isPermanentQuotaFailure = isQuotaZeroError(error);

      if (isRateLimit && !isPermanentQuotaFailure && attempt < maxRetries) {
        recordGeminiCall("image", "rate_limit");
        const hintMs = parseRetryDelayMs(error);
        const delayMs = hintMs ?? BASE_RETRY_DELAY_MS * (attempt + 1);
        console.warn(`[gemini direct] 429, attempt ${attempt + 1}/${maxRetries + 1}, wait ${Math.round(delayMs / 1000)}s`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      recordGeminiCall("image", isPermanentQuotaFailure ? "quota_error" : "error");
      console.error(
        "[gemini direct] ERROR:",
        error instanceof Error ? error.message.slice(0, 400) : error,
      );
      return {
        imageDataUrl: null,
        provider: "fallback",
        model,
        errorMessage: error instanceof Error ? error.message.slice(0, 280) : String(error),
      };
    }
  }

  return {
    imageDataUrl: null,
    provider: "fallback",
    model,
    errorMessage: "Image generation exhausted retries without returning an image",
  };
}

export const geminiProvider: ImageProvider = {
  name: "gemini",
  isConfigured() {
    const { apiKey, imageEdgeUrl } = getGeminiConfig();
    return Boolean(apiKey || imageEdgeUrl);
  },
  generate,
};
