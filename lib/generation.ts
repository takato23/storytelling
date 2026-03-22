import type { SupabaseClient } from "@supabase/supabase-js";
import { generateStoryPages } from "@/lib/story-generator";
import { serializePagePayload } from "@/lib/generated-pages";
import { getImageDataUrlMetadata, isLikelyBlankImage } from "@/lib/image-data-url";
import { generateImageWithGemini } from "@/lib/image-generator";
import { getPrintProduct } from "@/lib/print-products";
import type { PrintOptions } from "@/lib/types";
import { ApiError } from "@/lib/auth";
import { insertOrderEvent } from "@/lib/orders";

type GenerationTrigger = "stripe_webhook" | "manual_retry" | "manual_start" | "system";

interface OrderGenerationContext {
  orderId: string;
  userId: string;
  orderStatus: string;
  currency: string;
  isPrintOrder: boolean;
  printOptions: PrintOptions;
}

interface GeneratedPageRecord {
  order_id: string;
  page_number: number;
  page_type: "cover" | "story_page" | "ending";
  render_purpose: "print_page";
  image_url: string | null;
  prompt_used: string;
  width_px: number | null;
  height_px: number | null;
  status: "ready" | "failed";
  version: number;
  error_message: string | null;
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
    .select("format,print_options_snapshot")
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
    printOptions: ((item.print_options_snapshot ?? {}) as PrintOptions),
  };
}

function canGenerateFromStatus(status: string): boolean {
  return [
    "paid",
    "generating",
    "qa_pending",
    "qa_failed",
    "ready_digital",
    "ready_print_assets",
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

function getAssetUrls(orderId: string) {
  return {
    viewerUrl: `/cuento/${orderId}/leer`,
    digitalPdfUrl: `/api/orders/${orderId}/digital-pdf`,
    printPdfUrl: `/api/orders/${orderId}/print-pdf`,
    printZipUrl: `/api/orders/${orderId}/print-zip`,
  };
}

function getPageType(pageNumber: number, totalPages: number): "cover" | "story_page" | "ending" {
  if (pageNumber === 1) return "cover";
  if (pageNumber === totalPages) return "ending";
  return "story_page";
}

function buildPagePrompt(params: {
  storyTitle: string;
  childName: string;
  pageTitle: string;
  pageText: string;
  pageNumber: number;
  totalPages: number;
  isPrintOrder: boolean;
}) {
  return [
    "Ilustración infantil premium para cuento personalizado.",
    "Sin texto, sin letras, sin tipografía incrustada.",
    "Composición editorial horizontal, personaje claro y expresivo.",
    params.isPrintOrder ? "Pensada para impresión en fotolibro horizontal." : "Pensada para lectura digital de alta calidad.",
    `Título del cuento: ${params.storyTitle}.`,
    `Protagonista: ${params.childName}.`,
    `Página ${params.pageNumber} de ${params.totalPages}.`,
    `Título de la escena: ${params.pageTitle}.`,
    `Escena: ${params.pageText}.`,
  ].join(" ");
}

function validateGeneratedPageImage(dataUrl: string, isPrintOrder: boolean, printOptions: PrintOptions) {
  const metadata = getImageDataUrlMetadata(dataUrl);
  const product = getPrintProduct(printOptions.productId);
  const issues: string[] = [];

  if (metadata.width === null || metadata.height === null) {
    issues.push("No se pudieron leer dimensiones de la imagen generada.");
  } else {
    if (metadata.width < metadata.height) {
      issues.push("La imagen quedó en orientación vertical y requiere revisión manual.");
    }

    if (isPrintOrder) {
      if (metadata.width < product.recommendedResolution.width || metadata.height < product.recommendedResolution.height) {
        issues.push("La resolución quedó por debajo de la recomendada para imprenta.");
      }
    }
  }

  if (isLikelyBlankImage(dataUrl)) {
    issues.push("La imagen generada parece demasiado liviana o vacía.");
  }

  return {
    width: metadata.width,
    height: metadata.height,
    errorMessage: issues.length > 0 ? issues.join(" ") : null,
    hardFailure: issues.some((issue) => issue.includes("orientación vertical") || issue.includes("vacía")),
  };
}

async function generateSinglePage(
  context: OrderGenerationContext,
  storyTitle: string,
  childName: string,
  page: Awaited<ReturnType<typeof generateStoryPages>>["pages"][number],
  totalPages: number,
  version = 1,
  overridePrompt?: string,
): Promise<GeneratedPageRecord> {
  const prompt =
    overridePrompt?.trim() ||
    buildPagePrompt({
      storyTitle,
      childName,
      pageTitle: page.title,
      pageText: page.text,
      pageNumber: page.pageNumber,
      totalPages,
      isPrintOrder: context.isPrintOrder,
    });

  const generatedImage = await generateImageWithGemini({ prompt });
  if (!generatedImage.imageDataUrl) {
    return {
      order_id: context.orderId,
      page_number: page.pageNumber,
      page_type: getPageType(page.pageNumber, totalPages),
      render_purpose: "print_page",
      image_url: null,
      prompt_used: serializePagePayload(page),
      width_px: null,
      height_px: null,
      status: "failed",
      version,
      error_message: "No se pudo generar la ilustración de la página.",
    };
  }

  const quality = validateGeneratedPageImage(generatedImage.imageDataUrl, context.isPrintOrder, context.printOptions);

  return {
    order_id: context.orderId,
    page_number: page.pageNumber,
    page_type: getPageType(page.pageNumber, totalPages),
    render_purpose: "print_page",
    image_url: generatedImage.imageDataUrl,
    prompt_used: serializePagePayload(page),
    width_px: quality.width,
    height_px: quality.height,
    status: quality.hardFailure ? "failed" : "ready",
    version,
    error_message: quality.errorMessage,
  };
}

async function generatePagesForOrder(
  context: OrderGenerationContext,
  adminClient: SupabaseClient,
  storyTitle: string,
  childName: string,
  storyPages: Awaited<ReturnType<typeof generateStoryPages>>["pages"],
) {
  const generatedPages: GeneratedPageRecord[] = [];
  const failures: Array<{ pageNumber: number; reason: string }> = [];

  for (const page of storyPages) {
    const generatedPage = await generateSinglePage(context, storyTitle, childName, page, storyPages.length);
    generatedPages.push(generatedPage);
    if (generatedPage.status === "failed") {
      failures.push({ pageNumber: page.pageNumber, reason: generatedPage.error_message ?? "generation_failed" });
    }
  }

  const { error: pagesError } = await adminClient.from("generated_pages").upsert(generatedPages, {
    onConflict: "order_id,page_number",
  });

  if (pagesError) {
    throw new Error(pagesError.message);
  }

  if (failures.length > 0) {
    throw new Error(`Failed to generate ${failures.length} page(s)`);
  }

  return generatedPages;
}

export async function retryGeneratedOrderPage(
  adminClient: SupabaseClient,
  params: {
    orderId: string;
    pageNumber: number;
    overridePrompt?: string;
  },
) {
  const context = await loadOrderGenerationContext(adminClient, params.orderId);
  const [{ data: orderItem }, { data: personalization }, { data: currentPage }] = await Promise.all([
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
    adminClient
      .from("generated_pages")
      .select("version")
      .eq("order_id", context.orderId)
      .eq("page_number", params.pageNumber)
      .maybeSingle(),
  ]);

  const { data: story } = orderItem
    ? await adminClient.from("stories").select("title").eq("id", String(orderItem.story_id)).maybeSingle()
    : { data: null };

  const childProfile = personalization?.child_profile as Record<string, unknown> | null;
  const payload = personalization?.personalization_payload as Record<string, unknown> | null;
  const childName = String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero");
  const storyTitle = String(story?.title ?? "Historia personalizada");
  const storyResult = await generateStoryPages({
    childName,
    storyTitle,
    readingLevel: typeof payload?.reading_level === "string" ? payload.reading_level : null,
    familyMembers: Array.isArray(payload?.family_members) ? (payload.family_members as Array<{ name?: string }>) : [],
  });

  const page = storyResult.pages.find((entry) => entry.pageNumber === params.pageNumber);
  if (!page) {
    throw new ApiError(404, "not_found", "Page not found for regeneration");
  }

  const nextVersion = currentPage?.version ? Number(currentPage.version) + 1 : 1;
  const regenerated = await generateSinglePage(
    context,
    storyTitle,
    childName,
    page,
    storyResult.pages.length,
    nextVersion,
    params.overridePrompt,
  );

  const { error } = await adminClient.from("generated_pages").upsert(regenerated, {
    onConflict: "order_id,page_number",
  });

  if (error) {
    throw new Error(error.message);
  }

  await insertOrderEvent(adminClient, {
    orderId: context.orderId,
    eventType: "page_regenerated",
    fromStatus: context.orderStatus,
    toStatus: context.orderStatus,
    payload: {
      page_number: params.pageNumber,
      version: regenerated.version,
      status: regenerated.status,
      override_prompt: params.overridePrompt ?? null,
    },
  });

  return regenerated;
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

    const urls = getAssetUrls(context.orderId);

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
    const childName = String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero");
    const storyTitle = String(story?.title ?? "Historia personalizada");

    const storyResult = await generateStoryPages({
      childName,
      storyTitle,
      readingLevel: typeof payload?.reading_level === "string" ? payload.reading_level : null,
      familyMembers: Array.isArray(payload?.family_members) ? (payload.family_members as Array<{ name?: string }>) : [],
    });

    const pageRecords = await generatePagesForOrder(context, adminClient, storyTitle, childName, storyResult.pages);
    const thumbnailUrl = pageRecords.find((page) => page.image_url)?.image_url ?? null;

    const assetRows = [
      { order_id: context.orderId, asset_type: "digital_pdf", url: urls.digitalPdfUrl, status: "available" },
      { order_id: context.orderId, asset_type: "viewer", url: urls.viewerUrl, status: "available" },
      { order_id: context.orderId, asset_type: "thumbnail", url: thumbnailUrl, status: "available" },
    ];

    if (context.isPrintOrder) {
      assetRows.push(
        { order_id: context.orderId, asset_type: "print_pdf", url: urls.printPdfUrl, status: "available" },
        { order_id: context.orderId, asset_type: "print_zip", url: urls.printZipUrl, status: "available" },
      );
    }

    const { error: assetError } = await adminClient.from("digital_assets").upsert(assetRows, {
      onConflict: "order_id,asset_type",
    });

    if (assetError) {
      throw new Error(assetError.message);
    }

    let finalStatus = "ready_digital";
    let finalEventType = "digital_ready";
    let finalNote = "Digital asset is available";

    if (context.isPrintOrder) {
      const { error: printJobError } = await adminClient.from("print_jobs").upsert(
        {
          order_id: context.orderId,
          status: "review_required",
        },
        { onConflict: "order_id" },
      );

      if (printJobError) {
        throw new Error(printJobError.message);
      }

      finalStatus = "qa_pending";
      finalEventType = "print_assets_ready";
      finalNote = "Print assets generated and pending review";
    }

    await updateOrderStatusWithEvent(adminClient, {
      orderId: context.orderId,
      fromStatus: "generating",
      toStatus: finalStatus,
      eventType: finalEventType,
      note: finalNote,
      payload: {
        generation_job_id: jobId,
        viewer_url: urls.viewerUrl,
        digital_pdf_url: urls.digitalPdfUrl,
        print_pdf_url: context.isPrintOrder ? urls.printPdfUrl : null,
        print_zip_url: context.isPrintOrder ? urls.printZipUrl : null,
        story_provider: storyResult.provider,
        pages_generated: pageRecords.length,
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
        pdf_url: urls.digitalPdfUrl,
        thumbnail_url: thumbnailUrl,
        print_pdf_url: context.isPrintOrder ? urls.printPdfUrl : null,
        print_zip_url: context.isPrintOrder ? urls.printZipUrl : null,
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
      [
        {
          order_id: context.orderId,
          asset_type: "digital_pdf",
          status: "failed",
          url: null,
        },
        {
          order_id: context.orderId,
          asset_type: "print_pdf",
          status: "failed",
          url: null,
        },
      ],
      { onConflict: "order_id,asset_type" },
    );

    if (generationStarted) {
      const failedStatus = context.isPrintOrder ? "qa_failed" : "failed";
      await updateOrderStatusWithEvent(adminClient, {
        orderId: context.orderId,
        fromStatus: "generating",
        toStatus: failedStatus,
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
