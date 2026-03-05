import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { generateImageWithGemini } from "@/lib/image-generator";
import { STORIES } from "@/lib/stories";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  try {
    const payload = PersonalizePayloadSchema.parse(await request.json());

    if (payload.action === "analyze") {
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

      return NextResponse.json({
        success: true,
        features: buildFallbackFeatures(),
        analysis_mode: "safe_fallback",
      });
    }

    const story = STORIES.find((item) => item.id === payload.bookId);
    const fallbackImage = story?.coverImage ?? "/stories/space-1.jpg";
    const childDescription = payload.childFeatures
      ? JSON.stringify(payload.childFeatures).slice(0, 600)
      : "rasgos infantiles naturales";

    if (payload.imageBase64) {
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
    }

    const prompt = [
      "Ilustración para portada de cuento infantil, cálida y premium.",
      `Historia: ${story?.title ?? "Aventura personalizada"}.`,
      "Estilo visual: libro infantil editorial, colores vivos, composición limpia.",
      `Rasgos del protagonista: ${childDescription}.`,
      "Sin texto incrustado, sin marcas de agua.",
    ].join(" ");

    const generated = await generateImageWithGemini({
      prompt,
      referenceImageBase64: payload.imageBase64 ?? null,
    });

    return NextResponse.json({
      success: true,
      imageUrl: generated.imageDataUrl ?? fallbackImage,
      sceneText: "Vista previa generada. La versión final se procesa automáticamente tras el pago.",
      generation_mode: generated.provider === "gemini" ? "preview_gemini" : "preview_fallback",
      image_provider: generated.provider,
      image_model: generated.model,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
