import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const adminClient = createSupabaseAdminClient();

    const { data: orders, error: ordersError } = await adminClient
      .from("orders")
      .select("id,status,total,currency,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = orders.map((order) => String(order.id));

    const [{ data: items, error: itemsError }, { data: assets, error: assetsError }] = await Promise.all([
      adminClient
        .from("order_items")
        .select("order_id,format,story_id")
        .in("order_id", orderIds),
      adminClient
        .from("digital_assets")
        .select("order_id,asset_type,url,status")
        .in("order_id", orderIds),
    ]);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    if (assetsError) {
      throw new Error(assetsError.message);
    }

    const storyIds = Array.from(new Set((items ?? []).map((item) => String(item.story_id))));

    const { data: stories, error: storiesError } = await adminClient
      .from("stories")
      .select("id,title,cover_image")
      .in("id", storyIds);

    if (storiesError) {
      throw new Error(storiesError.message);
    }

    const storyById = new Map((stories ?? []).map((story) => [String(story.id), story]));
    const itemByOrderId = new Map<string, { format: string; story_id: string }>();

    for (const item of items ?? []) {
      if (!itemByOrderId.has(String(item.order_id))) {
        itemByOrderId.set(String(item.order_id), {
          format: String(item.format),
          story_id: String(item.story_id),
        });
      }
    }

    const pdfByOrderId = new Map<string, string | null>();
    const viewerByOrderId = new Map<string, string | null>();
    const thumbnailByOrderId = new Map<string, string | null>();
    for (const asset of assets ?? []) {
      if (String(asset.asset_type) === "pdf" && String(asset.status) === "available" && !pdfByOrderId.has(String(asset.order_id))) {
        pdfByOrderId.set(String(asset.order_id), asset.url ? String(asset.url) : null);
      }
      if (
        String(asset.asset_type) === "viewer" &&
        String(asset.status) === "available" &&
        !viewerByOrderId.has(String(asset.order_id))
      ) {
        viewerByOrderId.set(String(asset.order_id), asset.url ? String(asset.url) : null);
      }
      if (
        String(asset.asset_type) === "thumbnail" &&
        String(asset.status) === "available" &&
        !thumbnailByOrderId.has(String(asset.order_id))
      ) {
        thumbnailByOrderId.set(String(asset.order_id), asset.url ? String(asset.url) : null);
      }
    }

    const responseOrders = orders.map((order) => {
      const item = itemByOrderId.get(String(order.id));
      const story = item ? storyById.get(item.story_id) : null;

      return {
        id: String(order.id),
        status: String(order.status),
        format: item?.format ?? "digital",
        amount: Number(order.total),
        currency: String(order.currency),
        createdAt: String(order.created_at),
        title: story?.title ? String(story.title) : "Cuento personalizado",
        coverImage: thumbnailByOrderId.get(String(order.id)) ?? (story?.cover_image ? String(story.cover_image) : null),
        pdfUrl: pdfByOrderId.get(String(order.id)) ?? null,
        viewerUrl: viewerByOrderId.get(String(order.id)) ?? null,
      };
    });

    return NextResponse.json({ orders: responseOrders });
  } catch (error) {
    return handleRouteError(error);
  }
}
