import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAdminUser } from "@/lib/auth";
import { retryGeneratedOrderPage } from "@/lib/generation";
import { createSupabaseAdminClient } from "@/lib/supabase";

const CustomPageSchema = z.object({
  page_number: z.number().int().positive(),
  prompt: z.string().min(20).max(4000),
});

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const payload = CustomPageSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();

    const { data: job, error: jobError } = await adminClient
      .from("print_jobs")
      .select("id,order_id")
      .eq("id", id)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    if (!job) {
      throw new ApiError(404, "not_found", "Print job not found");
    }

    const page = await retryGeneratedOrderPage(adminClient, {
      orderId: String(job.order_id),
      pageNumber: payload.page_number,
      overridePrompt: payload.prompt,
    });

    await adminClient.from("orders").update({ status: "qa_pending" }).eq("id", String(job.order_id));
    await adminClient.from("print_jobs").update({ status: "review_required" }).eq("id", id);

    return NextResponse.json({
      print_job_id: String(job.id),
      order_id: String(job.order_id),
      page,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
