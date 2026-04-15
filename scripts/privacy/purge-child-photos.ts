#!/usr/bin/env -S npx tsx
/**
 * CLI entrypoint for the child-photo purge job.
 *
 * Run manually:
 *   npm run privacy:purge
 *   # or: npx tsx scripts/privacy/purge-child-photos.ts
 *
 * The same logic is invoked by Vercel Cron via
 * `app/api/cron/purge-photos/route.ts`. Shared implementation lives in
 * `lib/privacy/purge-child-photos.ts`.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { purgeChildPhotos } from "../../lib/privacy/purge-child-photos";

purgeChildPhotos()
  .then((summary) => {
    console.log("[purge] done", summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("[purge] fatal:", error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });

export { purgeChildPhotos };
