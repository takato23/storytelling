/**
 * Lightweight in-memory Gemini API usage tracking.
 * State is lost on server restart — acceptable for pre-launch.
 * Exposed via /api/admin/metrics.
 */

type CallType = "text" | "image";
type Outcome = "success" | "rate_limit" | "quota_error" | "fallback" | "error";

interface UsageEntry {
  count: number;
  lastAt: number;
}

const usage = new Map<string, UsageEntry>();

function key(type: CallType, outcome: Outcome) {
  return `${type}:${outcome}`;
}

export function recordGeminiCall(type: CallType, outcome: Outcome) {
  const k = key(type, outcome);
  const entry = usage.get(k);
  if (entry) {
    entry.count++;
    entry.lastAt = Date.now();
  } else {
    usage.set(k, { count: 1, lastAt: Date.now() });
  }
}

export function getGeminiUsageStats() {
  const stats: Record<string, { count: number; last_at: string | null }> = {};
  for (const [k, entry] of usage.entries()) {
    stats[k] = {
      count: entry.count,
      last_at: entry.lastAt ? new Date(entry.lastAt).toISOString() : null,
    };
  }
  return stats;
}
