import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAdminUser } from "@/lib/auth";
import { retryGeneratedOrderPage } from "@/lib/generation";
import { createSupabaseAdminClient } from "@/lib/supabase";

const RetryPagesSchema = z.object({
  page_number: z.number().int().positive().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const payload = RetryPagesSchema.parse(await request.json().catch(() => ({})));
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

    const { data: pages, error: pagesError } = await adminClient
      .from("generated_pages")
      .select("page_number,status")
      .eq("order_id", String(job.order_id))
      .order("page_number", { ascending: true });

    if (pagesError) {
      throw new Error(pagesError.message);
    }

    const targetPageNumbers =
      payload.page_number !== undefined
        ? [payload.page_number]
        : (pages ?? []).filter((page) => String(page.status) === "failed").map((page) => Number(page.page_number));

    if (targetPageNumbers.length === 0) {
      return NextResponse.json({ retried_pages: [], message: "No failed pages to retry." });
    }

    const retriedPages = [];
    for (const pageNumber of targetPageNumbers) {
      const page = await retryGeneratedOrderPage(adminClient, {
        orderId: String(job.order_id),
        pageNumber,
      });
      retriedPages.push(page);
    }

    await adminClient
      .from("orders")
      .update({ status: "qa_pending" })
      .eq("id", String(job.order_id));

    await adminClient
      .from("print_jobs")
      .update({ status: "review_required" })
      .eq("id", id);

    return NextResponse.json({
      retried_pages: retriedPages,
      order_id: String(job.order_id),
      print_job_id: String(job.id),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
