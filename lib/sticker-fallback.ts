import sharp from "sharp";
import { getImageDataUrlMetadata } from "@/lib/image-data-url";

const SHEET_WIDTH = 1600;
const SHEET_HEIGHT = 1200;
const STICKER_WIDTH = 360;
const STICKER_HEIGHT = 420;
const PHOTO_SIZE = 250;

const STICKER_COLORS = [
  { base: "#f472b6", accent: "#fce7f3", chip: "#831843" },
  { base: "#818cf8", accent: "#e0e7ff", chip: "#312e81" },
  { base: "#34d399", accent: "#d1fae5", chip: "#065f46" },
  { base: "#f59e0b", accent: "#fef3c7", chip: "#92400e" },
  { base: "#38bdf8", accent: "#e0f2fe", chip: "#075985" },
  { base: "#a78bfa", accent: "#ede9fe", chip: "#5b21b6" },
];

const STICKER_LAYOUT = [
  { left: 90, top: 90, rotate: -8 },
  { left: 610, top: 80, rotate: 7 },
  { left: 1120, top: 110, rotate: -5 },
  { left: 110, top: 640, rotate: 10 },
  { left: 620, top: 660, rotate: -7 },
  { left: 1110, top: 620, rotate: 9 },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function createCircularPhoto(photoBuffer: Buffer) {
  const circleMask = Buffer.from(
    `<svg width="${PHOTO_SIZE}" height="${PHOTO_SIZE}" viewBox="0 0 ${PHOTO_SIZE} ${PHOTO_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${PHOTO_SIZE / 2}" cy="${PHOTO_SIZE / 2}" r="${PHOTO_SIZE / 2 - 8}" fill="white" />
    </svg>`,
  );

  return sharp(photoBuffer)
    .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover" })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function createStickerCard(input: {
  photoBuffer: Buffer;
  theme: string;
  index: number;
}) {
  const palette = STICKER_COLORS[input.index % STICKER_COLORS.length];
  const photo = await createCircularPhoto(input.photoBuffer);
  const safeTheme = escapeXml(input.theme);

  const cardSvg = Buffer.from(
    `<svg width="${STICKER_WIDTH}" height="${STICKER_HEIGHT}" viewBox="0 0 ${STICKER_WIDTH} ${STICKER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="18" width="${STICKER_WIDTH - 36}" height="${STICKER_HEIGHT - 36}" rx="42" fill="white"/>
      <rect x="32" y="32" width="${STICKER_WIDTH - 64}" height="${STICKER_HEIGHT - 64}" rx="34" fill="${palette.accent}"/>
      <circle cx="${STICKER_WIDTH - 92}" cy="98" r="44" fill="${palette.base}" opacity="0.18"/>
      <circle cx="88" cy="84" r="32" fill="${palette.base}" opacity="0.12"/>
      <rect x="70" y="330" width="${STICKER_WIDTH - 140}" height="48" rx="24" fill="white" opacity="0.96"/>
      <text x="${STICKER_WIDTH / 2}" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${palette.chip}">
        ${safeTheme}
      </text>
    </svg>`,
  );

  return sharp({
    create: {
      width: STICKER_WIDTH,
      height: STICKER_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: cardSvg, top: 0, left: 0 },
      { input: photo, top: 62, left: Math.round((STICKER_WIDTH - PHOTO_SIZE) / 2) },
    ])
    .png()
    .toBuffer();
}

export async function createStickerSheetFallback(input: {
  referenceImageBase64: string;
  childGender: "niña" | "niño";
  themes: string[];
  styleLabel: string;
}) {
  const photoBuffer = getImageDataUrlMetadata(input.referenceImageBase64).bytes;
  const stickerCards = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      createStickerCard({
        photoBuffer,
        theme: input.themes[index % input.themes.length] ?? "Sticker",
        index,
      }),
    ),
  );

  const backgroundSvg = Buffer.from(
    `<svg width="${SHEET_WIDTH}" height="${SHEET_HEIGHT}" viewBox="0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SHEET_WIDTH}" height="${SHEET_HEIGHT}" rx="48" fill="#fffdfb"/>
      <circle cx="180" cy="140" r="120" fill="#fce7f3" opacity="0.9"/>
      <circle cx="${SHEET_WIDTH - 150}" cy="180" r="110" fill="#e0e7ff" opacity="0.9"/>
      <circle cx="240" cy="${SHEET_HEIGHT - 120}" r="140" fill="#d1fae5" opacity="0.75"/>
      <circle cx="${SHEET_WIDTH - 220}" cy="${SHEET_HEIGHT - 150}" r="130" fill="#fef3c7" opacity="0.75"/>
      <text x="120" y="86" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">
        Preview de stickers
      </text>
      <text x="120" y="122" font-family="Arial, sans-serif" font-size="20" font-weight="500" fill="#4b5563">
        ${escapeXml(input.styleLabel)} · ${escapeXml(input.childGender)}
      </text>
    </svg>`,
  );

  const composites = await Promise.all(
    stickerCards.map(async (card, index) => {
      const rotated = await sharp(card)
        .rotate(STICKER_LAYOUT[index].rotate, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      return {
        input: rotated,
        left: STICKER_LAYOUT[index].left,
        top: STICKER_LAYOUT[index].top,
      };
    }),
  );

  const sheet = await sharp({
    create: {
      width: SHEET_WIDTH,
      height: SHEET_HEIGHT,
      channels: 4,
      background: { r: 255, g: 253, b: 251, alpha: 1 },
    },
  })
    .composite([{ input: backgroundSvg, top: 0, left: 0 }, ...composites])
    .png()
    .toBuffer();

  return `data:image/png;base64,${sheet.toString("base64")}`;
}
