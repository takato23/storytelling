import fs from 'node:fs/promises';
import path from 'node:path';

function mimeTypeFromExtension(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}

export async function readPublicAssetAsDataUrl(assetUrl: string) {
  const sanitizedPath = assetUrl.replace(/^\/+/, '');
  const absolutePath = path.join(process.cwd(), 'public', sanitizedPath);
  const bytes = await fs.readFile(absolutePath);
  const mimeType = mimeTypeFromExtension(absolutePath);

  return {
    absolutePath,
    mimeType,
    dataUrl: `data:${mimeType};base64,${bytes.toString('base64')}`,
  };
}
