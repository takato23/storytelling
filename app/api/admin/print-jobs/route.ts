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

    const [
      { data: orders, error: ordersError },
      { data: items, error: itemsError },
      { data: generatedPages, error: generatedPagesError },
      { data: digitalAssets, error: digitalAssetsError },
      { data: shippingAddresses, error: shippingAddressesError },
    ] = await Promise.all([
      adminClient.from("orders").select("id,user_id,status,currency,total,created_at").in("id", orderIds),
      adminClient
        .from("order_items")
        .select("order_id,story_id,format,print_options_snapshot")
        .in("order_id", orderIds),
      adminClient
        .from("generated_pages")
        .select("order_id,page_number,image_url,status,error_message,width_px,height_px")
        .in("order_id", orderIds)
        .order("page_number", { ascending: true }),
      adminClient
        .from("digital_assets")
        .select("order_id,asset_type,url,status")
        .in("order_id", orderIds),
      adminClient
        .from("shipping_addresses")
        .select("order_id,recipient_name,city,state,postal_code")
        .in("order_id", orderIds),
    ]);

    if (ordersError || itemsError || generatedPagesError || digitalAssetsError || shippingAddressesError) {
      throw new Error(
        ordersError?.message ??
          itemsError?.message ??
          generatedPagesError?.message ??
          digitalAssetsError?.message ??
          shippingAddressesError?.message ??
          "Failed to load print queue",
      );
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
    const shippingByOrderId = new Map((shippingAddresses ?? []).map((item) => [String(item.order_id), item]));
    const assetsByOrderId = new Map<string, Array<{ asset_type: string; url: string | null; status: string }>>();
    const pagesByOrderId = new Map<
      string,
      Array<{
        page_number: number;
        image_url: string | null;
        status: string;
        error_message: string | null;
        width_px: number | null;
        height_px: number | null;
      }>
    >();

    for (const asset of digitalAssets ?? []) {
      const orderId = String(asset.order_id);
      const group = assetsByOrderId.get(orderId) ?? [];
      group.push({
        asset_type: String(asset.asset_type),
        url: asset.url ? String(asset.url) : null,
        status: String(asset.status),
      });
      assetsByOrderId.set(orderId, group);
    }

    for (const page of generatedPages ?? []) {
      const orderId = String(page.order_id);
      const group = pagesByOrderId.get(orderId) ?? [];
      group.push({
        page_number: Number(page.page_number),
        image_url: page.image_url ? String(page.image_url) : null,
        status: String(page.status),
        error_message: page.error_message ? String(page.error_message) : null,
        width_px: page.width_px === null ? null : Number(page.width_px),
        height_px: page.height_px === null ? null : Number(page.height_px),
      });
      pagesByOrderId.set(orderId, group);
    }

    const response = jobs.map((job) => {
      const order = orderById.get(String(job.order_id));
      const item = itemByOrderId.get(String(job.order_id));
      const story = item ? storyById.get(String(item.story_id)) : null;
      const shipping = shippingByOrderId.get(String(job.order_id));
      const assets = assetsByOrderId.get(String(job.order_id)) ?? [];
      const pages = pagesByOrderId.get(String(job.order_id)) ?? [];

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
        assets: {
          print_pdf_url: assets.find((asset) => asset.asset_type === "print_pdf" && asset.status === "available")?.url ?? null,
          print_zip_url: assets.find((asset) => asset.asset_type === "print_zip" && asset.status === "available")?.url ?? null,
          thumbnail_url: assets.find((asset) => asset.asset_type === "thumbnail" && asset.status === "available")?.url ?? null,
        },
        qa_summary: {
          total_pages: pages.length,
          ready_pages: pages.filter((page) => page.status === "ready" || page.status === "approved").length,
          failed_pages: pages.filter((page) => page.status === "failed").length,
          pages: pages.slice(0, 5),
        },
        shipping_address: shipping
          ? {
              recipient_name: String(shipping.recipient_name),
              city: String(shipping.city),
              state: shipping.state ? String(shipping.state) : null,
              postal_code: String(shipping.postal_code),
            }
          : null,
      };
    });

    return NextResponse.json({ print_jobs: response });
  } catch (error) {
    return handleRouteError(error);
  }
}
