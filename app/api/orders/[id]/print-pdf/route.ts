import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { getPrintProduct } from "@/lib/print-products";
import { rowsToStoryPages } from "@/lib/generated-pages";
import { buildImageOnlyPdf } from "@/lib/story-pdf";
import { resolveStorageUrlForClient } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function cmToPoints(valueCm: number) {
  return (valueCm / 2.54) * 72;
}

async function isAdmin(adminClient: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await adminClient.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;
    const adminClient = createSupabaseAdminClient();

    const userIsAdmin = await isAdmin(adminClient, user.id);
    if (!userIsAdmin) {
      throw new ApiError(403, "forbidden", "Admin access required");
    }

    const [{ data: order }, { data: item }, { data: pages }] = await Promise.all([
      adminClient.from("orders").select("id,status,created_at").eq("id", id).maybeSingle(),
      adminClient
        .from("order_items")
        .select("story_id,print_options_snapshot")
        .eq("order_id", id)
        .limit(1)
        .maybeSingle(),
      adminClient
        .from("generated_pages")
        .select("page_number,prompt_used,image_url,page_type,width_px,height_px,status,error_message")
        .eq("order_id", id)
        .order("page_number", { ascending: true }),
    ]);

    if (!order || !item) {
      throw new ApiError(404, "not_found", "Order not found");
    }

    const product = getPrintProduct((item.print_options_snapshot as { productId?: string } | null)?.productId as never);
    const resolvedRows = await Promise.all(
      (pages ?? []).map(async (page) => ({
        ...page,
        image_url: await resolveStorageUrlForClient(adminClient, page.image_url ? String(page.image_url) : null),
      })),
    );

    const storyPages = rowsToStoryPages(resolvedRows);
    const pageSizePoints = cmToPoints(21);
    const pdfBytes = await buildImageOnlyPdf({
      title: `StoryMagic Print Pack | ${product.shortTitle}`,
      pages: storyPages,
      pageWidthPoints: pageSizePoints,
      pageHeightPoints: pageSizePoints,
    });

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="storymagic-print-${String(order.id).slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
