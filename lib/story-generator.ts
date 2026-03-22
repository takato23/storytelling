import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { getEnv, getGeminiConfig } from "@/lib/config";
import { GEMINI_CONFIG } from "@/lib/gemini-config";
import { buildPersonalizedStory } from "@/lib/digital-story";

export interface StoryPage {
  pageNumber: number;
  title: string;
  text: string;
  imageUrl?: string | null;
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
}

const PageSchema = z.object({
  pageNumber: z.number().int().min(1),
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(900),
});

const ResponseSchema = z.object({
  pages: z.array(PageSchema).length(5),
});

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
    return { pages: fallbackPages, provider: "fallback" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getEnv().GEMINI_TEXT_MODEL || GEMINI_CONFIG.models.text,
    });

    const prompt = getPrompt(input);
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const jsonBlock = extractJsonBlock(rawText);

    if (!jsonBlock) {
      return { pages: fallbackPages, provider: "fallback" };
    }

    const parsed = ResponseSchema.parse(JSON.parse(jsonBlock));
    const normalized = normalizePages(parsed.pages);

    if (normalized.length !== 5) {
      return { pages: fallbackPages, provider: "fallback" };
    }

    return {
      pages: normalized,
      provider: "gemini",
    };
  } catch {
    return { pages: fallbackPages, provider: "fallback" };
  }
}
