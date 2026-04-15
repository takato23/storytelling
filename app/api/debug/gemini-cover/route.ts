import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { generateDirectGeminiCoverPreview } from "@/lib/gemini-cover";

const DebugGeminiCoverSchema = z.object({
  imageBase64: z.string().min(50),
  childName: z.string().min(1).max(50).regex(/^[\p{L}\p{M}\p{N}\s''-]+$/u).default("Valentín"),
  model: z.string().min(1).optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const payload = DebugGeminiCoverSchema.parse(await request.json());
    const generated = await generateDirectGeminiCoverPreview({
      childPhotoDataUrl: payload.imageBase64,
      childName: payload.childName,
      modelOverride: payload.model,
    });

    return NextResponse.json({
      success: Boolean(generated.imageDataUrl),
      model: generated.model,
      provider: generated.provider,
      imageUrl: generated.imageDataUrl,
      errorMessage: generated.errorMessage ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
