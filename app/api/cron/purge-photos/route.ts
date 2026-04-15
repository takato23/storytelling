import { NextResponse } from "next/server";

import { purgeChildPhotos } from "@/lib/privacy/purge-child-photos";

/**
 * Vercel Cron endpoint that runs the child-photo purge job.
 *
 * Scheduled in `vercel.json` (see `crons`). Vercel Cron invokes this as a
 * GET with the header `Authorization: Bearer $CRON_SECRET`. We also allow
 * manual triggering with the same header for ops/debugging.
 *
 * The heavy lifting lives in `lib/privacy/purge-child-photos.ts`, which is
 * also consumed by `scripts/privacy/purge-child-photos.ts` (the CLI used
 * by `npm run privacy:purge`).
 *
 * Required env:
 *   - CRON_SECRET                      (random, 32+ chars — set in Vercel)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The purge can take longer than the default 10s on Hobby/Pro; give it
// headroom but keep under the Pro ceiling (300s).
export const maxDuration = 120;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed when the secret is unconfigured so an unprotected
    // endpoint can't silently expose data-modifying operations.
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await purgeChildPhotos();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron:purge-photos] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Allow POST too so you can trigger it from a curl/webhook without
// changing the verb; same auth rules apply.
export const POST = GET;
