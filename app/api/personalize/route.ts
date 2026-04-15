import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRouteError } from '@/lib/api';
import {
  createValentinDinoPreviewSession,
  getValentinDinoPreviewSessionState,
  processValentinDinoPreviewSessionStep,
  type PreviewSessionState,
} from '@/lib/dino-story-pipeline';
import {
  getValentinDinoPersonalizedTitle,
  VALENTIN_DINO_BOOK,
  VALENTIN_DINO_STORY_ID,
} from '@/lib/books/valentin-dino-package';
import { analyzeChildPhotoWithGemini } from '@/lib/image-generator';
import { getRequestId, logEvent, setRequestIdHeader } from '@/lib/observability';
import { enforceRateLimit } from '@/lib/rate-limit';
import { recordChildPhotoConsent } from '@/lib/privacy/consent';
import { createSupabaseAdminClient } from '@/lib/supabase';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const AnalyzePayloadSchema = z.object({
  action: z.literal('analyze'),
  imageBase64: z.string().min(50),
});

const ConsentSchema = z.object({
  accepted: z.literal(true),
  version: z.string().min(1).max(32),
  text: z.string().min(10).max(2000),
});

const GeneratePreviewPayloadSchema = z.object({
  action: z.literal('generate'),
  bookId: z.string().min(1),
  childName: z.string().min(2).max(50).regex(/^[\p{L}\p{M}\p{N}\s''-]+$/u).optional(),
  childFeatures: z.object({
    hairColor: z.string().max(50).optional(),
    hairType: z.string().max(50).optional(),
    skinTone: z.string().max(50).optional(),
    eyeColor: z.string().max(50).optional(),
    approximateAge: z.number().int().min(1).max(18).optional(),
    gender: z.enum(["niño", "niña", "neutral"]).optional(),
    distinctiveFeatures: z.string().max(200).nullable().optional(),
    faceShape: z.string().max(50).optional(),
  }).optional(),
  imageBase64: z.string().min(50),
  model: z.string().min(1).optional(),
  // Required by privacy policy: the uploader must explicitly accept the
  // consent text before the reference photo is processed. See
  // components/privacy/ChildPhotoConsent.tsx and docs/privacy/POLICY.md.
  consent: ConsentSchema,
});

const PreviewSessionQuerySchema = z.object({
  previewSessionId: z.string().uuid(),
});

const PersonalizePayloadSchema = z.union([AnalyzePayloadSchema, GeneratePreviewPayloadSchema]);

export const runtime = 'nodejs';

function stripDataUrlPrefix(base64: string) {
  return base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
}

function estimateBytesFromBase64(base64: string) {
  const clean = stripDataUrlPrefix(base64);
  return Math.ceil((clean.length * 3) / 4);
}

function buildFallbackFeatures() {
  return {
    hairColor: 'castaño',
    hairType: 'ondulado',
    skinTone: 'medio',
    eyeColor: 'marrón',
    approximateAge: 6,
    gender: 'niño',
    distinctiveFeatures: null,
    faceShape: 'ovalado',
  };
}

function buildPreviewPayload(state: PreviewSessionState) {
  const pages = state.pages.slice().sort((left, right) => left.pageNumber - right.pageNumber);
  const cover = pages.find((page) => page.pageType === 'cover') ?? pages[0] ?? null;
  const previewBundle = state.previewBundle ?? null;

  return {
    success: true,
    status: state.status,
    previewSessionId: state.previewSessionId,
    progress: {
      completedPages: state.completedPages,
      totalPages: state.totalPages,
    },
    cover,
    scenes: cover ? pages.filter((page) => page.sceneId !== cover.sceneId) : pages,
    pages,
    imageUrl: cover?.imageUrl ?? pages[0]?.imageUrl ?? null,
    sceneText: cover?.text ?? '',
    generation_mode: 'preview_dino_session',
    image_provider: previewBundle?.provider ?? null,
    image_model: previewBundle?.model ?? null,
    preview_bundle: previewBundle,
    errorMessage: state.errorMessage,
    story: {
      id: VALENTIN_DINO_BOOK.id,
      slug: VALENTIN_DINO_BOOK.slug,
      title: previewBundle?.childName ? getValentinDinoPersonalizedTitle(previewBundle.childName) : VALENTIN_DINO_BOOK.title,
    },
  };
}

async function hydratePreviewState(
  previewSessionId: string,
  options: { ensureRenderable?: boolean; advanceOnce?: boolean } = {},
) {
  const adminClient = createSupabaseAdminClient();
  let state = await getValentinDinoPreviewSessionState(adminClient, previewSessionId);

  if (options.ensureRenderable) {
    while ((state.status === 'queued' || state.status === 'processing') && state.pages.length === 0) {
      state = await processValentinDinoPreviewSessionStep(adminClient, previewSessionId);
    }
    return state;
  }

  if (options.advanceOnce && (state.status === 'queued' || state.status === 'processing')) {
    state = await processValentinDinoPreviewSessionStep(adminClient, previewSessionId);
  }

  return state;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const route = '/api/personalize';

  try {
    const limited = enforceRateLimit(request, { key: route, limit: 8, windowMs: 60_000 });
    if (limited) {
      return setRequestIdHeader(limited, requestId);
    }

    const payload = PersonalizePayloadSchema.parse(await request.json());
    const estimatedBytes = estimateBytesFromBase64(payload.imageBase64);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      const response = NextResponse.json(
        {
          error: 'payload_too_large',
          message: 'La imagen excede el límite de 5MB',
        },
        { status: 413 },
      );
      return setRequestIdHeader(response, requestId);
    }

    if (payload.action === 'analyze') {
      const analyzed = await analyzeChildPhotoWithGemini(payload.imageBase64);
      const response = NextResponse.json({
        success: true,
        features: {
          ...buildFallbackFeatures(),
          ...analyzed.features,
        },
        analysis_mode: analyzed.provider === 'gemini' ? 'gemini' : 'safe_fallback',
        analysis_model: analyzed.model,
      });
      return setRequestIdHeader(response, requestId);
    }

    if (payload.bookId !== VALENTIN_DINO_STORY_ID) {
      const response = NextResponse.json(
        {
          error: 'unsupported_story',
          message: 'La personalización activa está disponible solo para Valentín y la noche de los dinosaurios.',
        },
        { status: 400 },
      );
      return setRequestIdHeader(response, requestId);
    }

    const childName = payload.childName?.trim() || 'Valentín';
    const childFeatures = payload.childFeatures ?? buildFallbackFeatures();
    const adminClient = createSupabaseAdminClient();
    const session = await createValentinDinoPreviewSession({
      adminClient,
      childName,
      childFeatures,
      childPhotoDataUrl: payload.imageBase64,
    });

    // Best-effort consent persistence (see lib/privacy/consent.ts). We
    // already enforced the payload schema above, so reaching this point
    // means the uploader explicitly accepted the current consent version.
    await recordChildPhotoConsent({
      adminClient,
      previewSessionId: session.previewSessionId,
      childName,
      consent: payload.consent,
      request,
      photo: null,
    });

    const previewState = session;
    const response = NextResponse.json(buildPreviewPayload(previewState));

    logEvent('info', 'preview_generated', { request_id: requestId, route }, {
      book_id: payload.bookId,
      image_provider: previewState.previewBundle?.provider ?? 'fallback',
      image_model: previewState.previewBundle?.model ?? 'unavailable',
      preview_session_id: previewState.previewSessionId,
      preview_status: previewState.status,
      ready_pages: previewState.completedPages,
      total_pages: previewState.totalPages,
    });

    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent('error', 'preview_generation.failed', { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const route = '/api/personalize';

  try {
    const query = PreviewSessionQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const previewState = await hydratePreviewState(query.previewSessionId, { advanceOnce: true });
    const response = NextResponse.json(buildPreviewPayload(previewState));

    logEvent('info', 'preview_polled', { request_id: requestId, route }, {
      preview_session_id: previewState.previewSessionId,
      preview_status: previewState.status,
      ready_pages: previewState.completedPages,
      total_pages: previewState.totalPages,
    });

    return setRequestIdHeader(response, requestId);
  } catch (error) {
    logEvent('error', 'preview_poll.failed', { request_id: requestId, route }, {
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
    const response = handleRouteError(error);
    return setRequestIdHeader(response, requestId);
  }
}
