import path from "node:path";
import opentype, { type Font } from "opentype.js";

export interface BookEditorialFontSpec {
  fileName: string;
  label: string;
}

export interface BookEditorialTheme {
  id: string;
  name: string;
  fonts: {
    title: BookEditorialFontSpec;
    body: BookEditorialFontSpec;
  };
  cover: {
    titleColor: string;
    metaColor: string;
    topShade: string;
    bottomShade: string;
    shadowColor: string;
  };
  interior: {
    layout: "mist" | "panel";
    titleColor: string;
    bodyColor: string;
    edgeShade: string;
    panelFillStart: string;
    panelFillEnd: string;
    panelBorder: string;
    shadowColor: string;
  };
  backCover: {
    titleColor: string;
    shadeStart: string;
    shadeEnd: string;
    panelFill: string;
    panelBorder: string;
  };
}

export interface LoadedBookEditorialFonts {
  title: Font;
  body: Font;
}

const GOOGLE_FONT_DIR = path.join(process.cwd(), "assets/fonts/google");
const editorialFontCache = new Map<string, LoadedBookEditorialFonts>();

function loadFont(fileName: string) {
  return opentype.loadSync(path.join(GOOGLE_FONT_DIR, fileName));
}

export function getBookEditorialFonts(theme: BookEditorialTheme): LoadedBookEditorialFonts {
  const cacheKey = `${theme.fonts.title.fileName}::${theme.fonts.body.fileName}`;
  const cached = editorialFontCache.get(cacheKey);
  if (cached) return cached;

  const loaded = {
    title: loadFont(theme.fonts.title.fileName),
    body: loadFont(theme.fonts.body.fileName),
  };

  editorialFontCache.set(cacheKey, loaded);
  return loaded;
}

export const DEFAULT_PRO_BOOK_THEME: BookEditorialTheme = {
  id: "storybook-premium-v1",
  name: "Storybook Premium",
  fonts: {
    title: {
      fileName: "Spectral-SemiBold.ttf",
      label: "Spectral SemiBold",
    },
    body: {
      fileName: "Spectral-Regular.ttf",
      label: "Spectral Regular",
    },
  },
  cover: {
    titleColor: "#fff7eb",
    metaColor: "#f5e7cc",
    topShade: "rgba(10,15,30,0.10)",
    bottomShade: "rgba(10,15,30,0.58)",
    shadowColor: "rgba(10,15,30,0.18)",
  },
  interior: {
    layout: "mist",
    titleColor: "#fff9f0",
    bodyColor: "#fff8ee",
    edgeShade: "rgba(39,27,18,0.10)",
    panelFillStart: "rgba(250,245,236,0.88)",
    panelFillEnd: "rgba(250,245,236,0)",
    panelBorder: "rgba(126,94,58,0)",
    shadowColor: "rgba(10,12,24,0.72)",
  },
  backCover: {
    titleColor: "#fff8ea",
    shadeStart: "rgba(17,27,44,0.16)",
    shadeEnd: "rgba(17,27,44,0.44)",
    panelFill: "rgba(252,246,233,0.14)",
    panelBorder: "rgba(255,247,229,0.18)",
  },
};

export const BEDTIME_STORY_BOOK_THEME: BookEditorialTheme = {
  ...DEFAULT_PRO_BOOK_THEME,
  id: "bedtime-premium-v1",
  name: "Bedtime Premium",
  cover: {
    ...DEFAULT_PRO_BOOK_THEME.cover,
    topShade: "rgba(8,12,28,0.08)",
    bottomShade: "rgba(8,12,28,0.52)",
  },
  interior: {
    ...DEFAULT_PRO_BOOK_THEME.interior,
    panelFillStart: "rgba(251,247,238,0.93)",
    panelFillEnd: "rgba(243,235,221,0.82)",
  },
};
