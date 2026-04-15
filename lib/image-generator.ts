/**
 * Public image-generation façade.
 *
 * Historically this file talked directly to Gemini. As of April 2026 the
 * actual generation is delegated to the provider router in
 * `lib/image-providers/` so the same call-sites work with Gemini, Flux
 * Kontext (fal.ai), Seedream (fal.ai), etc.
 *
 * The exported `generateImageWithGemini` name is preserved as a thin
 * backward-compat wrapper so existing call-sites continue to work. New
 * code should prefer `generateImage()` from `@/lib/image-providers`.
 *
 * The secondary helpers `analyzeChildPhotoWithGemini` and
 * `evaluateStickerPreviewQuality` remain Gemini-backed: feature extraction
 * and visual QA keep working even when the chosen image provider changes.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiConfig } from "@/lib/config";
import { normalizeImageDataUrlForGemini } from "@/lib/image-normalize";
import { generateImage as routeGenerateImage } from "@/lib/image-providers";
import type {
  GenerateImageInput as RouterInput,
  GenerateImageResult as RouterResult,
  ImageProviderName,
} from "@/lib/image-providers/types";

interface GenerateImageInput {
  prompt: string;
  referenceImageBase64?: string | null;
  referenceImageBase64s?: string[];
  modelOverride?: string;
  aspectRatio?: string;
  imageSize?: "1K" | "2K" | "4K";
  maxRetries?: number;
  edgeTimeoutMs?: number;
  /** Force a specific provider, bypassing env routing. */
  providerOverride?: ImageProviderName;
  /** Disable the fallback chain for this single call. */
  disableFallback?: boolean;
}

interface GenerateImageResult {
  imageDataUrl: string | null;
  provider: RouterResult["provider"];
  model: string;
  errorMessage?: string | null;
  /** Total wall-clock latency in ms (set by the router). */
  latencyMs?: number;
}

export interface ChildPhotoAnalysisResult {
  approximateAge?: number;
  gender?: "niño" | "niña" | "neutral";
  hairColor?: string;
  hairType?: string;
  skinTone?: string;
  eyeColor?: string;
  distinctiveFeatures?: string | null;
  faceShape?: string;
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

function getQualityModel() {
  return getGeminiConfig().qualityModel;
}

function getTextModel() {
  return getGeminiConfig().qualityModel;
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

/**
 * Historical entrypoint. Despite the name, this now routes to whatever
 * image provider is configured via `IMAGE_PROVIDER` — Gemini only when
 * explicitly selected (or as a fallback).
 */
export async function generateImageWithGemini(input: GenerateImageInput): Promise<GenerateImageResult> {
  const references = [
    ...(input.referenceImageBase64 ? [input.referenceImageBase64] : []),
    ...(input.referenceImageBase64s ?? []),
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  const routerInput: RouterInput = {
    prompt: input.prompt,
    references,
    aspectRatio: input.aspectRatio,
    imageSize: input.imageSize,
    modelOverride: input.modelOverride,
    maxRetries: input.maxRetries,
    timeoutMs: input.edgeTimeoutMs,
  };

  const result = await routeGenerateImage(routerInput, {
    provider: input.providerOverride,
    disableFallback: input.disableFallback,
  });

  return {
    imageDataUrl: result.imageDataUrl,
    provider: result.provider,
    model: result.model,
    errorMessage: result.errorMessage ?? null,
    latencyMs: result.latencyMs,
  };
}

export async function analyzeChildPhotoWithGemini(
  imageBase64: string,
): Promise<{ features: ChildPhotoAnalysisResult; provider: "gemini" | "fallback"; model: string }> {
  const apiKey = getApiKey();
  const model = getTextModel();

  if (!apiKey) {
    return {
      features: {},
      provider: "fallback",
      model,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model });
    const prompt = [
      "Analiza la foto de un niño o niña y responde SOLO en JSON.",
      "No inventes datos que no se puedan inferir visualmente.",
      "Usa este esquema exacto:",
      '{"approximateAge": number, "gender": "niño" | "niña" | "neutral", "hairColor": string, "hairType": string, "skinTone": string, "eyeColor": string, "distinctiveFeatures": string | null, "faceShape": string}',
    ].join("\n");

    const normalizedImage = await normalizeImageDataUrlForGemini(imageBase64, { maxDimension: 1280 });
    const result = await genModel.generateContent([prompt, toImagePart(normalizedImage)] as never);
    const rawText = extractTextFromCandidates(result.response.candidates as Array<unknown> | undefined);
    const parsed = rawText ? parseJsonFromText(rawText) : null;

    if (!parsed) {
      return { features: {}, provider: "fallback", model };
    }

    return {
      features: {
        approximateAge:
          typeof parsed.approximateAge === "number"
            ? Math.max(2, Math.min(12, Math.round(parsed.approximateAge)))
            : undefined,
        gender:
          parsed.gender === "niño" || parsed.gender === "niña" || parsed.gender === "neutral"
            ? parsed.gender
            : undefined,
        hairColor: typeof parsed.hairColor === "string" ? parsed.hairColor.trim() : undefined,
        hairType: typeof parsed.hairType === "string" ? parsed.hairType.trim() : undefined,
        skinTone: typeof parsed.skinTone === "string" ? parsed.skinTone.trim() : undefined,
        eyeColor: typeof parsed.eyeColor === "string" ? parsed.eyeColor.trim() : undefined,
        distinctiveFeatures:
          typeof parsed.distinctiveFeatures === "string"
            ? parsed.distinctiveFeatures.trim()
            : parsed.distinctiveFeatures === null
              ? null
              : undefined,
        faceShape: typeof parsed.faceShape === "string" ? parsed.faceShape.trim() : undefined,
      },
      provider: "gemini",
      model,
    };
  } catch {
    return { features: {}, provider: "fallback", model };
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
