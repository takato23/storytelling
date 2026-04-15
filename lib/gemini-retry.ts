/**
 * Shared retry helpers for Gemini API calls.
 * Used by both story-generator.ts and image-generator.ts.
 */

export const MAX_RETRIES = 2;
export const BASE_RETRY_DELAY_MS = 10_000;

export function parseRetryDelayMs(error: unknown): number | null {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const retryMatch = message.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      return Math.ceil(parseFloat(retryMatch[1]) * 1000);
    }
  } catch { /* ignore */ }
  return null;
}

export function isQuotaZeroError(error: unknown): boolean {
  try {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('limit: 0') ||
      message.includes('"limit":0') ||
      /exceeded your current quota/i.test(message) ||
      /quota exceeded/i.test(message) ||
      /billing/i.test(message)
    );
  } catch { return false; }
}

export function isRateLimitError(error: unknown): boolean {
  try {
    const errObj = error as { status?: number };
    if (errObj.status === 429) return true;
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
  } catch { return false; }
}
