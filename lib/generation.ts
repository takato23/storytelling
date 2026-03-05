import type { SupabaseClient } from "@supabase/supabase-js";
import { generateStoryPages } from "@/lib/story-generator";
import { serializePagePayload } from "@/lib/generated-pages";
import { generateImageWithGemini } from "@/lib/image-generator";
import { ApiError } from "@/lib/auth";
import { insertOrderEvent } from "@/lib/orders";

type GenerationTrigger = "stripe_webhook" | "manual_retry" | "manual_start" | "system";

interface OrderGenerationContext {
  orderId: string;
  userId: string;
  orderStatus: string;
  currency: string;
  isPrintOrder: boolean;
}

async function loadOrderGenerationContext(
  adminClient: SupabaseClient,
  orderId: string,
): Promise<OrderGenerationContext> {
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .select("id,user_id,status,currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new ApiError(404, "not_found", "Order not found");
  }

  const { data: item, error: itemError } = await adminClient
    .from("order_items")
    .select("format")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (itemError || !item) {
    throw new ApiError(409, "invalid_state", "Order item is missing");
  }

  return {
    orderId: String(order.id),
    userId: String(order.user_id),
    orderStatus: String(order.status),
    currency: String(order.currency),
    isPrintOrder: String(item.format) === "print",
  };
}

function canGenerateFromStatus(status: string): boolean {
  return [
    "paid",
    "generating",
    "ready_digital",
    "print_queued",
    "failed",
  ].includes(status);
}

export async function assertOrderCanGenerate(
  adminClient: SupabaseClient,
  orderId: string,
  userId: string,
  isAdmin = false,
) {
  const context = await loadOrderGenerationContext(adminClient, orderId);

  if (!isAdmin && context.userId !== userId) {
    throw new ApiError(404, "not_found", "Order not found");
  }

  if (!canGenerateFromStatus(context.orderStatus)) {
    throw new ApiError(409, "invalid_state", "Order is not ready for generation");
  }

  return context;
}

async function createGenerationJob(adminClient: SupabaseClient, orderId: string, triggerSource: GenerationTrigger) {
  const { data: job, error: jobError } = await adminClient
    .from("generation_jobs")
    .insert({
      order_id: orderId,
      status: "processing",
      trigger_source: triggerSource,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message ?? "Failed to create generation job");
  }

  return String(job.id);
}

async function updateOrderStatusWithEvent(
  adminClient: SupabaseClient,
  params: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    eventType: string;
    note?: string;
    payload?: Record<string, unknown>;
  },
) {
  if (params.fromStatus !== params.toStatus) {
    const { error: orderUpdateError } = await adminClient
      .from("orders")
      .update({ status: params.toStatus })
      .eq("id", params.orderId);

    if (orderUpdateError) {
      throw new Error(orderUpdateError.message);
    }
  }

  await insertOrderEvent(adminClient, {
    orderId: params.orderId,
    eventType: params.eventType,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    note: params.note ?? null,
    payload: params.payload ?? {},
  });
}

function getDigitalUrls(orderId: string) {
  return {
    viewerUrl: `/cuento/${orderId}/leer`,
    pdfUrl: `/api/orders/${orderId}/digital-pdf`,
    thumbnailUrl: `/stories/space-1.jpg`,
  };
}

export async function processOrderGeneration(
  adminClient: SupabaseClient,
  params: {
    orderId: string;
    triggerSource: GenerationTrigger;
  },
) {
  const context = await loadOrderGenerationContext(adminClient, params.orderId);
  let jobId: string | null = null;
  let generationStarted = false;

  try {
    if (!canGenerateFromStatus(context.orderStatus)) {
      throw new ApiError(409, "invalid_state", "Order is not ready for generation");
    }

    jobId = await createGenerationJob(adminClient, context.orderId, params.triggerSource);

    await updateOrderStatusWithEvent(adminClient, {
      orderId: context.orderId,
      fromStatus: context.orderStatus,
      toStatus: "generating",
      eventType: "generation_started",
      payload: {
        trigger_source: params.triggerSource,
        generation_job_id: jobId,
      },
    });
    generationStarted = true;

    const urls = getDigitalUrls(context.orderId);

    const [{ data: orderItem }, { data: personalization }] = await Promise.all([
      adminClient
        .from("order_items")
        .select("story_id")
        .eq("order_id", context.orderId)
        .limit(1)
        .maybeSingle(),
      adminClient
        .from("personalizations")
        .select("child_profile,personalization_payload")
        .eq("order_id", context.orderId)
        .maybeSingle(),
    ]);

    const { data: story } = orderItem
      ? await adminClient.from("stories").select("title").eq("id", String(orderItem.story_id)).maybeSingle()
      : { data: null };

    const childProfile = personalization?.child_profile as Record<string, unknown> | null;
    const payload = personalization?.personalization_payload as Record<string, unknown> | null;
    const storyResult = await generateStoryPages({
      childName: String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero"),
      storyTitle: String(story?.title ?? "Historia personalizada"),
      readingLevel: typeof payload?.reading_level === "string" ? payload.reading_level : null,
      familyMembers: Array.isArray(payload?.family_members) ? (payload?.family_members as Array<{ name?: string }>) : [],
    });

    const firstPage = storyResult.pages[0];
    const imagePrompt = [
      "Ilustración infantil premium para cuento personalizado.",
      `Título: ${String(story?.title ?? "Historia personalizada")}.`,
      `Protagonista: ${String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero")}.`,
      firstPage ? `Escena: ${firstPage.text}` : "",
      "Sin texto sobre la imagen.",
    ]
      .filter(Boolean)
      .join(" ");

    const generatedImage = await generateImageWithGemini({ prompt: imagePrompt });
    const pageImageUrl = generatedImage.imageDataUrl ?? urls.thumbnailUrl;

    const { error: pagesError } = await adminClient.from("generated_pages").upsert(
      storyResult.pages.map((page) => ({
        order_id: context.orderId,
        page_number: page.pageNumber,
        image_url: pageImageUrl,
        prompt_used: serializePagePayload(page),
      })),
      { onConflict: "order_id,page_number" },
    );

    if (pagesError) {
      throw new Error(pagesError.message);
    }

    const assetsToUpsert = [
      { order_id: context.orderId, asset_type: "pdf", url: urls.pdfUrl, status: "available" },
      { order_id: context.orderId, asset_type: "viewer", url: urls.viewerUrl, status: "available" },
      { order_id: context.orderId, asset_type: "thumbnail", url: pageImageUrl, status: "available" },
    ];

    const { error: assetError } = await adminClient.from("digital_assets").upsert(assetsToUpsert, {
      onConflict: "order_id,asset_type",
    });

    if (assetError) {
      throw new Error(assetError.message);
    }

    if (context.isPrintOrder) {
      await adminClient.from("print_jobs").upsert(
        {
          order_id: context.orderId,
          status: "queued",
        },
        { onConflict: "order_id" },
      );
    }

    const finalStatus = context.isPrintOrder ? "print_queued" : "ready_digital";
    await updateOrderStatusWithEvent(adminClient, {
      orderId: context.orderId,
      fromStatus: "generating",
      toStatus: finalStatus,
      eventType: "digital_ready",
      note: "Digital asset is available",
      payload: {
        generation_job_id: jobId,
        viewer_url: urls.viewerUrl,
        pdf_url: urls.pdfUrl,
        story_provider: storyResult.provider,
        image_provider: generatedImage.provider,
        image_model: generatedImage.model,
      },
    });

    const { error: jobCompleteError } = await adminClient
      .from("generation_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobCompleteError) {
      throw new Error(jobCompleteError.message);
    }

    return {
      order_id: context.orderId,
      status: finalStatus,
      generation_job_id: jobId,
      digital_assets: {
        viewer_url: urls.viewerUrl,
        pdf_url: urls.pdfUrl,
        thumbnail_url: pageImageUrl,
      },
    };
  } catch (error) {
    if (jobId) {
      await adminClient
        .from("generation_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Generation failed",
        })
        .eq("id", jobId);
    }

    await adminClient.from("digital_assets").upsert(
      {
        order_id: context.orderId,
        asset_type: "pdf",
        status: "failed",
        url: null,
      },
      { onConflict: "order_id,asset_type" },
    );

    if (generationStarted) {
      await updateOrderStatusWithEvent(adminClient, {
        orderId: context.orderId,
        fromStatus: "generating",
        toStatus: "failed",
        eventType: "generation_failed",
        note: error instanceof Error ? error.message : "Generation failed",
        payload: {
          generation_job_id: jobId,
        },
      });
    }

    throw error;
  }
}
