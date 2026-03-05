import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = adminClient
      .from("print_jobs")
      .select("id,order_id,status,tracking_number,sla_due_at,created_at,updated_at")
      .order("created_at", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: jobs, error: jobsError } = await query;
    if (jobsError) {
      throw new Error(jobsError.message);
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ print_jobs: [] });
    }

    const orderIds = jobs.map((job) => String(job.order_id));

    const [{ data: orders, error: ordersError }, { data: items, error: itemsError }] = await Promise.all([
      adminClient.from("orders").select("id,user_id,status,currency,total,created_at").in("id", orderIds),
      adminClient
        .from("order_items")
        .select("order_id,story_id,format,print_options_snapshot")
        .in("order_id", orderIds),
    ]);

    if (ordersError || itemsError) {
      throw new Error(ordersError?.message ?? itemsError?.message ?? "Failed to load print queue");
    }

    const storyIds = Array.from(new Set((items ?? []).map((item) => String(item.story_id))));
    const { data: stories, error: storiesError } = await adminClient
      .from("stories")
      .select("id,title")
      .in("id", storyIds);

    if (storiesError) {
      throw new Error(storiesError.message);
    }

    const orderById = new Map((orders ?? []).map((order) => [String(order.id), order]));
    const itemByOrderId = new Map((items ?? []).map((item) => [String(item.order_id), item]));
    const storyById = new Map((stories ?? []).map((story) => [String(story.id), story]));

    const response = jobs.map((job) => {
      const order = orderById.get(String(job.order_id));
      const item = itemByOrderId.get(String(job.order_id));
      const story = item ? storyById.get(String(item.story_id)) : null;

      return {
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
      };
    });

    return NextResponse.json({ print_jobs: response });
  } catch (error) {
    return handleRouteError(error);
  }
}
