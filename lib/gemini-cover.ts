import { readPublicAssetAsDataUrl } from "@/lib/book-assets";
import { generateImageWithGemini } from "@/lib/image-generator";

function buildCoverPrompt(
  childName: string,
  childFeatures?: Record<string, unknown> | null,
) {
  const featureLines: string[] = [];
  if (childFeatures) {
    if (typeof childFeatures.hairColor === "string") featureLines.push(`${childFeatures.hairColor} hair`);
    if (typeof childFeatures.hairType === "string") featureLines.push(`${childFeatures.hairType} hair style`);
    if (typeof childFeatures.skinTone === "string") featureLines.push(`${childFeatures.skinTone} skin tone`);
    if (typeof childFeatures.eyeColor === "string") featureLines.push(`${childFeatures.eyeColor} eyes`);
    if (typeof childFeatures.approximateAge === "number") featureLines.push(`about ${Math.round(childFeatures.approximateAge)} years old`);
  }

  const appearance = featureLines.length > 0
    ? `Key features to preserve: ${featureLines.join(", ")}.`
    : "";

  // Technique based on Google's recommended approach:
  // Send both images and explicitly tell Gemini to transform the person
  // from the photo into the art style of the reference image.
  return [
    `Transform the person in Image 1 into the exact same 3D animated art style as Image 2.`,
    `Keep the face structure, hair color, hair style, skin tone, and all facial features from Image 1 recognizably the same — the result must look like the animated version of this specific child, not a generic character.`,
    appearance,
    `Place the transformed child into the same scene composition as Image 2: standing with a friendly green dinosaur companion in a warm magical nighttime setting.`,
    `Keep the dinosaur, background, lighting, and overall mood identical to Image 2.`,
    `The child's name is ${childName}.`,
    `Leave empty space at the top 15% and bottom 15% for text overlays.`,
    `Do NOT add any text, titles, labels, or watermarks.`,
  ].filter(Boolean).join(" ");
}

export async function generateDirectGeminiCoverPreview(input: {
  childPhotoDataUrl: string;
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  modelOverride?: string;
  aspectRatio?: string;
  imageSize?: "1K" | "2K" | "4K";
}) {
  const baseCover = await readPublicAssetAsDataUrl("/stories/valentin-noche-dinosaurios/cover.png");
  const prompt = buildCoverPrompt(input.childName, input.childFeatures);

  return generateImageWithGemini({
    prompt,
    referenceImageBase64s: [input.childPhotoDataUrl, baseCover.dataUrl],
    modelOverride: input.modelOverride,
    aspectRatio: input.aspectRatio ?? "1:1",
    imageSize: input.imageSize ?? "1K",
    edgeTimeoutMs: 150_000,
  });
}
