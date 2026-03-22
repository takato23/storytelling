import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getEnv } from "@/lib/config";
import { generateImageWithGemini } from "@/lib/image-generator";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { finalizePreviewGeneration, reservePreviewCredit } from "@/lib/preview-limits";
import { addPreviewWatermark } from "@/lib/preview-watermark";
import { enforceRateLimit } from "@/lib/rate-limit";
import { STORIES } from "@/lib/stories";
import { createSupabaseAdminClient } from "@/lib/supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PREVIEW_STYLE_BRAND =
  "Ilustración CGI infantil premium, render 3D tipo Pixar, iluminación cinematográfica suave, atmósfera cálida y amigable, detalles limpios, encuadre editorial.";

const AnalyzePayloadSchema = z.object({
  action: z.literal("analyze"),
  imageBase64: z.string().min(50),
});

const GeneratePreviewPayloadSchema = z.object({
  action: z.literal("generate"),
  bookId: z.string().min(1),
  childFeatures: z.record(z.string(), z.unknown()).optional(),
  imageBase64: z.string().min(50).optional(),
});

const PersonalizePayloadSchema = z.union([AnalyzePayloadSchema, GeneratePreviewPayloadSchema]);

export const runtime = "nodejs";

function stripDataUrlPrefix(base64: string) {
  return base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
}

function estimateBytesFromBase64(base64: string) {
  const clean = stripDataUrlPrefix(base64);
  return Math.ceil((clean.length * 3) / 4);
}

function buildFallbackFeatures() {
  return {
    hairColor: "castaño",
    hairType: "ondulado",
    skinTone: "medio",
    eyeColor: "marrón",
    approximateAge: 6,
    gender: "niño",
    distinctiveFeatures: null,
    faceShape: "ovalado",
  };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/personalize";
  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null;
  let previewUsageId: string | null = null;

  try {
    const limited = enforceRateLimit(request, { key: route, limit: 8, windowMs: 60_000 });
    if (limited) {
      return setRequestIdHeader(limited, requestId);
    }

    const payload = PersonalizePayloadSchema.parse(await request.json());

    if (payload.action === "analyze") {
      const estimatedBytes = estimateBytesFromBase64(payload.imageBase64);
      if (estimatedBytes > MAX_IMAGE_BYTES) {
        const response = NextResponse.json(
          {
            error: "payload_too_large",
            message: "La imagen excede el límite de 5MB",
          },
          { status: 413 },
        );
        return setRequestIdHeader(response, requestId);
      }

      const response = NextResponse.json({
        success: true,
        features: buildFallbackFeatures(),
        analysis_mode: "safe_fallback",
      });
      return setRequestIdHeader(response, requestId);
    }

    const story = STORIES.find((item) => item.id === payload.bookId);
    const fallbackImage = story?.coverImage ?? "/stories/space-1.jpg";
    const childDescription = payload.childFeatures
      ? JSON.stringify(payload.childFeatures).slice(0, 600)
      : "rasgos infantiles naturales";

    if (payload.imageBase64) {
      const estimatedBytes = estimateBytesFromBase64(payload.imageBase64);
      if (estimatedBytes > MAX_IMAGE_BYTES) {
        const response = NextResponse.json(
          {
            error: "payload_too_large",
            message: "La imagen excede el límite de 5MB",
          },
          { status: 413 },
        );
        return setRequestIdHeader(response, requestId);
      }
    }

    const { user } = await requireAuthenticatedUser();
    const previewAdminClient = createSupabaseAdminClient();
    adminClient = previewAdminClient;
    const previewReservation = await reservePreviewCredit(previewAdminClient, {
      userId: user.id,
      storyId: payload.bookId,
      imageBase64: payload.imageBase64 ?? null,
    });
    previewUsageId = previewReservation.usageId;

    const prompt = [
      "Ilustración para portada de cuento infantil, cálida y premium.",
      `Historia: ${story?.title ?? "Aventura personalizada"}.`,
      `Estilo visual: ${PREVIEW_STYLE_BRAND}`,
      `Rasgos del protagonista: ${childDescription}.`,
      "Sin texto incrustado.",
    ].join(" ");

    const generated = await generateImageWithGemini({
      prompt,
      referenceImageBase64: payload.imageBase64 ?? null,
    });

    if (!generated.imageDataUrl) {
      await finalizePreviewGeneration(previewAdminClient, {
        usageId: previewUsageId,
        status: "failed",
        provider: generated.provider,
        model: generated.model,
        errorMessage: "Preview generation unavailable",
      });
      const response = NextResponse.json(
        {
          error: "preview_unavailable",
          message: "No pudimos generar la vista previa en este momento.",
          imageUrl: getEnv().NODE_ENV === "production" ? null : fallbackImage,
          sceneText: "Intentá nuevamente en unos minutos.",
          generation_mode: "preview_unavailable",
          image_provider: generated.provider,
          image_model: generated.model,
          preview_credits_remaining: previewReservation.remainingCredits,
        },
        { status: 503 },
      );
      return setRequestIdHeader(response, requestId);
    }

    await finalizePreviewGeneration(previewAdminClient, {
      usageId: previewUsageId,
      status: "succeeded",
      provider: generated.provider,
      model: generated.model,
    });

    const watermarkedPreview = addPreviewWatermark(generated.imageDataUrl);

    logEvent("info", "preview_generated", { request_id: requestId, route }, {
      book_id: payload.bookId,
      user_id: user.id,
      image_provider: generated.provider,
      image_model: generated.model,
    });

    const response = NextResponse.json({
      success: true,
      imageUrl: watermarkedPreview,
      sceneText: "Vista previa generada con marca de agua. La versión final en alta calidad se procesa tras el pago.",
      generation_mode: generated.provider === "gemini" ? "preview_gemini" : "preview_fallback",
      image_provider: generated.provider,
      image_model: generated.model,
      preview_credits_remaining: previewReservation.remainingCredits,
    });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    if (previewUsageId && adminClient) {
      try {
        await finalizePreviewGeneration(adminClient, {
          usageId: previewUsageId,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unexpected error",
        });
      } catch {
        // Do not mask the main response if usage logging fails.
      }
    }
    logEvent("error", "preview_generation.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
