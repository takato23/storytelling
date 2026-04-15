import sharp from 'sharp';
import { getImageDataUrlMetadata } from '@/lib/image-data-url';

type ScenePreviewLayout = {
  widthRatio: number;
  heightRatio: number;
  xRatio: number;
  yRatio: number;
  radiusRatio: number;
  shadowOpacity: number;
};

const DEFAULT_SCENE_LAYOUT: ScenePreviewLayout = {
  widthRatio: 0.16,
  heightRatio: 0.23,
  xRatio: 0.78,
  yRatio: 0.68,
  radiusRatio: 0.28,
  shadowOpacity: 0.18,
};

const SCENE_LAYOUTS: Record<string, ScenePreviewLayout> = {
  'spread-01-02': {
    widthRatio: 0.16,
    heightRatio: 0.23,
    xRatio: 0.79,
    yRatio: 0.66,
    radiusRatio: 0.28,
    shadowOpacity: 0.18,
  },
  'spread-09-10': {
    widthRatio: 0.16,
    heightRatio: 0.23,
    xRatio: 0.06,
    yRatio: 0.68,
    radiusRatio: 0.28,
    shadowOpacity: 0.18,
  },
  'spread-19-20': {
    widthRatio: 0.16,
    heightRatio: 0.23,
    xRatio: 0.79,
    yRatio: 0.67,
    radiusRatio: 0.28,
    shadowOpacity: 0.18,
  },
};

export async function composePersonalizedCoverPreview(
  baseCoverBytes: Buffer,
  childPhotoDataUrl: string,
) {
  const childMetadata = getImageDataUrlMetadata(childPhotoDataUrl);
  const baseImage = sharp(baseCoverBytes);
  const baseStats = await baseImage.metadata();

  const width = baseStats.width ?? 2048;
  const height = baseStats.height ?? 2048;
  const portraitWidth = Math.round(width * 0.18);
  const portraitHeight = Math.round(height * 0.26);
  const x = Math.round(width * 0.07);
  const y = Math.round(height * 0.6);
  const radius = Math.round(Math.min(portraitWidth, portraitHeight) * 0.24);
  const shadowSpread = Math.max(14, Math.round(width * 0.008));
  const borderWidth = Math.max(8, Math.round(width * 0.004));

  const portrait = await sharp(childMetadata.bytes)
    .rotate()
    .resize(portraitWidth, portraitHeight, {
      fit: 'cover',
      position: 'centre',
    })
    .modulate({
      saturation: 1.02,
      brightness: 1.03,
    })
    .png()
    .toBuffer();

  const maskSvg = Buffer.from(
    `<svg width="${portraitWidth}" height="${portraitHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${portraitWidth}" height="${portraitHeight}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`,
    'utf8',
  );

  const framedPortrait = await sharp(portrait)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const shadowSvg = Buffer.from(
    `<svg width="${portraitWidth + shadowSpread * 2}" height="${portraitHeight + shadowSpread * 2}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${shadowSpread}" y="${shadowSpread}" width="${portraitWidth}" height="${portraitHeight}" rx="${radius}" ry="${radius}" fill="black" fill-opacity="0.18"/>
    </svg>`,
    'utf8',
  );

  const softLightSvg = Buffer.from(
    `<svg width="${portraitWidth}" height="${portraitHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${portraitWidth}" height="${portraitHeight}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,248,232,0.24)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
        </linearGradient>
      </defs>
    </svg>`,
    'utf8',
  );

  const borderSvg = Buffer.from(
    `<svg width="${portraitWidth}" height="${portraitHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.round(borderWidth / 2)}" y="${Math.round(borderWidth / 2)}" width="${portraitWidth - borderWidth}" height="${portraitHeight - borderWidth}" rx="${Math.max(0, radius - Math.round(borderWidth / 2))}" ry="${Math.max(0, radius - Math.round(borderWidth / 2))}" fill="none" stroke="rgba(255,255,255,0.96)" stroke-width="${borderWidth}"/>
    </svg>`,
    'utf8',
  );

  const composed = await baseImage
    .composite([
      { input: shadowSvg, left: x - shadowSpread, top: y - shadowSpread, blend: 'multiply' },
      { input: framedPortrait, left: x, top: y },
      { input: softLightSvg, left: x, top: y, blend: 'screen' },
      { input: borderSvg, left: x, top: y, blend: 'over' },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${composed.toString('base64')}`;
}

export async function composePersonalizedScenePreview(
  baseSceneBytes: Buffer,
  childPhotoDataUrl: string,
  sceneId?: string,
) {
  const childMetadata = getImageDataUrlMetadata(childPhotoDataUrl);
  const baseImage = sharp(baseSceneBytes);
  const baseStats = await baseImage.metadata();
  const layout = (sceneId && SCENE_LAYOUTS[sceneId]) || DEFAULT_SCENE_LAYOUT;

  const width = baseStats.width ?? 2048;
  const height = baseStats.height ?? 2048;
  const frameWidth = Math.round(width * layout.widthRatio);
  const frameHeight = Math.round(height * layout.heightRatio);
  const x = Math.round(width * layout.xRatio);
  const y = Math.round(height * layout.yRatio);
  const radius = Math.round(Math.min(frameWidth, frameHeight) * layout.radiusRatio);
  const shadowSpread = Math.max(16, Math.round(width * 0.01));
  const borderWidth = Math.max(10, Math.round(width * 0.006));

  const portrait = await sharp(childMetadata.bytes)
    .rotate()
    .resize(frameWidth, frameHeight, {
      fit: 'cover',
      position: 'attention',
    })
    .modulate({
      saturation: 1.04,
      brightness: 1.04,
    })
    .png()
    .toBuffer();

  const maskSvg = Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${frameWidth}" height="${frameHeight}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`,
    'utf8',
  );

  const framedPortrait = await sharp(portrait)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const glowSvg = Buffer.from(
    `<svg width="${frameWidth + shadowSpread * 2}" height="${frameHeight + shadowSpread * 2}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="rgba(255,244,214,0.95)"/>
          <stop offset="65%" stop-color="rgba(255,226,160,0.26)"/>
          <stop offset="100%" stop-color="rgba(255,226,160,0)"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="${frameWidth + shadowSpread * 2}" height="${frameHeight + shadowSpread * 2}" rx="${radius + shadowSpread}" ry="${radius + shadowSpread}" fill="url(#glow)"/>
    </svg>`,
    'utf8',
  );

  const shadowSvg = Buffer.from(
    `<svg width="${frameWidth + shadowSpread * 2}" height="${frameHeight + shadowSpread * 2}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${shadowSpread}" y="${shadowSpread}" width="${frameWidth}" height="${frameHeight}" rx="${radius}" ry="${radius}" fill="black" fill-opacity="${layout.shadowOpacity}"/>
    </svg>`,
    'utf8',
  );

  const borderSvg = Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.round(borderWidth / 2)}" y="${Math.round(borderWidth / 2)}" width="${frameWidth - borderWidth}" height="${frameHeight - borderWidth}" rx="${Math.max(0, radius - Math.round(borderWidth / 2))}" ry="${Math.max(0, radius - Math.round(borderWidth / 2))}" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="${borderWidth}"/>
    </svg>`,
    'utf8',
  );

  const sheenSvg = Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.34)"/>
          <stop offset="38%" stop-color="rgba(255,255,255,0.08)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${frameWidth}" height="${frameHeight}" rx="${radius}" ry="${radius}" fill="url(#sheen)"/>
    </svg>`,
    'utf8',
  );

  const composed = await baseImage
    .composite([
      { input: glowSvg, left: x - shadowSpread, top: y - shadowSpread, blend: 'screen' },
      { input: shadowSvg, left: x - shadowSpread, top: y - shadowSpread, blend: 'multiply' },
      { input: framedPortrait, left: x, top: y },
      { input: sheenSvg, left: x, top: y, blend: 'screen' },
      { input: borderSvg, left: x, top: y, blend: 'over' },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${composed.toString('base64')}`;
}
