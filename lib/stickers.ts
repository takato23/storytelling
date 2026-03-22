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
    promptStyle: "ilustración infantil editorial, trazos limpios, volumen suave",
    promptPalette: "colores cálidos y saturación media-alta",
  },
  kawaii_limpio: {
    label: "Kawaii limpio",
    description: "Rostro tierno, líneas simples y fondo limpio.",
    promptStyle: "estilo kawaii premium, contornos definidos, proporciones simpáticas",
    promptPalette: "pasteles suaves con acentos vivos",
  },
  comic_pop: {
    label: "Comic pop",
    description: "Más energía y contraste, tipo cómic moderno.",
    promptStyle: "comic pop contemporáneo, líneas dinámicas, poses expresivas",
    promptPalette: "alto contraste con bloques de color intensos",
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

  return [
    "Diseña una plancha de stickers infantiles premium con exactamente 6 stickers troquelables.",
    "Cada sticker debe mostrar al mismo niño/niña de la foto de referencia en distintos roles.",
    `Género objetivo: ${params.childGender}.`,
    `Temáticas solicitadas: ${themes}.`,
    `Estilo visual: ${style.promptStyle}.`,
    `Paleta: ${style.promptPalette}.`,
    "Reglas de identidad estricta: conservar forma de cara, ojos, nariz, boca, tono de piel y peinado del niño/niña.",
    "No deformar rasgos faciales, no cambiar edad aparente, no caricaturizar excesivamente la cara.",
    "Anatomía limpia: manos correctas, sin dedos extra, sin miembros duplicados.",
    "Composición de plancha: 6 figuras separadas, recorte claro por sticker, buena legibilidad para impresión.",
    "No agregar texto, logos ni marcas de agua.",
    "Fondo blanco limpio con sombras suaves mínimas.",
  ].join(" ");
}
