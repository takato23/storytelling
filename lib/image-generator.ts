import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiConfig } from "@/lib/config";

interface GenerateImageInput {
  prompt: string;
  referenceImageBase64?: string | null;
}

interface GenerateImageResult {
  imageDataUrl: string | null;
  provider: "gemini" | "fallback";
  model: string;
}

interface StickerPreviewQualityInput {
  previewImageBase64: string;
  referenceImageBase64?: string | null;
  childGender: "niña" | "niño";
  themes: string[];
  styleLabel: string;
}

export interface StickerPreviewQualityResult {
  pass: boolean;
  confidence: number;
  issues: string[];
  fixInstructions: string;
  model: string;
  available: boolean;
  rawText: string | null;
}

function getApiKey() {
  return getGeminiConfig().apiKey;
}

function stripBase64Prefix(value: string) {
  return value.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
}

function getImageModel() {
  return getGeminiConfig().imageModel;
}

function getQualityModel() {
  return getGeminiConfig().qualityModel;
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

    if (textParts.length > 0) {
      return textParts.join("\n").trim();
    }
  }

  return null;
}

function parseJsonFromText(rawText: string): Record<string, unknown> | null {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizeIssues(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((issue) => (typeof issue === "string" ? issue.trim() : ""))
    .filter((issue) => issue.length > 0)
    .slice(0, 6);
}

function clampConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
}

function toImagePart(base64: string) {
  return {
    inlineData: {
      data: stripBase64Prefix(base64),
      mimeType: "image/jpeg",
    },
  };
}

export async function generateImageWithGemini(input: GenerateImageInput): Promise<GenerateImageResult> {
  const apiKey = getApiKey();
  const model = getImageModel();

  if (!apiKey) {
    return {
      imageDataUrl: null,
      provider: "fallback",
      model,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });

    const content: Array<string | { inlineData: { data: string; mimeType: string } }> = [input.prompt];

    if (input.referenceImageBase64) {
      content.push({
        inlineData: {
          data: stripBase64Prefix(input.referenceImageBase64),
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await genModel.generateContent(content as never);
    const image = extractInlineImageData(result.response.candidates as Array<unknown> | undefined);

    if (!image?.data) {
      return {
        imageDataUrl: null,
        provider: "fallback",
        model,
      };
    }

    return {
      imageDataUrl: `data:${image.mimeType};base64,${image.data}`,
      provider: "gemini",
      model,
    };
  } catch {
    return {
      imageDataUrl: null,
      provider: "fallback",
      model,
    };
  }
}

export async function evaluateStickerPreviewQuality(
  input: StickerPreviewQualityInput,
): Promise<StickerPreviewQualityResult> {
  const apiKey = getApiKey();
  const model = getQualityModel();

  if (!apiKey) {
    return {
      pass: true,
      confidence: 0.35,
      issues: [],
      fixInstructions: "",
      model,
      available: false,
      rawText: null,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });

    const qaPrompt = [
      "You are a strict visual QA checker for a children's sticker sheet generated from a reference photo.",
      "Evaluate the generated sheet against the reference person and print quality.",
      `Target child gender: ${input.childGender}.`,
      `Requested themes: ${input.themes.join(", ")}.`,
      `Requested style: ${input.styleLabel}.`,
      "Check these criteria:",
      "1) Identity is preserved (face shape, eyes, nose, mouth, skin tone, hairstyle).",
      "2) Face is not deformed and age appearance remains child-like.",
      "3) Hands and limbs look correct (no extra or missing fingers/limbs).",
      "4) A single consistent child identity is used across all stickers.",
      "5) Composition resembles a printable sticker sheet with separated sticker figures.",
      "Return STRICT JSON only with this schema:",
      '{"pass": boolean, "confidence": number, "issues": string[], "fix_instructions": string}',
      "If there are no issues, return issues as an empty array and empty fix_instructions.",
    ].join("\n");

    const content: Array<string | { inlineData: { data: string; mimeType: string } }> = [qaPrompt];
    content.push(toImagePart(input.previewImageBase64));
    if (input.referenceImageBase64) {
      content.push(toImagePart(input.referenceImageBase64));
    }

    const result = await genModel.generateContent(content as never);
    const rawText = extractTextFromCandidates(result.response.candidates as Array<unknown> | undefined);

    if (!rawText) {
      return {
        pass: true,
        confidence: 0.4,
        issues: [],
        fixInstructions: "",
        model,
        available: false,
        rawText: null,
      };
    }

    const parsed = parseJsonFromText(rawText);
    if (!parsed) {
      return {
        pass: true,
        confidence: 0.4,
        issues: [],
        fixInstructions: "",
        model,
        available: false,
        rawText,
      };
    }

    const issues = normalizeIssues(parsed.issues);
    const fixInstructions =
      typeof parsed.fix_instructions === "string"
        ? parsed.fix_instructions.trim().slice(0, 400)
        : issues.length > 0
          ? `Fix these issues: ${issues.join("; ")}`
          : "";

    return {
      pass: typeof parsed.pass === "boolean" ? parsed.pass : issues.length === 0,
      confidence: clampConfidence(parsed.confidence),
      issues,
      fixInstructions,
      model,
      available: true,
      rawText,
    };
  } catch {
    return {
      pass: true,
      confidence: 0.35,
      issues: [],
      fixInstructions: "",
      model,
      available: false,
      rawText: null,
    };
  }
}
