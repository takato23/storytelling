import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { getPrintProduct } from "@/lib/print-products";
import { buildSimplePdf } from "@/lib/pdf";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

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

    const [{ data: order }, { data: item }, { data: pages }, { data: shipping }] = await Promise.all([
      adminClient.from("orders").select("id,status,created_at").eq("id", id).maybeSingle(),
      adminClient
        .from("order_items")
        .select("story_id,print_options_snapshot")
        .eq("order_id", id)
        .limit(1)
        .maybeSingle(),
      adminClient
        .from("generated_pages")
        .select("page_number,page_type,width_px,height_px,status,error_message")
        .eq("order_id", id)
        .order("page_number", { ascending: true }),
      adminClient.from("shipping_addresses").select("recipient_name,city,state,postal_code").eq("order_id", id).maybeSingle(),
    ]);

    if (!order || !item) {
      throw new ApiError(404, "not_found", "Order not found");
    }

    const product = getPrintProduct((item.print_options_snapshot as { productId?: string } | null)?.productId as never);
    const lines = [
      `Orden: ${String(order.id).slice(0, 8)}`,
      `Fecha: ${new Date(String(order.created_at)).toLocaleDateString("es-AR")}`,
      `Estado: ${String(order.status)}`,
      `Producto: ${product.title}`,
      `Resolucion objetivo: ${product.recommendedResolution.width} x ${product.recommendedResolution.height}px`,
      shipping
        ? `Envio: ${String(shipping.recipient_name)} - ${String(shipping.city)} ${shipping.state ? `(${String(shipping.state)})` : ""}`
        : "Envio: no cargado",
      "",
      "Paginas generadas:",
      ...(pages ?? []).flatMap((page) => {
        const dims =
          page.width_px && page.height_px ? `${Number(page.width_px)}x${Number(page.height_px)}px` : "dimensiones desconocidas";
        const warning = page.error_message ? ` | revisar: ${String(page.error_message)}` : "";
        return [`P${Number(page.page_number)} ${String(page.page_type)} | ${String(page.status)} | ${dims}${warning}`];
      }),
    ];

    const pdfBytes = buildSimplePdf(`StoryMagic Print Pack | ${product.shortTitle}`, lines);

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
