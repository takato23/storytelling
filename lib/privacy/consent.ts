/**
 * Consent recording helpers.
 *
 * The API endpoint that accepts a child reference photo must call
 * `recordChildPhotoConsent()` BEFORE initiating any generation. If the
 * insert fails we still proceed (the consent was given) but log an
 * error — the intent is to never drop the guarantee-of-service for a
 * database hiccup, while keeping the paper trail best-effort.
 */

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConsentPayload {
  accepted: boolean;
  version: string;
  text: string;
}

export interface RecordConsentInput {
  adminClient: SupabaseClient;
  previewSessionId?: string | null;
  orderId?: string | null;
  userId?: string | null;
  childName?: string | null;
  consent: ConsentPayload;
  request: Request;
  photo?: { bucket: string; path: string } | null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // salt with a rotating daily value so the hash isn't directly
  // reversible via a rainbow table of all IPv4 addresses.
  const salt = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);
}

function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export async function recordChildPhotoConsent(input: RecordConsentInput): Promise<string | null> {
  if (!input.consent?.accepted) {
    throw new Error("Cannot record consent that was not accepted");
  }

  const userAgent = input.request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const ipHash = hashIp(extractClientIp(input.request));

  try {
    const { data, error } = await input.adminClient
      .from("consent_records")
      .insert({
        preview_session_id: input.previewSessionId ?? null,
        order_id: input.orderId ?? null,
        user_id: input.userId ?? null,
        consent_version: input.consent.version,
        consent_text: input.consent.text,
        child_name: input.childName ?? null,
        ip_hash: ipHash,
        user_agent: userAgent,
        photo_bucket: input.photo?.bucket ?? null,
        photo_path: input.photo?.path ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[consent] failed to persist consent record:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.warn("[consent] unexpected error persisting consent:", error instanceof Error ? error.message : error);
    return null;
  }
}
