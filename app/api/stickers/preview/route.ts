import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/api";
import { createStickerPreviewToken } from "@/lib/sticker-preview-token";
import {
  evaluateStickerPreviewQuality,
  generateImageWithGemini,
  type StickerPreviewQualityResult,
} from "@/lib/image-generator";
import { createStickerSheetFallback } from "@/lib/sticker-fallback";
import {
  buildStickerPrompt,
  DEFAULT_STICKER_STYLE_ID,
  STICKER_STYLE_IDS,
  STICKER_STYLE_PRESETS,
  filterAllowedStickerThemes,
  type StickerStyleId,
} from "@/lib/stickers";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PreviewPayloadSchema = z.object({
  imageBase64: z.string().min(50),
  childGender: z.enum(["niña", "niño"]),
  themes: z.array(z.string().min(2)).min(1).max(6),
  styleId: z.enum(STICKER_STYLE_IDS).default(DEFAULT_STICKER_STYLE_ID),
});

function stripDataUrlPrefix(base64: string) {
  return base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
}

function estimateBytesFromBase64(base64: string) {
  const clean = stripDataUrlPrefix(base64);
  return Math.ceil((clean.length * 3) / 4);
}

function buildRetryPrompt(basePrompt: string, quality: StickerPreviewQualityResult) {
  const issueList = quality.issues.slice(0, 4).join("; ");
  const fixInstructions = quality.fixInstructions || issueList;
  if (!fixInstructions) {
    return basePrompt;
  }

  return [
    basePrompt,
    "",
    "Revision required:",
    `- Fix these issues: ${fixInstructions}`,
    "- Keep strict identity lock with the child face from the reference image.",
    "- Keep hands anatomically correct and avoid extra fingers.",
    "- Maintain clean sticker-sheet composition with separated figures.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, { key: "stickers_preview", limit: 4, windowMs: 60_000 });
    if (limited) {
      return limited;
    }

    const payload = PreviewPayloadSchema.parse(await request.json());
    const styleId: StickerStyleId = payload.styleId;

    const estimatedBytes = estimateBytesFromBase64(payload.imageBase64);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: "payload_too_large",
          message: "La imagen excede el límite de 5MB",
        },
        { status: 413 },
      );
    }

    const filteredThemes = filterAllowedStickerThemes(payload.childGender, payload.themes);
    if (filteredThemes.length === 0) {
      return NextResponse.json(
        {
          error: "invalid_themes",
          message: "Las temáticas seleccionadas no son válidas para el género elegido.",
        },
        { status: 400 },
      );
    }

    const basePrompt = buildStickerPrompt({
      childGender: payload.childGender,
      themes: filteredThemes,
      styleId,
    });
    const styleLabel = STICKER_STYLE_PRESETS[styleId]?.label ?? styleId;

    let generated = await generateImageWithGemini({
      prompt: basePrompt,
      referenceImageBase64: payload.imageBase64,
      edgeTimeoutMs: 120_000,
      maxRetries: 1,
    });
    let usedDeterministicFallback = false;

    if (!generated.imageDataUrl) {
      generated = {
        imageDataUrl: await createStickerSheetFallback({
          referenceImageBase64: payload.imageBase64,
          childGender: payload.childGender,
          themes: filteredThemes,
          styleLabel,
        }),
        provider: "fallback",
        model: "deterministic-sticker-sheet",
        errorMessage: generated.errorMessage ?? null,
      };
      usedDeterministicFallback = true;
    }

    const generatedImageDataUrl = generated.imageDataUrl;
    if (!generatedImageDataUrl) {
      return NextResponse.json(
        {
          error: "preview_unavailable",
          message:
            "No pudimos generar la previsualización en este momento. Intentá nuevamente en unos minutos.",
        },
        { status: 502 },
      );
    }

    let attempts = 1;
    let retryApplied = false;
    let quality: StickerPreviewQualityResult;

    if (usedDeterministicFallback) {
      quality = {
        pass: true,
        confidence: 0.35,
        issues: [],
        fixInstructions: "",
        model: "deterministic-fallback",
        available: false,
        rawText: null,
      };
    } else {
      quality = await evaluateStickerPreviewQuality({
        previewImageBase64: generatedImageDataUrl,
        referenceImageBase64: payload.imageBase64,
        childGender: payload.childGender,
        themes: filteredThemes,
        styleLabel,
      });
    }

    if (!usedDeterministicFallback && !quality.pass) {
      const retryPrompt = buildRetryPrompt(basePrompt, quality);
      const retried = await generateImageWithGemini({
        prompt: retryPrompt,
        referenceImageBase64: payload.imageBase64,
        edgeTimeoutMs: 120_000,
        maxRetries: 1,
      });

      if (retried.imageDataUrl) {
        attempts = 2;
        retryApplied = true;
        generated = retried;
        quality = await evaluateStickerPreviewQuality({
          previewImageBase64: retried.imageDataUrl,
          referenceImageBase64: payload.imageBase64,
          childGender: payload.childGender,
          themes: filteredThemes,
          styleLabel,
        });
      }
    }

    const approvedForCheckout = quality.pass;
    const previewToken = approvedForCheckout
      ? createStickerPreviewToken({
          childGender: payload.childGender,
          themes: filteredThemes,
          styleId,
          previewImageUrl: generatedImageDataUrl,
        })
      : null;

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageDataUrl,
      previewToken,
      approvedForCheckout,
      childGender: payload.childGender,
      themes: filteredThemes,
      styleId,
      attempts,
      quality_retry_applied: retryApplied,
      quality: {
        pass: quality.pass,
        confidence: quality.confidence,
        issues: quality.issues,
        available: quality.available,
      },
      generation_mode: generated.provider === "gemini" ? "stickers_gemini" : "stickers_fallback",
      image_provider: generated.provider,
      image_model: generated.model,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
