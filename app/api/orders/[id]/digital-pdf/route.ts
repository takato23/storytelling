import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { buildPersonalizedStory, storyToPdfLines } from "@/lib/digital-story";
import { rowsToStoryPages } from "@/lib/generated-pages";
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

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id,user_id,status,created_at")
      .eq("id", id)
      .maybeSingle();

    if (orderError || !order) {
      throw new ApiError(404, "not_found", "Order not found");
    }

    if (String(order.user_id) !== user.id) {
      const userIsAdmin = await isAdmin(adminClient, user.id);
      if (!userIsAdmin) {
        throw new ApiError(404, "not_found", "Order not found");
      }
    }

    const allowedStatuses = new Set(["ready_digital", "print_queued", "in_production", "packed", "shipped", "delivered"]);
    if (!allowedStatuses.has(String(order.status))) {
      throw new ApiError(409, "digital_not_ready", "Digital asset not ready yet");
    }

    const [{ data: item }, { data: personalization }, { data: generatedRows }] = await Promise.all([
      adminClient.from("order_items").select("story_id").eq("order_id", id).limit(1).maybeSingle(),
      adminClient
        .from("personalizations")
        .select("child_profile,personalization_payload")
        .eq("order_id", id)
        .maybeSingle(),
      adminClient
        .from("generated_pages")
        .select("page_number,prompt_used,image_url")
        .eq("order_id", id)
        .order("page_number", { ascending: true }),
    ]);

    const { data: story } = item
      ? await adminClient.from("stories").select("title").eq("id", String(item.story_id)).maybeSingle()
      : { data: null };

    const storyTitle = (story?.title ?? "Historia personalizada").toString();
    const childProfile = personalization?.child_profile as Record<string, unknown> | null;
    const payload = personalization?.personalization_payload as Record<string, unknown> | null;

    const childName = String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero");
    const readingLevel = typeof payload?.reading_level === "string" ? payload.reading_level : null;
    const familyMembers = Array.isArray(payload?.family_members)
      ? (payload?.family_members as Array<{ name?: string }>)
      : [];

    const pages =
      generatedRows && generatedRows.length > 0
        ? rowsToStoryPages(generatedRows)
        : buildPersonalizedStory({
            childName,
            storyTitle,
            readingLevel,
            familyMembers,
          });

    const lines = [
      `Orden: ${String(order.id).slice(0, 8)}`,
      `Fecha: ${new Date(String(order.created_at)).toLocaleDateString("es-AR")}`,
      "",
      ...storyToPdfLines(pages),
    ];

    const pdfBytes = buildSimplePdf(`StoryMagic | ${storyTitle}`, lines);

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="storymagic-${String(order.id).slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
