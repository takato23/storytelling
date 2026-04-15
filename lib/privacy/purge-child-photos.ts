/**
 * Core implementation of the child-photo purge job.
 *
 * Deletes reference photos of children that are older than the configured
 * retention window (default 24h; override via CHILD_PHOTO_RETENTION_HOURS).
 *
 * Consumed by:
 *   - scripts/privacy/purge-child-photos.ts  (CLI entrypoint for `npm run privacy:purge`)
 *   - app/api/cron/purge-photos/route.ts     (Vercel Cron entrypoint)
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Logs each deletion to `consent_records.photo_purged_at` so the audit
 * trail shows exactly when each photo was removed. Failures are surfaced
 * but never crash the whole batch.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ConsentRow = {
  id: string;
  preview_session_id: string | null;
  order_id: string | null;
  photo_bucket: string | null;
  photo_path: string | null;
  created_at: string;
};

type AdminClient = SupabaseClient;

export type PurgeSummary = {
  scanned: number;
  deleted: number;
  failed: number;
  retentionHours: number;
};

function resolveRetentionHours(): number {
  const raw = Number(process.env.CHILD_PHOTO_RETENTION_HOURS ?? 24);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 24;
  }
  return raw;
}

function requireEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure them before running the purge.",
    );
  }
  return { url, key };
}

async function deletePhoto(
  adminClient: AdminClient,
  row: ConsentRow,
): Promise<{ ok: boolean; reason?: string }> {
  if (!row.photo_bucket || !row.photo_path) {
    return { ok: true, reason: "no_photo_reference" };
  }
  const { error } = await adminClient.storage.from(row.photo_bucket).remove([row.photo_path]);
  if (error && !/Object not found/i.test(error.message)) {
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function purgeChildPhotos(): Promise<PurgeSummary> {
  const { url, key } = requireEnv();
  const retentionHours = resolveRetentionHours();
  const adminClient = createClient(url, key) as AdminClient;

  const cutoffIso = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();
  console.log(`[purge] retention=${retentionHours}h cutoff=${cutoffIso}`);

  const { data, error } = await adminClient
    .from("consent_records")
    .select("id, preview_session_id, order_id, photo_bucket, photo_path, created_at")
    .is("photo_purged_at", null)
    .lt("created_at", cutoffIso)
    .limit(500);

  if (error) {
    throw new Error(`Failed to list consent_records: ${error.message}`);
  }

  const rows = (data ?? []) as ConsentRow[];
  console.log(`[purge] found ${rows.length} candidate rows`);

  let deleted = 0;
  let failed = 0;

  for (const row of rows) {
    const outcome = await deletePhoto(adminClient, row);
    if (!outcome.ok) {
      failed += 1;
      console.warn(`[purge] row=${row.id} error=${outcome.reason}`);
      continue;
    }

    const { error: updateError } = await adminClient
      .from("consent_records")
      .update({ photo_purged_at: new Date().toISOString() })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      console.warn(`[purge] row=${row.id} failed to mark purged: ${updateError.message}`);
      continue;
    }

    if (row.order_id || row.preview_session_id) {
      const { error: eventError } = await adminClient.from("order_events").insert({
        order_id: row.order_id,
        event_type: "child_photo_purged",
        metadata: {
          consent_record_id: row.id,
          preview_session_id: row.preview_session_id,
          bucket: row.photo_bucket,
          path: row.photo_path,
          retention_hours: retentionHours,
        },
      });
      if (eventError) {
        console.warn(`[purge] row=${row.id} failed to log event: ${eventError.message}`);
      }
    }

    deleted += 1;
  }

  console.log(`[purge] scanned=${rows.length} deleted=${deleted} failed=${failed}`);
  return { scanned: rows.length, deleted, failed, retentionHours };
}
