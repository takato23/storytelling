import type { StoryPage } from "@/lib/story-generator";

interface GeneratedPageRow {
  page_number: number;
  prompt_used: string | null;
  image_url?: string | null;
}

interface StoredPagePayload {
  title?: unknown;
  text?: unknown;
}

export function serializePagePayload(page: StoryPage) {
  return JSON.stringify({
    title: page.title,
    text: page.text,
  });
}

function parsePayload(raw: string | null): StoredPagePayload | null {
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
      const payload = parsePayload(row.prompt_used);
      const parsedTitle = typeof payload?.title === "string" ? payload.title.trim() : "";
      const parsedText = typeof payload?.text === "string" ? payload.text.trim() : "";
      const fallbackText = row.prompt_used?.trim() || "";

      return {
        pageNumber: index + 1,
        title: parsedTitle || `Página ${index + 1}`,
        text: parsedText || fallbackText || "Contenido de la historia no disponible.",
        imageUrl: row.image_url ?? null,
      };
    });
}
