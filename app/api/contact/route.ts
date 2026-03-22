import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase";

const ContactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  message: z.string().trim().min(10).max(2000),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/contact";
  try {
    const limited = enforceRateLimit(request, { key: route, limit: 5, windowMs: 60_000 });
    if (limited) {
      return setRequestIdHeader(limited, requestId);
    }

    const payload = ContactPayloadSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();

    const { error } = await adminClient.from("contact_messages").insert({
      name: payload.name,
      email: payload.email,
      message: payload.message,
      status: "new",
    });

    if (error) {
      throw new Error(error.message);
    }

    logEvent("info", "contact_submitted", { request_id: requestId, route }, {
      email: payload.email,
    });
    const response = NextResponse.json({ success: true });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "contact_submit_failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
