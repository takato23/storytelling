import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase";

const StickerWaitlistSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(180),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/stickers/waitlist";
  try {
    const payload = StickerWaitlistSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();

    const { error } = await adminClient.from("sticker_waitlist").upsert(
      {
        name: payload.name ?? null,
        email: payload.email,
      },
      { onConflict: "email" },
    );

    if (error) {
      throw new Error(error.message);
    }

    logEvent("info", "stickers_waitlist_joined", { request_id: requestId, route }, {
      email: payload.email,
    });
    const response = NextResponse.json({ success: true });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "stickers_waitlist_failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
