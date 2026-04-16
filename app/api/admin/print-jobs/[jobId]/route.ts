import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAdminUser, ApiError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { insertOrderEvent } from "@/lib/orders";
import { PrintJobTransitionRequestSchema, VALID_PRINT_JOB_TRANSITIONS } from "@/lib/types";
import type { PrintJobStatus } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { jobId } = await params;

    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("id,order_id,status,tracking_number,sla_due_at,created_at,updated_at")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const orderId = String(job.order_id);

    const [
      { data: order, error: orderError },
      { data: item, error: itemError },
      { data: generatedPages, error: generatedPagesError },
      { data: shippingAddress, error: shippingAddressError },
    ] = await Promise.all([
      adminClient.from("orders").select("id,user_id,status,currency,total,created_at").eq("id", orderId).maybeSingle(),
      adminClient.from("order_items").select("order_id,story_id,format,print_options_snapshot").eq("order_id", orderId).maybeSingle(),
      adminClient
        .from("generated_pages")
        .select("page_number,image_url,status,error_message,width_px,height_px")
        .eq("order_id", orderId)
        .order("page_number", { ascending: true }),
      adminClient
        .from("shipping_addresses")
        .select("recipient_name,city,state,postal_code")
        .eq("order_id", orderId)
        .maybeSingle(),
    ]);

    if (orderError || itemError || generatedPagesError || shippingAddressError) {
      throw new Error(
        orderError?.message ?? itemError?.message ?? generatedPagesError?.message ?? shippingAddressError?.message ?? "Failed to load print job",
      );
    }

    const story = item
      ? await adminClient
          .from("stories")
          .select("title")
          .eq("id", String(item.story_id))
          .maybeSingle()
          .then(({ data }) => data)
      : null;

    return NextResponse.json({
      id: String(job.id),
      status: String(job.status),
      tracking_number: job.tracking_number ? String(job.tracking_number) : null,
      sla_due_at: job.sla_due_at ? String(job.sla_due_at) : null,
      created_at: String(job.created_at),
      updated_at: String(job.updated_at),
      order: order
        ? {
            id: String(order.id),
            status: String(order.status),
            user_id: String(order.user_id),
            currency: String(order.currency),
            total: Number(order.total),
            created_at: String(order.created_at),
          }
        : null,
      item: item
        ? {
            format: String(item.format),
            story_id: String(item.story_id),
            print_options: item.print_options_snapshot ?? {},
            story_title: story?.title ? String(story.title) : "Cuento",
          }
        : null,
      pages: (generatedPages ?? []).map((page) => ({
        page_number: Number(page.page_number),
        image_url: page.image_url ? String(page.image_url) : null,
        status: String(page.status),
        error_message: page.error_message ? String(page.error_message) : null,
        width_px: page.width_px === null ? null : Number(page.width_px),
        height_px: page.height_px === null ? null : Number(page.height_px),
      })),
      shipping_address: shippingAddress
        ? {
            recipient_name: String(shippingAddress.recipient_name),
            city: String(shippingAddress.city),
            state: shippingAddress.state ? String(shippingAddress.state) : null,
            postal_code: String(shippingAddress.postal_code),
          }
        : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { jobId } = await params;

    const body = await request.json();
    const validatedBody = PrintJobTransitionRequestSchema.parse(body);

    // Load current print job
    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("id,order_id,status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const currentStatus = String(job.status) as PrintJobStatus;
    const targetStatus = validatedBody.to_status;

    // Validate transition
    const validTransitions = VALID_PRINT_JOB_TRANSITIONS[currentStatus] ?? [];
    if (!validTransitions.includes(targetStatus)) {
      throw new ApiError(409, "invalid_transition", `Cannot transition from ${currentStatus} to ${targetStatus}`);
    }

    const orderId = String(job.order_id);

    // Update print job status
    const updateData: Record<string, unknown> = { status: targetStatus };
    if (validatedBody.tracking_number) {
      updateData.tracking_number = validatedBody.tracking_number;
    }

    const { error: updateError } = await adminClient.from("print_jobs").update(updateData).eq("id", jobId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Bulk approve all ready pages when transitioning from review_required to approved
    if (currentStatus === "review_required" && targetStatus === "approved") {
      const { error: bulkApproveError } = await adminClient
        .from("generated_pages")
        .update({ status: "approved" })
        .eq("order_id", orderId)
        .eq("status", "ready");

      if (bulkApproveError) {
        throw new Error(bulkApproveError.message);
      }
    }

    // Update parent order status accordingly
    let newOrderStatus: string | null = null;

    if (targetStatus === "approved") {
      newOrderStatus = "ready_print_assets";
    } else if (targetStatus === "shipped") {
      newOrderStatus = "shipped";
    } else if (targetStatus === "delivered") {
      newOrderStatus = "delivered";
    } else if (targetStatus === "failed") {
      newOrderStatus = "qa_failed";
    } else if (targetStatus === "cancelled") {
      newOrderStatus = "cancelled";
    }

    if (newOrderStatus) {
      const { data: order, error: orderFetchError } = await adminClient
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .maybeSingle();

      if (orderFetchError) {
        throw new Error(orderFetchError.message);
      }

      const currentOrderStatus = order?.status ? String(order.status) : null;

      if (currentOrderStatus !== newOrderStatus) {
        const { error: orderUpdateError } = await adminClient.from("orders").update({ status: newOrderStatus }).eq("id", orderId);

        if (orderUpdateError) {
          throw new Error(orderUpdateError.message);
        }
      }
    }

    // Insert order event
    await insertOrderEvent(adminClient, {
      orderId,
      eventType: "print_job_status_transitioned",
      fromStatus: currentStatus,
      toStatus: targetStatus,
      note: validatedBody.note ?? null,
      payload: {
        print_job_id: jobId,
        tracking_number: validatedBody.tracking_number ?? null,
      },
    });

    // Fetch and return updated job
    const { data: updatedJob, error: fetchError } = await adminClient
      .from("print_jobs")
      .select("id,order_id,status,tracking_number,sla_due_at,created_at,updated_at")
      .eq("id", jobId)
      .maybeSingle();

    if (fetchError || !updatedJob) {
      throw new Error(fetchError?.message ?? "Failed to fetch updated print job");
    }

    return NextResponse.json({
      id: String(updatedJob.id),
      status: String(updatedJob.status),
      tracking_number: updatedJob.tracking_number ? String(updatedJob.tracking_number) : null,
      sla_due_at: updatedJob.sla_due_at ? String(updatedJob.sla_due_at) : null,
      created_at: String(updatedJob.created_at),
      updated_at: String(updatedJob.updated_at),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
