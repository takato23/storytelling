// TODO: For print-ready PDFs, add CMYK color space support.
// pdf-lib operates in RGB only. Options:
// - Convert images to CMYK via Sharp before embedding
// - Use a CMYK-aware PDF library (e.g., pdfkit with ICC profiles)
// - Add bleed marks and crop marks for professional printing
import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface IllustratedStoryPage {
  title: string;
  text: string;
  imageUrl?: string | null;
}

interface BuildIllustratedStoryPdfInput {
  title: string;
  pages: IllustratedStoryPage[];
}

interface BuildImageOnlyPdfInput {
  title: string;
  pages: Array<{ imageUrl?: string | null }>;
  pageWidthPoints?: number;
  pageHeightPoints?: number;
}

function isPng(bytes: Uint8Array) {
  return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function splitLines(text: string, maxCharsPerLine = 58) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }
    currentLine = candidate;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function loadImageBytes(imageUrl: string) {
  if (imageUrl.startsWith('/')) {
    return fs.readFile(path.join(process.cwd(), 'public', imageUrl.replace(/^\/+/, '')));
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch image ${imageUrl}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function embedImage(document: PDFDocument, imageUrl: string) {
  const bytes = await loadImageBytes(imageUrl);

  if (isPng(bytes)) {
    return document.embedPng(bytes);
  }

  if (isJpeg(bytes)) {
    return document.embedJpg(bytes);
  }

  throw new Error(`Unsupported image format for ${imageUrl}`);
}

export async function buildIllustratedStoryPdf(input: BuildIllustratedStoryPdfInput) {
  const document = await PDFDocument.create();
  const titleFont = await document.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await document.embedFont(StandardFonts.Helvetica);

  for (const [index, storyPage] of input.pages.entries()) {
    const page = document.addPage([612, 612]);
    const isCover = index === 0;

    if (storyPage.imageUrl) {
      const image = await embedImage(document, storyPage.imageUrl);
      if (isCover) {
        page.drawImage(image, { x: 0, y: 0, width: 612, height: 612 });
      } else {
        page.drawImage(image, { x: 56, y: 190, width: 500, height: 360 });
      }
    }

    if (isCover) {
      page.drawRectangle({ x: 0, y: 0, width: 612, height: 90, color: rgb(0, 0, 0), opacity: 0.25 });
      page.drawText(input.title, {
        x: 36,
        y: 38,
        size: 22,
        font: titleFont,
        color: rgb(1, 1, 1),
      });
      continue;
    }

    page.drawRectangle({ x: 32, y: 28, width: 548, height: 136, color: rgb(0.98, 0.97, 0.94) });
    page.drawText(storyPage.title, {
      x: 56,
      y: 134,
      size: 18,
      font: titleFont,
      color: rgb(0.14, 0.14, 0.17),
    });

    let currentY = 108;
    for (const line of splitLines(storyPage.text)) {
      page.drawText(line, {
        x: 56,
        y: currentY,
        size: 11.5,
        font: bodyFont,
        color: rgb(0.25, 0.25, 0.3),
      });
      currentY -= 16;
    }
  }

  return Buffer.from(await document.save());
}

export async function buildImageOnlyPdf(input: BuildImageOnlyPdfInput) {
  const document = await PDFDocument.create();
  const pageWidth = input.pageWidthPoints ?? 612;
  const pageHeight = input.pageHeightPoints ?? 612;

  for (const item of input.pages) {
    const page = document.addPage([pageWidth, pageHeight]);
    if (!item.imageUrl) continue;
    const image = await embedImage(document, item.imageUrl);
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  return Buffer.from(await document.save());
}
