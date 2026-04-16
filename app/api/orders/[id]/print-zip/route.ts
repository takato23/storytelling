import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { getPrintProduct } from "@/lib/print-products";
import { parseStorageUri } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { buildStoredZip } from "@/lib/zip";
import { getRequestId, logEvent, setRequestIdHeader } from "@/lib/observability";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function isAdmin(adminClient: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await adminClient.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

function getExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

async function loadImageBytes(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  imageUrl: string,
) {
  const storageRef = parseStorageUri(imageUrl);
  if (storageRef) {
    const { data, error } = await adminClient.storage.from(storageRef.bucket).download(storageRef.objectPath);
    if (error || !data) {
      throw new Error(error?.message ?? `Unable to download ${imageUrl}`);
    }
    const bytes = Buffer.from(await data.arrayBuffer());
    return {
      bytes,
      mimeType: data.type || "image/jpeg",
    };
  }

  throw new Error(
    `Image URL must use storage:// scheme. Got: ${imageUrl.slice(0, 80)}`
  );
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  let response: NextResponse;

  try {
    const { user } = await requireAuthenticatedUser();
    const { id } = await context.params;
    const adminClient = createSupabaseAdminClient();

    const [{ data: order }, { data: item }, { data: pages }] = await Promise.all([
      adminClient.from("orders").select("id,user_id").eq("id", id).maybeSingle(),
      adminClient
        .from("order_items")
        .select("print_options_snapshot")
        .eq("order_id", id)
        .limit(1)
        .maybeSingle(),
      adminClient
        .from("generated_pages")
        .select("page_number,image_url,status,error_message,width_px,height_px")
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
      logEvent("error", "print_zip_invalid_pages", {
        request_id: requestId,
        route: "/api/orders/[id]/print-zip",
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
    const files: Array<{ name: string; data: Buffer }> = [];

    const manifest = {
      order_id: id,
      product: product.title,
      product_id: product.id,
      generated_at: new Date().toISOString(),
      recommended_resolution: product.recommendedResolution,
      pages: (pages ?? []).map((page) => ({
        page_number: Number(page.page_number),
        status: String(page.status),
        width_px: page.width_px === null ? null : Number(page.width_px),
        height_px: page.height_px === null ? null : Number(page.height_px),
        error_message: page.error_message ? String(page.error_message) : null,
      })),
    };

    files.push({
      name: "manifest.json",
      data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    });

    for (const page of pages ?? []) {
      if (!page.image_url) continue;
      const metadata = await loadImageBytes(adminClient, String(page.image_url));
      const extension = getExtension(metadata.mimeType);
      files.push({
        name: `pages/page-${String(page.page_number).padStart(2, "0")}.${extension}`,
        data: metadata.bytes,
      });
    }

    const zipBytes = buildStoredZip(files);

    response = new NextResponse(new Uint8Array(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="storymagic-print-${String(id).slice(0, 8)}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });

    logEvent("info", "print_zip_generated", {
      request_id: requestId,
      route: "/api/orders/[id]/print-zip",
      order_id: id,
      user_id: user.id,
    }, {
      page_count: pages.length,
      product_id: product.id,
      zip_size_bytes: zipBytes.length,
      file_count: files.length,
    });
  } catch (error) {
    response = handleRouteError(error);
  }

  return setRequestIdHeader(response, requestId);
}
