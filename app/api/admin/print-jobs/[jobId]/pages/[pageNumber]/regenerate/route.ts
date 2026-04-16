import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, validationErrorResponse } from "@/lib/api";
import { requireAdminUser, ApiError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { retryGeneratedOrderPage } from "@/lib/generation";

const PageRegenerateRequestSchema = z.object({
  override_prompt: z.string().optional(),
});

type PageRegenerateRequest = z.infer<typeof PageRegenerateRequestSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string; pageNumber: string }> },
) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { jobId, pageNumber } = await params;

    const body = await request.json();
    const validationResult = PageRegenerateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { override_prompt } = validationResult.data;
    const pageNum = parseInt(pageNumber, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ApiError(400, "invalid_request", "pageNumber must be a positive integer");
    }

    // Load print job to get order_id
    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("order_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const orderId = String(job.order_id);

    // Call retryGeneratedOrderPage
    const regeneratedPage = await retryGeneratedOrderPage(adminClient, {
      orderId,
      pageNumber: pageNum,
      overridePrompt: override_prompt,
    });

    return NextResponse.json({
      page_number: Number(regeneratedPage.page_number),
      status: String(regeneratedPage.status),
      image_url: regeneratedPage.image_url ? String(regeneratedPage.image_url) : null,
      prompt_used: String(regeneratedPage.prompt_used),
      width_px: regeneratedPage.width_px,
      height_px: regeneratedPage.height_px,
      version: Number(regeneratedPage.version),
      error_message: regeneratedPage.error_message ? String(regeneratedPage.error_message) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
