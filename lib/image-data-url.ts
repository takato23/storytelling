function stripPrefix(value: string) {
  return value.replace(/^data:[^;]+;base64,/, "");
}

function readUInt16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUInt32BE(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function getPngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < pngSignature.length; index += 1) {
    if (bytes[index] !== pngSignature[index]) return null;
  }

  return {
    width: readUInt32BE(bytes, 16),
    height: readUInt32BE(bytes, 20),
  };
}

function getJpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: readUInt16BE(bytes, offset + 5),
        width: readUInt16BE(bytes, offset + 7),
      };
    }

    const segmentLength = readUInt16BE(bytes, offset + 2);
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }

  return null;
}

export function getImageDataUrlMetadata(dataUrl: string) {
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const buffer = Buffer.from(stripPrefix(dataUrl), "base64");
  const bytes = new Uint8Array(buffer);
  const dimensions = mimeType === "image/png" ? getPngDimensions(bytes) : getJpegDimensions(bytes);

  return {
    mimeType,
    bytes: buffer,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    byteLength: buffer.byteLength,
  };
}

export function isLikelyBlankImage(dataUrl: string) {
  const metadata = getImageDataUrlMetadata(dataUrl);
  return metadata.byteLength < 15_000;
}
