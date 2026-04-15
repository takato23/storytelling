export const STICKER_UNIT_PRICE_ARS = 12990;

export const STICKER_THEMES_BY_GENDER = {
  niña: [
    "Sirena",
    "Superheroína",
    "Princesa",
    "Guitarrista",
    "Cocinera",
    "Pintora",
  ],
  niño: [
    "Pintor",
    "Superhéroe",
    "Cocinero",
    "Bombero",
    "Astronauta",
    "Explorador",
  ],
} as const;

export type StickerGender = keyof typeof STICKER_THEMES_BY_GENDER;

export const STICKER_STYLE_IDS = ["cuento_vibrante", "kawaii_limpio", "comic_pop"] as const;
export type StickerStyleId = (typeof STICKER_STYLE_IDS)[number];

export const DEFAULT_STICKER_STYLE_ID: StickerStyleId = "cuento_vibrante";

export const STICKER_STYLE_PRESETS: Record<
  StickerStyleId,
  {
    label: string;
    description: string;
    promptStyle: string;
    promptPalette: string;
  }
> = {
  cuento_vibrante: {
    label: "Cuento vibrante",
    description: "Tipo libro infantil, suave y colorido.",
    promptStyle: "children's book editorial illustration, clean strokes, soft volume",
    promptPalette: "warm colors with medium-high saturation",
  },
  kawaii_limpio: {
    label: "Kawaii limpio",
    description: "Rostro tierno, líneas simples y fondo limpio.",
    promptStyle: "premium kawaii style, defined outlines, cute proportions",
    promptPalette: "soft pastels with vivid accents",
  },
  comic_pop: {
    label: "Comic pop",
    description: "Más energía y contraste, tipo cómic moderno.",
    promptStyle: "contemporary pop comic, dynamic lines, expressive poses",
    promptPalette: "high contrast with bold color blocks",
  },
};

export function filterAllowedStickerThemes(gender: StickerGender, themes: string[]) {
  const allowed = new Set(STICKER_THEMES_BY_GENDER[gender]);
  return Array.from(
    new Set(
      themes.filter((theme) =>
        allowed.has(theme as (typeof STICKER_THEMES_BY_GENDER)[StickerGender][number]),
      ),
    ),
  );
}

export function normalizeStickerThemes(gender: StickerGender, themes: string[]) {
  return filterAllowedStickerThemes(gender, themes).slice(0, 6).sort((left, right) => left.localeCompare(right));
}

export function buildStickerPrompt(params: {
  childGender: StickerGender;
  themes: string[];
  styleId: StickerStyleId;
}): string {
  const style = STICKER_STYLE_PRESETS[params.styleId] ?? STICKER_STYLE_PRESETS[DEFAULT_STICKER_STYLE_ID];
  const themes = normalizeStickerThemes(params.childGender, params.themes).join(", ");

  const genderWord = params.childGender === "niña" ? "girl" : "boy";

  return [
    `Image 1 is a real photo of a ${genderWord}. Transform the child from the uploaded photo into a ${style.promptStyle} illustration and create exactly 6 die-cut sticker poses on a single sheet.`,
    `Each sticker must depict the same child in a different role/theme: ${themes}.`,
    `Color palette: ${style.promptPalette}.`,
    "",
    "STRICT IDENTITY PRESERVATION:",
    "- Lock onto the child's exact face shape, eye shape and color, nose, mouth, skin tone, and hairstyle from the uploaded photo.",
    "- Do NOT age, slim, or exaggerate facial features. The child must be immediately recognizable.",
    "- Keep the same apparent age as in the photo.",
    "",
    "ANATOMY RULES:",
    "- Correct hands with five fingers each, no extra or missing fingers.",
    "- No duplicated or malformed limbs.",
    "",
    "COMPOSITION RULES:",
    "- 6 separated figures arranged in a 3x2 or 2x3 grid layout.",
    "- Each sticker has a clear die-cut outline, suitable for print.",
    "- Clean white background with minimal soft drop shadows.",
    "- Do NOT add any text, logos, labels, or watermarks anywhere on the sheet.",
  ].join("\n");
}
