import type { StoryPage } from "@/lib/story-generator";

interface GeneratedPageRow {
  page_number: number;
  prompt_used: string | null;
  image_url?: string | null;
  page_type?: string | null;
  render_purpose?: string | null;
  width_px?: number | null;
  height_px?: number | null;
  status?: string | null;
  version?: number | null;
  error_message?: string | null;
}

export interface StoredPagePayload {
  title?: unknown;
  text?: unknown;
  layoutVariant?: unknown;
  sourceSceneId?: unknown;
  storyPageRange?: unknown;
}

interface SerializePagePayloadInput {
  title: string;
  text: string;
  layoutVariant?: StoryPage["layoutVariant"];
  sourceSceneId?: string | null;
  storyPageRange?: [number, number] | null;
}

export function serializePagePayload(page: StoryPage | SerializePagePayloadInput) {
  return JSON.stringify({
    title: page.title,
    text: page.text,
    layoutVariant: page.layoutVariant ?? "standard",
    sourceSceneId: "sourceSceneId" in page ? page.sourceSceneId ?? null : null,
    storyPageRange: "storyPageRange" in page ? page.storyPageRange ?? null : null,
  });
}

export function parseStoredPagePayload(raw: string | null): StoredPagePayload | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredPagePayload;
  } catch {
    return null;
  }
}

export function rowsToStoryPages(rows: GeneratedPageRow[]): StoryPage[] {
  return rows
    .slice()
    .sort((a, b) => a.page_number - b.page_number)
    .map((row, index) => {
      const payload = parseStoredPagePayload(row.prompt_used);
      const parsedTitle = typeof payload?.title === "string" ? payload.title.trim() : "";
      const parsedText = typeof payload?.text === "string" ? payload.text.trim() : "";
      const parsedLayout =
        typeof payload?.layoutVariant === "string" &&
        ["standard", "image_only", "text_on_image", "cover", "back_cover"].includes(payload.layoutVariant)
          ? (payload.layoutVariant as StoryPage["layoutVariant"])
          : "standard";
      const fallbackText = row.prompt_used?.trim() || "";

      return {
        pageNumber: Number(row.page_number ?? index + 1),
        title: parsedTitle || `Página ${index + 1}`,
        text: parsedText || fallbackText || "Contenido de la historia no disponible.",
        imageUrl: row.image_url ?? null,
        layoutVariant: parsedLayout,
      };
    });
}
