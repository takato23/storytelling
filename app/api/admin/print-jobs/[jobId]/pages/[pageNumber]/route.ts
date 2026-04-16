import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, validationErrorResponse } from "@/lib/api";
import { requireAdminUser, ApiError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { insertOrderEvent } from "@/lib/orders";

const PageActionRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

type PageActionRequest = z.infer<typeof PageActionRequestSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string; pageNumber: string }> },
) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { jobId, pageNumber } = await params;

    const body = await request.json();
    const validationResult = PageActionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { action, note } = validationResult.data;
    const pageNum = parseInt(pageNumber, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ApiError(400, "invalid_request", "pageNumber must be a positive integer");
    }

    // Load the print job to get order_id
    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("order_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const orderId = String(job.order_id);

    // Load the generated_page by order_id + page_number
    const { data: page, error: pageError } = await adminClient
      .from("generated_pages")
      .select("page_number,status,image_url")
      .eq("order_id", orderId)
      .eq("page_number", pageNum)
      .maybeSingle();

    if (pageError || !page) {
      throw new ApiError(404, "not_found", "Generated page not found");
    }

    // Update page status based on action
    if (action === "approve") {
      const { error: updateError } = await adminClient
        .from("generated_pages")
        .update({ status: "approved" })
        .eq("order_id", orderId)
        .eq("page_number", pageNum);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else if (action === "reject") {
      const { error: updateError } = await adminClient
        .from("generated_pages")
        .update({
          status: "failed",
          error_message: note ?? "Page rejected during QA review",
        })
        .eq("order_id", orderId)
        .eq("page_number", pageNum);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // Insert order event with page details
    await insertOrderEvent(adminClient, {
      orderId,
      eventType: `page_${action}ed`,
      note: note ?? null,
      payload: {
        page_number: pageNum,
        print_job_id: jobId,
      },
    });

    // Return updated page
    const { data: updatedPage, error: fetchError } = await adminClient
      .from("generated_pages")
      .select("page_number,status,image_url")
      .eq("order_id", orderId)
      .eq("page_number", pageNum)
      .maybeSingle();

    if (fetchError || !updatedPage) {
      throw new Error(fetchError?.message ?? "Failed to fetch updated page");
    }

    return NextResponse.json({
      page_number: Number(updatedPage.page_number),
      status: String(updatedPage.status),
      image_url: updatedPage.image_url ? String(updatedPage.image_url) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
