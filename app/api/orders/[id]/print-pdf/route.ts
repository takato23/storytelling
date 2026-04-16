import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { getPrintProduct } from "@/lib/print-products";
import { rowsToStoryPages } from "@/lib/generated-pages";
import { buildImageOnlyPdf } from "@/lib/story-pdf";
import { resolveStorageUrlForClient } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";

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

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  let response: NextResponse;

  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;
    const adminClient = createSupabaseAdminClient();

    const [{ data: order }, { data: item }, { data: pages }] = await Promise.all([
      adminClient.from("orders").select("id,user_id,status,created_at").eq("id", id).maybeSingle(),
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

    // Verify user owns the order OR is an admin
    const userIsAdmin = await isAdmin(adminClient, user.id);
    if (String(order.user_id) !== user.id && !userIsAdmin) {
      throw new ApiError(403, "forbidden", "Access denied");
    }

    // Validate pages exist and have acceptable status
    if (!pages || pages.length === 0) {
      throw new ApiError(409, "no_pages", "No generated pages found for this order");
    }

    const failedPages = pages.filter((p) => p.status !== "ready" && p.status !== "approved");
    if (failedPages.length > 0) {
      logEvent("error", "print_pdf_invalid_pages", {
        request_id: requestId,
        route: "/api/orders/[id]/print-pdf",
        order_id: id,
        user_id: user.id,
      }, {
        failed_page_count: failedPages.length,
        failed_statuses: failedPages.map((p) => p.status),
      });
      throw new ApiError(
        409,
        "invalid_page_status",
        `${failedPages.length} page(s) are not ready for printing. All pages must have status 'ready' or 'approved'.`
      );
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

    response = new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="storymagic-print-${String(order.id).slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });

    logEvent("info", "print_pdf_generated", {
      request_id: requestId,
      route: "/api/orders/[id]/print-pdf",
      order_id: id,
      user_id: user.id,
    }, {
      page_count: pages.length,
      product_id: product.id,
      pdf_size_bytes: pdfBytes.length,
    });
  } catch (error) {
    response = handleRouteError(error);
  }

  return setRequestIdHeader(response, requestId);
}
