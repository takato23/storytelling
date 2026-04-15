import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { resolveStorageUrlForClient } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const adminClient = createSupabaseAdminClient();

    /* ------------------------------------------------------------------ */
    /*  Book orders                                                       */
    /* ------------------------------------------------------------------ */

    const { data: orders, error: ordersError } = await adminClient
      .from("orders")
      .select("id,status,total,currency,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    let bookOrders: Array<Record<string, unknown>> = [];

    if (orders && orders.length > 0) {
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

      if (itemsError) throw new Error(itemsError.message);
      if (assetsError) throw new Error(assetsError.message);

      const storyIds = Array.from(
        new Set(
          (items ?? [])
            .map((item) => item.story_id)
            .filter(Boolean)
            .map((storyId) => String(storyId)),
        ),
      );

      let stories: Array<{ id: string; title: string; cover_image: string | null }> = [];
      if (storyIds.length > 0) {
        const { data: storiesData, error: storiesError } = await adminClient
          .from("stories")
          .select("id,title,cover_image")
          .in("id", storyIds);

        if (storiesError) throw new Error(storiesError.message);

        stories = (storiesData ?? []).map((story) => ({
          id: String(story.id),
          title: String(story.title),
          cover_image: story.cover_image ? String(story.cover_image) : null,
        }));
      }

      const storyById = new Map(stories.map((story) => [story.id, story]));
      const itemByOrderId = new Map<string, { format: string; story_id: string }>();

      for (const item of items ?? []) {
        if (!itemByOrderId.has(String(item.order_id))) {
          itemByOrderId.set(String(item.order_id), {
            format: String(item.format),
            story_id: String(item.story_id),
          });
        }
      }

      // Build asset maps per order — now including print_pdf and print_zip
      const assetMaps = {
        pdf: new Map<string, string | null>(),
        viewer: new Map<string, string | null>(),
        thumbnail: new Map<string, string | null>(),
        previewLowres: new Map<string, string | null>(),
        printPdf: new Map<string, string | null>(),
        printZip: new Map<string, string | null>(),
      };

      const assetTypeToMap: Record<string, Map<string, string | null>> = {
        digital_pdf: assetMaps.pdf,
        viewer: assetMaps.viewer,
        thumbnail: assetMaps.thumbnail,
        preview_lowres: assetMaps.previewLowres,
        print_pdf: assetMaps.printPdf,
        print_zip: assetMaps.printZip,
      };

      for (const asset of assets ?? []) {
        const assetType = String(asset.asset_type);
        const targetMap = assetTypeToMap[assetType];
        if (
          targetMap &&
          String(asset.status) === "available" &&
          !targetMap.has(String(asset.order_id))
        ) {
          targetMap.set(String(asset.order_id), asset.url ? String(asset.url) : null);
        }
      }

      bookOrders = await Promise.all(orders.map(async (order) => {
        const orderId = String(order.id);
        const item = itemByOrderId.get(orderId);
        const story = item ? storyById.get(item.story_id) : null;
        const thumbnailUrl = await resolveStorageUrlForClient(adminClient, assetMaps.thumbnail.get(orderId) ?? null);
        const previewLowresUrl = await resolveStorageUrlForClient(adminClient, assetMaps.previewLowres.get(orderId) ?? null);

        return {
          id: orderId,
          type: "book",
          status: String(order.status),
          format: item?.format ?? "digital",
          amount: Number(order.total),
          currency: String(order.currency),
          createdAt: String(order.created_at),
          title: story?.title ? String(story.title) : "Cuento personalizado",
          coverImage:
            thumbnailUrl ??
            previewLowresUrl ??
            (story?.cover_image ? String(story.cover_image) : null),
          pdfUrl: assetMaps.pdf.get(orderId) ?? null,
          viewerUrl: assetMaps.viewer.get(orderId) ?? null,
          printPdfUrl: assetMaps.printPdf.get(orderId) ?? null,
          printZipUrl: assetMaps.printZip.get(orderId) ?? null,
        };
      }));
    }

    /* ------------------------------------------------------------------ */
    /*  Sticker orders (matched by customer email)                        */
    /* ------------------------------------------------------------------ */

    let stickerOrders: Array<Record<string, unknown>> = [];
    const userEmail = user.email;

    if (userEmail) {
      const { data: stickers, error: stickersError } = await adminClient
        .from("sticker_orders")
        .select("id,status,customer_name,customer_email,child_gender,selected_themes,preview_image_url,quantity,unit_price_ars,total_ars,created_at")
        .eq("customer_email", userEmail)
        .order("created_at", { ascending: false });

      if (stickersError) {
        // Non-fatal: sticker_orders table may not exist in some envs
        console.warn("Could not fetch sticker_orders:", stickersError.message);
      } else {
        stickerOrders = (stickers ?? []).map((s) => ({
          id: String(s.id),
          type: "sticker",
          status: String(s.status),
          format: "sticker",
          amount: Number(s.total_ars),
          currency: "ARS",
          createdAt: String(s.created_at),
          title: `Stickers personalizados x${s.quantity}`,
          customerName: String(s.customer_name),
          childGender: String(s.child_gender),
          themes: Array.isArray(s.selected_themes) ? s.selected_themes.map(String) : [],
          quantity: Number(s.quantity),
          previewImageUrl: s.preview_image_url ? String(s.preview_image_url) : null,
          coverImage: s.preview_image_url ? String(s.preview_image_url) : null,
          pdfUrl: null,
          viewerUrl: null,
          printPdfUrl: null,
          printZipUrl: null,
        }));
      }
    }

    /* ------------------------------------------------------------------ */
    /*  Merge & sort by created_at desc                                   */
    /* ------------------------------------------------------------------ */

    const allOrders = [...bookOrders, ...stickerOrders].sort((a, b) => {
      const da = new Date(a.createdAt as string).getTime();
      const db = new Date(b.createdAt as string).getTime();
      return db - da;
    });

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    return handleRouteError(error);
  }
}
