export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL format. Expected: data:image/[type];base64,[base64-encoded-data]");
  }

  const [, mimeType, base64Data] = match;
  return {
    mimeType,
    buffer: Buffer.from(base64Data, "base64"),
  };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function isValidDataUrl(dataUrl: string): boolean {
  return /^data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+$/.test(dataUrl);
}
