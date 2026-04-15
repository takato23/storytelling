import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { getEnv, getGeminiConfig } from "@/lib/config";
import { GEMINI_CONFIG } from "@/lib/gemini-config";
import { buildPersonalizedStory } from "@/lib/digital-story";
import {
  parseRetryDelayMs,
  isQuotaZeroError,
  isRateLimitError,
  MAX_RETRIES,
} from "@/lib/gemini-retry";
import { recordGeminiCall } from "@/lib/gemini-quota";

export interface StoryPage {
  pageNumber: number;
  title: string;
  text: string;
  imageUrl?: string | null;
  layoutVariant?: "standard" | "image_only" | "text_on_image" | "cover" | "back_cover";
}

interface GenerateStoryInput {
  childName: string;
  storyTitle: string;
  readingLevel?: string | null;
  familyMembers?: Array<{ name?: string }>;
}

interface GenerateStoryResult {
  pages: StoryPage[];
  provider: "gemini" | "fallback";
  errorMessage?: string;
}

const PageSchema = z.object({
  pageNumber: z.number().int().min(1),
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(900),
});

const ResponseSchema = z.object({
  pages: z.array(PageSchema).length(5),
});

const BASE_STORY_RETRY_DELAY_MS = 5_000;

function getApiKey() {
  return getGeminiConfig().apiKey;
}

function getPrompt(input: GenerateStoryInput) {
  const companions = (input.familyMembers ?? [])
    .map((member) => member?.name?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  return [
    "Genera un cuento infantil personalizado en ESPAÑOL.",
    "Devuelve SOLO JSON válido con este formato exacto:",
    '{"pages":[{"pageNumber":1,"title":"...","text":"..."},{"pageNumber":2,"title":"...","text":"..."},{"pageNumber":3,"title":"...","text":"..."},{"pageNumber":4,"title":"...","text":"..."},{"pageNumber":5,"title":"...","text":"..."}]}',
    `Protagonista: ${input.childName}`,
    `Título base: ${input.storyTitle}`,
    `Nivel de lectura: ${input.readingLevel ?? "intermedio"}`,
    `Familiares mencionables: ${companions.length > 0 ? companions.join(", ") : "ninguno"}`,
    "Requisitos:",
    "- Tono cálido, mágico y apropiado para niños.",
    "- Cada página debe avanzar la historia.",
    "- No uses markdown, ni comentarios fuera del JSON.",
  ].join("\n");
}

function extractJsonBlock(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return text.slice(firstBrace, lastBrace + 1);
}

function normalizePages(pages: StoryPage[]): StoryPage[] {
  return pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((page, index) => ({
      pageNumber: index + 1,
      title: page.title.trim(),
      text: page.text.trim(),
    }));
}

export async function generateStoryPages(input: GenerateStoryInput): Promise<GenerateStoryResult> {
  const fallbackPages = buildPersonalizedStory(input);
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn("[generateStoryPages] No Gemini API key configured, using fallback story");
    recordGeminiCall("text", "fallback");
    return { pages: fallbackPages, provider: "fallback", errorMessage: "No Gemini API key configured" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getEnv().GEMINI_TEXT_MODEL || GEMINI_CONFIG.models.text,
  });
  const prompt = getPrompt(input);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[generateStoryPages] Retry attempt ${attempt}/${MAX_RETRIES}...`);
      }

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const jsonBlock = extractJsonBlock(rawText);

      if (!jsonBlock) {
        console.warn("[generateStoryPages] Gemini returned no parseable JSON block, using fallback");
        recordGeminiCall("text", "fallback");
        return { pages: fallbackPages, provider: "fallback", errorMessage: "Gemini returned no parseable JSON block" };
      }

      const parsed = ResponseSchema.parse(JSON.parse(jsonBlock));
      const normalized = normalizePages(parsed.pages);

      if (normalized.length !== 5) {
        console.warn(`[generateStoryPages] Gemini returned ${normalized.length} pages instead of 5, using fallback`);
        recordGeminiCall("text", "fallback");
        return { pages: fallbackPages, provider: "fallback", errorMessage: `Gemini returned ${normalized.length} pages instead of 5` };
      }

      recordGeminiCall("text", "success");
      return { pages: normalized, provider: "gemini" };
    } catch (error) {
      const isRateLimit = isRateLimitError(error);
      const isPermanent = isQuotaZeroError(error);

      if (isRateLimit && !isPermanent && attempt < MAX_RETRIES) {
        recordGeminiCall("text", "rate_limit");
        const hintMs = parseRetryDelayMs(error);
        const delayMs = hintMs ?? BASE_STORY_RETRY_DELAY_MS * (attempt + 1);
        console.warn(`[generateStoryPages] Rate limited, attempt ${attempt + 1}/${MAX_RETRIES + 1}. Waiting ${Math.round(delayMs / 1000)}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      recordGeminiCall("text", isPermanent ? "quota_error" : "error");
      const errorMsg = error instanceof Error ? error.message.slice(0, 400) : String(error);
      console.error("[generateStoryPages] ERROR:", errorMsg);
      return { pages: fallbackPages, provider: "fallback", errorMessage: errorMsg };
    }
  }

  return { pages: fallbackPages, provider: "fallback", errorMessage: "Story generation exhausted retries" };
}
