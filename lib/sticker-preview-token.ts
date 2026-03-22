import crypto from "node:crypto";
import { ApiError } from "@/lib/auth";
import { getEnv } from "@/lib/config";
import { normalizeStickerThemes, type StickerGender, type StickerStyleId } from "@/lib/stickers";

const STICKER_PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000;

type StickerPreviewTokenPayload = {
  approved: true;
  childGender: StickerGender;
  styleId: StickerStyleId;
  themes: string[];
  previewHash: string;
  issuedAt: number;
  expiresAt: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getStickerPreviewSigningSecret() {
  const env = getEnv();
  return env.SUPABASE_SERVICE_ROLE_KEY ?? env.googleAiApiKey ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
}

function signEncodedPayload(encodedPayload: string) {
  const secret = getStickerPreviewSigningSecret();
  if (!secret) {
    throw new Error("Missing signing secret for sticker preview token");
  }

  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function hashStickerPreviewImage(previewImageUrl: string) {
  return crypto.createHash("sha256").update(previewImageUrl).digest("hex");
}

export function createStickerPreviewToken(input: {
  childGender: StickerGender;
  themes: string[];
  styleId: StickerStyleId;
  previewImageUrl: string;
}) {
  const issuedAt = Date.now();
  const payload: StickerPreviewTokenPayload = {
    approved: true,
    childGender: input.childGender,
    styleId: input.styleId,
    themes: normalizeStickerThemes(input.childGender, input.themes),
    previewHash: hashStickerPreviewImage(input.previewImageUrl),
    issuedAt,
    expiresAt: issuedAt + STICKER_PREVIEW_TOKEN_TTL_MS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyStickerPreviewToken(input: {
  token: string;
  childGender: StickerGender;
  themes: string[];
  styleId: StickerStyleId;
  previewImageUrl: string;
}) {
  const [encodedPayload, providedSignature] = input.token.split(".");
  if (!encodedPayload || !providedSignature) {
    throw new ApiError(400, "invalid_preview_token", "La preview no es válida.");
  }

  const expectedSignature = signEncodedPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new ApiError(400, "invalid_preview_token", "La preview no es válida.");
  }

  let payload: StickerPreviewTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as StickerPreviewTokenPayload;
  } catch {
    throw new ApiError(400, "invalid_preview_token", "La preview no es válida.");
  }

  if (!payload.approved || payload.expiresAt < Date.now()) {
    throw new ApiError(400, "expired_preview_token", "La preview venció. Generá una nueva.");
  }

  const normalizedThemes = normalizeStickerThemes(input.childGender, input.themes);
  const expectedPreviewHash = hashStickerPreviewImage(input.previewImageUrl);

  if (
    payload.childGender !== input.childGender ||
    payload.styleId !== input.styleId ||
    payload.previewHash !== expectedPreviewHash ||
    payload.themes.length !== normalizedThemes.length ||
    payload.themes.some((theme, index) => theme !== normalizedThemes[index])
  ) {
    throw new ApiError(400, "preview_mismatch", "La preview no coincide con la orden actual.");
  }

  return payload;
}
