/**
 * Shared fal.ai client configuration for all fal-backed image providers.
 *
 * The `@fal-ai/client` package auto-picks up `FAL_KEY` from env. We still
 * call `fal.config()` to make the credential source explicit and to allow
 * a per-request override if ever needed.
 */

import { fal } from "@fal-ai/client";
import { getFalConfig } from "@/lib/config";

let configured = false;

export function ensureFalConfigured() {
  if (configured) return;
  const { apiKey } = getFalConfig();
  if (!apiKey) {
    throw new Error(
      "FAL_KEY is not configured. Add FAL_KEY to your environment before using fal.ai providers.",
    );
  }
  fal.config({ credentials: apiKey });
  configured = true;
}

/** Converts a raw base64 string to a data URL. If the input is already a data URL, returns it as-is. */
export function toDataUrl(base64OrDataUrl: string, mimeType = "image/jpeg"): string {
  if (base64OrDataUrl.startsWith("data:")) return base64OrDataUrl;
  return `data:${mimeType};base64,${base64OrDataUrl}`;
}

/** Fetches a URL into a data URL. Used when fal returns an HTTPS image URL and callers expect a data URL. */
export async function fetchUrlAsDataUrl(url: string, timeoutMs = 30_000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

export { fal };
