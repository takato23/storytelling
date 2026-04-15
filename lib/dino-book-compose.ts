import sharp from "sharp";
import {
  DEFAULT_PRO_BOOK_THEME,
  getBookEditorialFonts,
  type BookEditorialTheme,
} from "./books/editorial-theme.ts";

export const DINO_PRINT_PAGE_SIZE = 3000;
export const DINO_PRINT_SPREAD_SIZE = {
  width: DINO_PRINT_PAGE_SIZE * 2,
  height: DINO_PRINT_PAGE_SIZE,
} as const;

type DinoPageType = "cover" | "story_page" | "back_cover";
type DinoLayoutVariant = "cover" | "image_only" | "text_on_image" | "back_cover";

export interface ComposedDinoPage {
  pageNumber: number;
  pageType: DinoPageType;
  title: string;
  text: string;
  layoutVariant: DinoLayoutVariant;
  imageDataUrl: string;
  sourceSceneId?: string | null;
  storyPageRange?: [number, number] | null;
}

function bufferToJpegDataUrl(bytes: Buffer) {
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

function buildTextPath(
  font: ReturnType<typeof getBookEditorialFonts>["title"],
  text: string,
  x: number,
  baselineY: number,
  fontSize: number,
  fill: string,
  options?: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  },
) {
  if (!text.trim()) return "";
  const pathData = font.getPath(text, x, baselineY, fontSize).toPathData(2);
  const stroke = options?.stroke ? ` stroke="${options.stroke}" stroke-width="${options.strokeWidth ?? 0}" stroke-linejoin="round" paint-order="stroke fill"` : "";
  const opacity = typeof options?.opacity === "number" ? ` opacity="${options.opacity}"` : "";
  return `<path d="${pathData}" fill="${fill}"${stroke}${opacity}/>`;
}

function getFontAdvanceWidth(
  font: ReturnType<typeof getBookEditorialFonts>["title"],
  text: string,
  fontSize: number,
) {
  return (font as { getAdvanceWidth?: (value: string, size: number) => number }).getAdvanceWidth?.(text, fontSize)
    ?? font.getPath(text, 0, 0, fontSize).getBoundingBox().x2;
}

function buildTextPathLines(input: {
  font: ReturnType<typeof getBookEditorialFonts>["title"];
  lines: string[];
  x: number;
  boxWidth?: number;
  firstBaselineY: number;
  lineHeight: number;
  fontSize: number;
  fill: string;
  align?: "left" | "center";
  options?: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
}) {
  return input.lines
    .map((line, index) =>
      buildTextPath(
        input.font,
        line,
        input.align === "center" && input.boxWidth
          ? input.x + (input.boxWidth - getFontAdvanceWidth(input.font, line, input.fontSize)) / 2
          : input.x,
        input.firstBaselineY + index * input.lineHeight,
        input.fontSize,
        input.fill,
        input.options,
      ),
    )
    .join("");
}

function wrapText(text: string, maxCharsPerLine: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
      continue;
    }
    current = candidate;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function fitTextBlock(
  text: string,
  boxWidth: number,
  boxHeight: number,
  options?: {
    maxFontSize?: number;
    minFontSize?: number;
    step?: number;
    lineHeightMultiplier?: number;
  },
) {
  const maxFontSize = options?.maxFontSize ?? 88;
  const minFontSize = options?.minFontSize ?? 48;
  const step = options?.step ?? 4;
  const lineHeightMultiplier = options?.lineHeightMultiplier ?? 1.35;

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= step) {
    const maxCharsPerLine = Math.max(14, Math.floor(boxWidth / (fontSize * 0.56)));
    const lines = wrapText(text, maxCharsPerLine);
    const lineHeight = Math.round(fontSize * lineHeightMultiplier);
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= boxHeight) {
      return {
        fontSize,
        lineHeight,
        lines,
      };
    }
  }

  const fallbackFontSize = minFontSize;
  return {
    fontSize: fallbackFontSize,
    lineHeight: Math.round(fallbackFontSize * lineHeightMultiplier),
    lines: wrapText(text, Math.max(12, Math.floor(boxWidth / (fallbackFontSize * 0.56)))),
  };
}

function buildInteriorTextOverlaySvg(input: {
  width: number;
  height: number;
  title: string;
  text: string;
  theme: BookEditorialTheme;
  placement?: {
    x: number;
    y: number;
    width: number;
    bodyTop: number;
    bodyHeight: number;
    align?: "left" | "center";
  };
}) {
  const { title: titleFont, body: bodyFont } = getBookEditorialFonts(input.theme);
  const placement = input.placement ?? {
    x: 280,
    y: 170,
    width: input.width - 560,
    bodyTop: 370,
    bodyHeight: 1260,
    align: "center" as const,
  };
  const textBoxX = placement.x;
  const textBoxWidth = placement.width;
  const panelX = Math.max(80, textBoxX - 90);
  const panelY = Math.max(80, placement.y - 70);
  const panelWidth = Math.min(input.width - panelX * 2, textBoxWidth + 180);
  const panelHeight = Math.min(input.height - panelY - 120, placement.bodyTop + placement.bodyHeight - panelY + 100);
  const titleBoxY = placement.y;
  const bodyTop = placement.bodyTop;
  const bodyHeight = placement.bodyHeight;
  const textFit = fitTextBlock(input.text, textBoxWidth, bodyHeight, {
    maxFontSize: 120,
    minFontSize: 76,
    step: 2,
    lineHeightMultiplier: 1.22,
  });
  const titleFontSize = 98;
  const titleShadowPath = buildTextPath(
    titleFont,
    input.title,
    textBoxX + 4,
    titleBoxY + 6,
    titleFontSize,
    "rgba(10,12,24,0.72)",
  );
  const titlePath = buildTextPath(
    titleFont,
    input.title,
    textBoxX,
    titleBoxY,
    titleFontSize,
    input.theme.interior.titleColor,
  );
  const bodyShadowPaths = buildTextPathLines({
    font: bodyFont,
    lines: textFit.lines,
    x: textBoxX + 3,
    boxWidth: textBoxWidth,
    firstBaselineY: bodyTop + 4,
    lineHeight: textFit.lineHeight,
    fontSize: textFit.fontSize,
    fill: "rgba(10,12,24,0.68)",
    align: placement.align ?? "center",
  });
  const bodyPaths = buildTextPathLines({
    font: bodyFont,
    lines: textFit.lines,
    x: textBoxX,
    boxWidth: textBoxWidth,
    firstBaselineY: bodyTop,
    lineHeight: textFit.lineHeight,
    fontSize: textFit.fontSize,
    fill: input.theme.interior.bodyColor,
    align: placement.align ?? "center",
  });

  if (input.theme.interior.layout === "mist") {
    return `
      <svg width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="mistShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="${input.theme.interior.shadowColor}"/>
          </filter>
        </defs>
        <g filter="url(#mistShadow)">
          ${titleShadowPath}
          ${titlePath}
          ${bodyShadowPaths}
          ${bodyPaths}
        </g>
      </svg>
    `.trim();
  }

  return `
    <svg width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panelGlow" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stop-color="${input.theme.interior.panelFillStart}"/>
          <stop offset="100%" stop-color="${input.theme.interior.panelFillEnd}"/>
        </linearGradient>
        <linearGradient id="edgeShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${input.theme.interior.edgeShade}"/>
          <stop offset="35%" stop-color="rgba(30,22,16,0.02)"/>
          <stop offset="100%" stop-color="rgba(30,22,16,0)"/>
        </linearGradient>
        <filter id="panelShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="${input.theme.interior.shadowColor}"/>
        </filter>
      </defs>
      <rect width="${input.width}" height="${input.height}" fill="url(#edgeShade)"/>
      <g filter="url(#panelShadow)">
        <rect x="${panelX}" y="${panelY}" rx="52" ry="52" width="${panelWidth}" height="${panelHeight}" fill="url(#panelGlow)" />
        <rect x="${panelX + 20}" y="${panelY + 20}" rx="38" ry="38" width="${panelWidth - 40}" height="${panelHeight - 40}" fill="none" stroke="${input.theme.interior.panelBorder}" stroke-width="4" />
      </g>
      ${titlePath}
      ${bodyPaths}
    </svg>
  `.trim();
}

function buildCoverOverlaySvg(input: {
  width: number;
  height: number;
  title: string;
  childName: string;
  theme: BookEditorialTheme;
}) {
  const { title: titleFont, body: bodyFont } = getBookEditorialFonts(input.theme);
  const titleBoxX = 140;
  const titleBoxWidth = input.width - 280;
  const titleFit = fitTextBlock(input.title, titleBoxWidth, 760, {
    maxFontSize: 200,
    minFontSize: 114,
    step: 2,
    lineHeightMultiplier: 0.96,
  });
  const titleShadowPaths = buildTextPathLines({
    font: titleFont,
    lines: titleFit.lines,
    x: titleBoxX + 8,
    boxWidth: titleBoxWidth,
    firstBaselineY: 432,
    lineHeight: titleFit.lineHeight,
    fontSize: titleFit.fontSize,
    fill: "rgba(22, 16, 29, 0.55)",
    align: "center",
  });
  const titlePaths = buildTextPathLines({
    font: titleFont,
    lines: titleFit.lines,
    x: titleBoxX,
    boxWidth: titleBoxWidth,
    firstBaselineY: 420,
    lineHeight: titleFit.lineHeight,
    fontSize: titleFit.fontSize,
    fill: input.theme.cover.titleColor,
    align: "center",
  });
  const childNamePath = buildTextPath(
    bodyFont,
    input.childName,
    220 + (input.width - 440 - getFontAdvanceWidth(bodyFont, input.childName, 78)) / 2,
    input.height - 220,
    78,
    input.theme.cover.metaColor,
  );
  const childNameShadowPath = buildTextPath(
    bodyFont,
    input.childName,
    220 + (input.width - 440 - getFontAdvanceWidth(bodyFont, input.childName, 78)) / 2 + 5,
    input.height - 212,
    78,
    "rgba(22, 16, 29, 0.5)",
  );
  const subtitlePath = buildTextPath(
    bodyFont,
    "Un cuento personalizado para acompañar el miedo a dormir solo",
    220 + (input.width - 440 - getFontAdvanceWidth(bodyFont, "Un cuento personalizado para acompañar el miedo a dormir solo", 40)) / 2,
    input.height - 148,
    40,
    input.theme.cover.metaColor,
  );
  const subtitleShadowPath = buildTextPath(
    bodyFont,
    "Un cuento personalizado para acompañar el miedo a dormir solo",
    220 + (input.width - 440 - getFontAdvanceWidth(bodyFont, "Un cuento personalizado para acompañar el miedo a dormir solo", 40)) / 2 + 4,
    input.height - 142,
    40,
    "rgba(22, 16, 29, 0.42)",
  );

  return `
    <svg width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${input.theme.cover.topShade}"/>
          <stop offset="55%" stop-color="rgba(7,14,29,0.02)"/>
          <stop offset="100%" stop-color="${input.theme.cover.bottomShade}"/>
        </linearGradient>
        <filter id="coverShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="${input.theme.cover.shadowColor}"/>
        </filter>
      </defs>
      <rect width="${input.width}" height="${input.height}" fill="url(#coverShade)"/>
      <g filter="url(#coverShadow)">
        ${titleShadowPaths}
        ${titlePaths}
        ${childNameShadowPath}
        ${childNamePath}
        ${subtitleShadowPath}
        ${subtitlePath}
      </g>
    </svg>
  `.trim();
}

async function normalizePageBytes(imageDataUrl: string, width: number, height: number) {
  const source = Buffer.from(imageDataUrl.replace(/^data:[^;]+;base64,/, ""), "base64");
  return sharp(source)
    .rotate()
    .resize({
      width,
      height,
      fit: "cover",
      position: "centre",
    })
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();
}

async function normalizeSpreadBytes(imageDataUrl: string) {
  return normalizePageBytes(imageDataUrl, DINO_PRINT_SPREAD_SIZE.width, DINO_PRINT_SPREAD_SIZE.height);
}

export async function composeDinoCoverPage(input: {
  imageDataUrl: string;
  title: string;
  childName: string;
  theme?: BookEditorialTheme;
}) {
  const theme = input.theme ?? DEFAULT_PRO_BOOK_THEME;
  const base = await normalizePageBytes(input.imageDataUrl, DINO_PRINT_PAGE_SIZE, DINO_PRINT_PAGE_SIZE);
  const overlay = Buffer.from(
    buildCoverOverlaySvg({
      width: DINO_PRINT_PAGE_SIZE,
      height: DINO_PRINT_PAGE_SIZE,
      title: input.title,
      childName: input.childName,
      theme,
    }),
    "utf8",
  );

  const output = await sharp(base)
    .composite([{ input: overlay }])
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    pageNumber: 1,
    pageType: "cover" as const,
    title: input.title,
    text: "",
    layoutVariant: "cover" as const,
    imageDataUrl: bufferToJpegDataUrl(output),
    sourceSceneId: "cover",
    storyPageRange: null,
  };
}

export async function composeDinoBackCoverPage(input: {
  coverImageDataUrl: string;
  title: string;
  backCoverImageDataUrl?: string | null;
  theme?: BookEditorialTheme;
}) {
  const theme = input.theme ?? DEFAULT_PRO_BOOK_THEME;
  if (input.backCoverImageDataUrl) {
    const base = await normalizePageBytes(input.backCoverImageDataUrl, DINO_PRINT_PAGE_SIZE, DINO_PRINT_PAGE_SIZE);

    return {
      pageNumber: 22,
      pageType: "back_cover" as const,
      title: "Contratapa",
      text: "",
      layoutVariant: "back_cover" as const,
      imageDataUrl: bufferToJpegDataUrl(base),
      sourceSceneId: "cover",
      storyPageRange: null,
    };
  }

  const { body: bodyFont } = getBookEditorialFonts(theme);
  const base = await normalizePageBytes(input.coverImageDataUrl, DINO_PRINT_PAGE_SIZE, DINO_PRINT_PAGE_SIZE);
  const backTitlePath = buildTextPath(bodyFont, input.title, 260, DINO_PRINT_PAGE_SIZE - 260, 52, theme.backCover.titleColor);

  const output = await sharp(base)
    .blur(16)
    .modulate({
      brightness: 0.92,
      saturation: 0.85,
    })
    .composite([
      {
        input: Buffer.from(
          `
            <svg width="${DINO_PRINT_PAGE_SIZE}" height="${DINO_PRINT_PAGE_SIZE}" viewBox="0 0 ${DINO_PRINT_PAGE_SIZE} ${DINO_PRINT_PAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="backShade" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="${theme.backCover.shadeStart}"/>
                  <stop offset="100%" stop-color="${theme.backCover.shadeEnd}"/>
                </linearGradient>
              </defs>
              <rect width="${DINO_PRINT_PAGE_SIZE}" height="${DINO_PRINT_PAGE_SIZE}" fill="url(#backShade)"/>
              <rect x="196" y="240" width="${DINO_PRINT_PAGE_SIZE - 392}" height="${DINO_PRINT_PAGE_SIZE - 480}" rx="56" fill="${theme.backCover.panelFill}" stroke="${theme.backCover.panelBorder}" stroke-width="4"/>
              ${backTitlePath}
            </svg>
          `.trim(),
          "utf8",
        ),
      },
    ])
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    pageNumber: 22,
    pageType: "back_cover" as const,
    title: "Contratapa",
    text: "",
    layoutVariant: "back_cover" as const,
    imageDataUrl: bufferToJpegDataUrl(output),
    sourceSceneId: "cover",
    storyPageRange: null,
  };
}

export async function composeDinoSpreadPages(input: {
  spreadId: string;
  spreadImageDataUrl: string;
  title: string;
  text: string;
  leftPageNumber: number;
  storyPageRange: [number, number];
  theme?: BookEditorialTheme;
  textPlacement?: {
    x: number;
    y: number;
    width: number;
    bodyTop: number;
    bodyHeight: number;
    align?: "left" | "center";
  };
}) {
  const theme = input.theme ?? DEFAULT_PRO_BOOK_THEME;
  const spread = await normalizeSpreadBytes(input.spreadImageDataUrl);
  const halfWidth = DINO_PRINT_PAGE_SIZE;
  const leftPageBuffer = await sharp(spread)
    .extract({
      left: 0,
      top: 0,
      width: halfWidth,
      height: DINO_PRINT_PAGE_SIZE,
    })
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();

  const rightBase = await sharp(spread)
    .extract({
      left: halfWidth,
      top: 0,
      width: halfWidth,
      height: DINO_PRINT_PAGE_SIZE,
    })
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();

  const rightOverlay = Buffer.from(
    buildInteriorTextOverlaySvg({
      width: DINO_PRINT_PAGE_SIZE,
      height: DINO_PRINT_PAGE_SIZE,
      title: input.title,
      text: input.text,
      theme,
      placement: input.textPlacement,
    }),
    "utf8",
  );

  const rightPageBuffer = await sharp(rightBase)
    .composite([{ input: rightOverlay }])
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();

  return [
    {
      pageNumber: input.leftPageNumber,
      pageType: "story_page" as const,
      title: input.title,
      text: "",
      layoutVariant: "image_only" as const,
      imageDataUrl: bufferToJpegDataUrl(leftPageBuffer),
      sourceSceneId: input.spreadId,
      storyPageRange: input.storyPageRange,
    },
    {
      pageNumber: input.leftPageNumber + 1,
      pageType: "story_page" as const,
      title: input.title,
      text: input.text,
      layoutVariant: "text_on_image" as const,
      imageDataUrl: bufferToJpegDataUrl(rightPageBuffer),
      sourceSceneId: input.spreadId,
      storyPageRange: input.storyPageRange,
    },
  ] satisfies ComposedDinoPage[];
}
