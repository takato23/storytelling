import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { getImageDataUrlMetadata } from "@/lib/image-data-url";
import { getPrintProduct } from "@/lib/print-products";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { buildStoredZip } from "@/lib/zip";

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
  return "bin";
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

    const [{ data: item }, { data: pages }] = await Promise.all([
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

    if (!item) {
      throw new ApiError(404, "not_found", "Order not found");
    }

    const product = getPrintProduct((item.print_options_snapshot as { productId?: string } | null)?.productId as never);
    const files: Array<{ name: string; data: Buffer }> = [];

    const manifest = {
      order_id: id,
      product: product.title,
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
      const metadata = getImageDataUrlMetadata(String(page.image_url));
      const extension = getExtension(metadata.mimeType);
      files.push({
        name: `pages/page-${String(page.page_number).padStart(2, "0")}.${extension}`,
        data: metadata.bytes,
      });
    }

    const zipBytes = buildStoredZip(files);

    return new NextResponse(new Uint8Array(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="storymagic-print-${String(id).slice(0, 8)}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
