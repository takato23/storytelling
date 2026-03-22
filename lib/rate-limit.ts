import { NextResponse } from "next/server";

type RateLimitWindow = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, RateLimitWindow>();

function cleanup(now: number) {
  for (const [key, window] of store.entries()) {
    if (window.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(
  request: Request,
  options: {
    key: string;
    limit: number;
    windowMs: number;
  },
) {
  const now = Date.now();
  cleanup(now);

  const scope = `${options.key}:${getClientIp(request)}`;
  const existing = store.get(scope);

  if (!existing || existing.expiresAt <= now) {
    store.set(scope, {
      count: 1,
      expiresAt: now + options.windowMs,
    });
    return null;
  }

  if (existing.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests. Please try again in a moment.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  existing.count += 1;
  store.set(scope, existing);
  return null;
}
