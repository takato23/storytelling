import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { assertOrderCanGenerate, processOrderGeneration } from "@/lib/generation";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { GenerateOrderRequestSchema } from "@/lib/types";

async function isAdminUser(adminClient: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await adminClient.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = "/api/generate";
  try {
    const { user } = await requireAuthenticatedUser();
    const payload = GenerateOrderRequestSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();
    const userIsAdmin = await isAdminUser(adminClient, user.id);
    logEvent("info", "generation.request", {
      request_id: requestId,
      route,
      user_id: user.id,
      order_id: payload.order_id,
    });

    const orderContext = await assertOrderCanGenerate(adminClient, payload.order_id, user.id, userIsAdmin);

    const { data: paidPayment } = await adminClient
      .from("payments")
      .select("id,status")
      .eq("order_id", payload.order_id)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!paidPayment && orderContext.orderStatus !== "ready_digital" && orderContext.orderStatus !== "print_queued") {
      throw new ApiError(409, "payment_required", "Order must be paid before generation");
    }

    const result = await processOrderGeneration(adminClient, {
      orderId: payload.order_id,
      triggerSource: payload.retry ? "manual_retry" : "manual_start",
    });

    logEvent("info", "generation.completed", {
      request_id: requestId,
      route,
      user_id: user.id,
      order_id: payload.order_id,
    }, {
      generation_job_id: result.generation_job_id,
      status: result.status,
    });
    const response = NextResponse.json(result, { status: 200 });
    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent("error", "generation.failed", { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}

export async function GET() {
  return NextResponse.json({
    service: "StoryMagic digital generation",
    status: "ok",
    mode: "order_pipeline",
  });
}
