import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { ApiError, requireAuthenticatedUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function isAdminUser(adminClient: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
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
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      throw new Error(orderError.message);
    }

    if (!order) {
      throw new ApiError(404, "not_found", "Order not found");
    }

    if (String(order.user_id) !== user.id) {
      const isAdmin = await isAdminUser(adminClient, user.id);
      if (!isAdmin) {
        throw new ApiError(404, "not_found", "Order not found");
      }
    }

    const [
      { data: items, error: itemsError },
      { data: personalization, error: personalizationError },
      { data: payments, error: paymentsError },
      { data: events, error: eventsError },
      { data: assets, error: assetsError },
      { data: generationJobs, error: generationJobsError },
      { data: generatedPages, error: generatedPagesError },
      { data: printJob, error: printJobError },
      { data: shipping, error: shippingError },
    ] = await Promise.all([
      adminClient.from("order_items").select("*").eq("order_id", id),
      adminClient.from("personalizations").select("*").eq("order_id", id).maybeSingle(),
      adminClient.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
      adminClient.from("order_events").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      adminClient.from("digital_assets").select("*").eq("order_id", id),
      adminClient.from("generation_jobs").select("*").eq("order_id", id).order("created_at", { ascending: false }),
      adminClient.from("generated_pages").select("*").eq("order_id", id).order("page_number", { ascending: true }),
      adminClient.from("print_jobs").select("*").eq("order_id", id).maybeSingle(),
      adminClient.from("shipping_addresses").select("*").eq("order_id", id).maybeSingle(),
    ]);

    if (
      itemsError ||
      personalizationError ||
      paymentsError ||
      eventsError ||
      assetsError ||
      generationJobsError ||
      generatedPagesError ||
      printJobError ||
      shippingError
    ) {
      throw new Error(
        itemsError?.message ||
          personalizationError?.message ||
          paymentsError?.message ||
          eventsError?.message ||
          assetsError?.message ||
          generationJobsError?.message ||
          generatedPagesError?.message ||
          printJobError?.message ||
          shippingError?.message ||
          "Failed to load order details",
      );
    }

    return NextResponse.json({
      order,
      items: items ?? [],
      personalization: personalization ?? null,
      payments: payments ?? [],
      events: events ?? [],
      digital_assets: assets ?? [],
      generation_jobs: generationJobs ?? [],
      generated_pages: generatedPages ?? [],
      print_job: printJob ?? null,
      shipping_address: shipping ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
