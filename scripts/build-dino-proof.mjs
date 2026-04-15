#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import {
  composeDinoBackCoverPage,
  composeDinoCoverPage,
  composeDinoSpreadPages,
} from '../lib/dino-book-compose.ts';
import {
  getValentinDinoPersonalizedTitle,
  getValentinDinoSceneText,
  VALENTIN_DINO_BOOK,
} from '../lib/books/valentin-dino-package.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function cmToPoints(valueCm) {
  return (valueCm / 2.54) * 72;
}

function stripDataUrlPrefix(value) {
  return value.replace(/^data:[^;]+;base64,/, '');
}

function extFromDataUrl(dataUrl) {
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}

async function buildImageOnlyPdfFromDataUrls(pages) {
  const document = await PDFDocument.create();
  const pageSize = cmToPoints(21);

  for (const page of pages) {
    const pdfPage = document.addPage([pageSize, pageSize]);
    const bytes = Buffer.from(stripDataUrlPrefix(page.imageDataUrl), 'base64');
    const image = extFromDataUrl(page.imageDataUrl) === 'png'
      ? await document.embedPng(bytes)
      : await document.embedJpg(bytes);

    pdfPage.drawImage(image, { x: 0, y: 0, width: pageSize, height: pageSize });
  }

  return Buffer.from(await document.save());
}

async function main() {
  const args = process.argv.slice(2);
  const childNameArg = args.find((arg) => !arg.startsWith('--'));
  const outArg = args.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);
  const childName = childNameArg?.trim() || 'Bruno';
  const outputDir = outArg
    ? path.resolve(outArg)
    : path.join(projectRoot, 'tmp', `dino-proof-${childName.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`);

  await fs.mkdir(outputDir, { recursive: true });

  const pages = [];
  const title = getValentinDinoPersonalizedTitle(childName);
  const coverScene = VALENTIN_DINO_BOOK.scenes.find((scene) => scene.id === 'cover');

  if (!coverScene) {
    throw new Error('Cover scene not found');
  }

  const coverImageDataUrl = `data:image/png;base64,${(await fs.readFile(
    path.join(projectRoot, 'public', 'stories', 'valentin-noche-dinosaurios', coverScene.fileName),
  )).toString('base64')}`;
  const backCoverPath = path.join(projectRoot, 'public', 'stories', 'valentin-noche-dinosaurios', 'back-cover.png');
  const hasBackCover = await fs
    .access(backCoverPath)
    .then(() => true)
    .catch(() => false);
  const backCoverImageDataUrl = hasBackCover
    ? `data:image/png;base64,${(await fs.readFile(backCoverPath)).toString('base64')}`
    : null;

  pages.push(await composeDinoCoverPage({
    imageDataUrl: coverImageDataUrl,
    title,
    childName,
    theme: VALENTIN_DINO_BOOK.editorialTheme,
  }));

  for (const scene of VALENTIN_DINO_BOOK.scenes) {
    if (scene.assetKind !== 'spread') continue;
    const spreadImageDataUrl = `data:image/png;base64,${(await fs.readFile(
      path.join(projectRoot, 'public', 'stories', 'valentin-noche-dinosaurios', scene.fileName),
    )).toString('base64')}`;

    const leftPageNumber = scene.storyPageRange ? scene.storyPageRange[0] + 1 : scene.pageNumber;
    const composedPages = await composeDinoSpreadPages({
      spreadId: scene.id,
      spreadImageDataUrl,
      title: scene.title,
      text: getValentinDinoSceneText(scene, childName),
      leftPageNumber,
      storyPageRange: scene.storyPageRange ?? [leftPageNumber - 1, leftPageNumber],
      theme: VALENTIN_DINO_BOOK.editorialTheme,
      textPlacement: scene.textPlacement,
    });

    pages.push(...composedPages);
  }

  pages.push(await composeDinoBackCoverPage({
    coverImageDataUrl,
    title,
    backCoverImageDataUrl,
    theme: VALENTIN_DINO_BOOK.editorialTheme,
  }));

  const sortedPages = pages.sort((left, right) => left.pageNumber - right.pageNumber);

  for (const page of sortedPages) {
    const fileName = `page-${String(page.pageNumber).padStart(2, '0')}.${extFromDataUrl(page.imageDataUrl)}`;
    await fs.writeFile(path.join(outputDir, fileName), Buffer.from(stripDataUrlPrefix(page.imageDataUrl), 'base64'));
  }

  const pdfBytes = await buildImageOnlyPdfFromDataUrls(sortedPages);
  await fs.writeFile(path.join(outputDir, 'proof-book.pdf'), pdfBytes);
  await fs.writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(
      {
        childName,
        title,
        pages: sortedPages.map((page) => ({
          pageNumber: page.pageNumber,
          title: page.title,
          layoutVariant: page.layoutVariant,
          sourceSceneId: page.sourceSceneId ?? null,
        })),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Proof generated at ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
