#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const childPhotoArg = args.find((arg) => !arg.startsWith('--'));
const outputArg = args.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);

if (!childPhotoArg) {
  console.error('Usage: node scripts/generate-dino-book-batch.mjs /absolute/path/to/child-photo.jpg [--out=/absolute/output/dir]');
  process.exit(1);
}

const childPhotoPath = path.resolve(childPhotoArg);
const outputDir = outputArg
  ? path.resolve(outputArg)
  : path.join(projectRoot, 'tmp', 'dino-batch-preview');

const baseDir = path.resolve(projectRoot, 'public', 'stories', 'valentin-noche-dinosaurios');

const scenes = [
  {
    id: 'cover',
    baseImage: path.join(baseDir, 'cover.png'),
    outputName: 'cover-personalized.png',
    aspectRatio: '1:1',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story cover as composition and style reference. Create a square full-bleed premium 3D children\'s book cover in the exact same warm Pixar-like storybook style. Keep the same scene structure, same dinosaur companion mood, same lighting direction, same color palette, and same bedtime-adventure feeling. Replace only the child protagonist so he matches the real child photo: preserve child age, facial features, hair, skin tone, and child-safe proportions. Keep everything child-friendly, cohesive, and polished. Leave breathing room for later title placement. No text, no letters, no watermark.',
  },
  {
    id: 'spread-01-02',
    baseImage: path.join(baseDir, 'spread-01-02.png'),
    outputName: 'spread-01-02-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate this exact bedtime scene as a wide double-page spread in the same premium 3D storybook style. Keep the same bedroom, same dinosaur blanket, same warm night light, same parents presence without clear faces, and same emotional tone. Replace only the main child with the child from the photo while preserving a believable child look, same age range, natural proportions, and consistent lighting. Keep the key action slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-03-04',
    baseImage: path.join(baseDir, 'spread-03-04.png'),
    outputName: 'spread-03-04-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same quiet moonlit bedroom moment as a wide double-page spread in the same soft premium 3D children\'s book style. Keep the same dinosaur plush, same calm night atmosphere, and same storybook palette. Replace only the child so he matches the real child photo while staying child-like and natural. Keep the emotional focus slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-05-06',
    baseImage: path.join(baseDir, 'spread-05-06.png'),
    outputName: 'spread-05-06-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same magical transition scene as a wide double-page spread in the exact same premium 3D storybook style: child hugging the green dinosaur plush as it begins to glow. Keep the same room, same pose intention, same warm night lighting, and same emotional tone. Replace only the child identity with the child from the photo. Keep the main glow and action slightly left and reserve calmer space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-07-08',
    baseImage: path.join(baseDir, 'spread-07-08.png'),
    outputName: 'spread-07-08-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same first magical meeting where the dinosaur plush is alive and friendly, as a wide double-page spread in the same premium 3D children\'s book style. Keep the same room, same dinosaur design, same lighting, and same tenderness. Replace only the child so he matches the real child photo. Keep the encounter slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-09-10',
    baseImage: path.join(baseDir, 'spread-09-10.png'),
    outputName: 'spread-09-10-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same magical bedroom doorway scene as a wide double-page spread in the same premium 3D children\'s book style. Keep the same portal placement, same dinosaur companion, same night palette, and same sense of wonder. Replace only the child identity with the child from the photo. Keep the wonder and portal slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-11-12',
    baseImage: path.join(baseDir, 'spread-11-12.png'),
    outputName: 'spread-11-12-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same nighttime prehistoric jungle scene with fireflies as a wide double-page spread in the same premium 3D children\'s book style. Keep the same dinosaur design, same lighting feel, and same calm adventurous emotion. Replace only the child identity with the child from the photo. Keep the exploration slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-13-14',
    baseImage: path.join(baseDir, 'spread-13-14.png'),
    outputName: 'spread-13-14-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same warm cave scene with sleeping baby dinosaurs as a wide double-page spread in the same premium 3D storybook style. Keep the same cave warmth, same dinosaur world details, same night mood, and same composition. Replace only the child identity with the child from the photo. Keep the focal action slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-15-16',
    baseImage: path.join(baseDir, 'spread-15-16.png'),
    outputName: 'spread-15-16-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same cozy dinosaur cave scene as a wide double-page spread in the same premium 3D children\'s book style. Keep the same dinosaur companion, same cave nest, same lighting, and same camera framing. Replace only the child identity with the child from the photo. Keep the emotional focus slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-17-18',
    baseImage: path.join(baseDir, 'spread-17-18.png'),
    outputName: 'spread-17-18-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same nearby-cave reassurance scene as a wide double-page spread in the same premium 3D children\'s book style. Keep Dino, the nearby cave, the parent dinosaur silhouettes, the same lighting, and the same tenderness. Replace only the child identity with the child from the photo. Keep the emotional focus slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
  {
    id: 'spread-19-20',
    baseImage: path.join(baseDir, 'spread-19-20.png'),
    outputName: 'spread-19-20-personalized.png',
    aspectRatio: '16:9',
    imageSize: '4K',
    prompt:
      'Use the uploaded child photo as identity reference and the uploaded story spread as scene reference. Recreate the same peaceful ending scene back in bed as a wide double-page spread in the same premium 3D children\'s book style. Keep the same bedroom, same dinosaur plush, same calm sleeping pose, same warm night light, and same emotional closure. Replace only the child identity with the child from the photo. Keep the sleeping pose slightly left and leave calmer readable space on the right page for later editorial text overlay. No text, no watermark.',
  },
];

function mimeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function fileToInlinePart(filePath) {
  const bytes = await fs.readFile(filePath);
  return {
    inlineData: {
      data: bytes.toString('base64'),
      mimeType: mimeFromFile(filePath),
    },
  };
}

function extractInlineImageData(candidates) {
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }
  }
  return null;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const genAI = new GoogleGenAI({ apiKey });

  console.log(`Using model: ${modelName}`);
  console.log(`Child photo: ${childPhotoPath}`);
  console.log(`Output dir: ${outputDir}`);

  for (const scene of scenes) {
    console.log(`Generating ${scene.id}...`);
    const content = [
      scene.prompt,
      await fileToInlinePart(childPhotoPath),
      await fileToInlinePart(scene.baseImage),
    ];

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: content }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        imageConfig: {
          aspectRatio: scene.aspectRatio,
          imageSize: scene.imageSize,
        },
      },
    });
    const image = extractInlineImageData(result.candidates);

    if (!image?.data) {
      console.error(`Failed: ${scene.id}`);
      continue;
    }

    const outPath = path.join(outputDir, scene.outputName);
    await fs.writeFile(outPath, Buffer.from(image.data, 'base64'));
    console.log(`Saved ${outPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
