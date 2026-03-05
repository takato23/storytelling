import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAdminUser } from "@/lib/auth";
import { insertOrderEvent } from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  PrintJobStatusSchema,
  PrintJobTransitionRequestSchema,
  VALID_PRINT_JOB_TRANSITIONS,
} from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const ORDER_STATUS_BY_PRINT_STATUS: Record<string, string> = {
  queued: "print_queued",
  in_production: "in_production",
  packed: "packed",
  shipped: "shipped",
  delivered: "delivered",
  failed: "failed",
  cancelled: "cancelled",
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const payload = PrintJobTransitionRequestSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();

    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("id,order_id,status")
      .eq("id", id)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    if (!job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const parsedCurrentStatus = PrintJobStatusSchema.safeParse(job.status);
    if (!parsedCurrentStatus.success) {
      throw new ApiError(409, "invalid_state", "Current print job state is invalid");
    }

    const currentStatus = parsedCurrentStatus.data;
    const allowedTransitions = VALID_PRINT_JOB_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(payload.to_status)) {
      throw new ApiError(
        409,
        "invalid_transition",
        `Invalid transition from ${currentStatus} to ${payload.to_status}`,
      );
    }

    const { data: updatedJob, error: updateError } = await adminClient
      .from("print_jobs")
      .update({
        status: payload.to_status,
        tracking_number: payload.tracking_number ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedJob) {
      throw new Error(updateError?.message ?? "Failed to update print job");
    }

    await adminClient
      .from("orders")
      .update({ status: ORDER_STATUS_BY_PRINT_STATUS[payload.to_status] ?? "print_queued" })
      .eq("id", job.order_id);

    await insertOrderEvent(adminClient, {
      orderId: String(job.order_id),
      eventType: "print_job_transition",
      fromStatus: ORDER_STATUS_BY_PRINT_STATUS[currentStatus],
      toStatus: ORDER_STATUS_BY_PRINT_STATUS[payload.to_status],
      note: payload.note ?? null,
      payload: {
        print_job_id: id,
        from_print_status: currentStatus,
        to_print_status: payload.to_status,
        tracking_number: payload.tracking_number ?? null,
      },
    });

    return NextResponse.json({
      print_job: updatedJob,
      transition: {
        from: currentStatus,
        to: payload.to_status,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
