/**
 * Consolidated image quality validation.
 * Single source of truth for checking generated image quality.
 */

import { getImageDataUrlMetadata, isLikelyBlankImage } from "@/lib/image-data-url";

export interface ImageQualityResult {
  width: number | null;
  height: number | null;
  isBlank: boolean;
  isPortrait: boolean;
  meetsResolution: boolean;
  issues: string[];
  hardFailure: boolean;
}

export function validateImageDataUrl(
  dataUrl: string,
  options?: {
    requireLandscape?: boolean;
    minWidth?: number;
    minHeight?: number;
  },
): ImageQualityResult {
  const metadata = getImageDataUrlMetadata(dataUrl);
  const issues: string[] = [];
  const width = metadata.width;
  const height = metadata.height;
  const isBlank = isLikelyBlankImage(dataUrl);
  let isPortrait = false;
  let meetsResolution = true;

  if (width === null || height === null) {
    issues.push("No se pudieron leer dimensiones de la imagen generada.");
  } else {
    isPortrait = width < height;
    if ((options?.requireLandscape ?? true) && isPortrait) {
      issues.push("La imagen quedó en orientación vertical y requiere revisión manual.");
    }

    if (options?.minWidth && width < options.minWidth) {
      meetsResolution = false;
      issues.push("La resolución quedó por debajo de la recomendada para imprenta.");
    }
    if (options?.minHeight && height < options.minHeight && meetsResolution) {
      meetsResolution = false;
      issues.push("La resolución quedó por debajo de la recomendada para imprenta.");
    }
  }

  if (isBlank) {
    issues.push("La imagen generada parece demasiado liviana o vacía.");
  }

  return {
    width,
    height,
    isBlank,
    isPortrait,
    meetsResolution,
    issues,
    hardFailure: isPortrait || isBlank,
  };
}
