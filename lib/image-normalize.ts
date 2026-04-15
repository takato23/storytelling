import sharp from 'sharp';
import { getImageDataUrlMetadata } from '@/lib/image-data-url';

export async function normalizeImageDataUrlForGemini(
  dataUrl: string,
  options?: {
    maxDimension?: number;
    quality?: number;
  },
) {
  const metadata = getImageDataUrlMetadata(dataUrl);
  const maxDimension = options?.maxDimension ?? 1536;
  const quality = options?.quality ?? 88;

  const normalizedBuffer = await sharp(metadata.bytes)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      mozjpeg: true,
    })
    .toBuffer();

  return `data:image/jpeg;base64,${normalizedBuffer.toString('base64')}`;
}
