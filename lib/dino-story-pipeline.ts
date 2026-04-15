import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readPublicAssetAsDataUrl } from '@/lib/book-assets';
import {
  getValentinDinoPreviewScenes,
  getValentinDinoPersonalizedTitle,
  getValentinDinoSceneText,
  isValentinDinoStoryId,
  type BookSceneDefinition,
  VALENTIN_DINO_BOOK,
} from '@/lib/books/valentin-dino-package';
import {
  composeDinoBackCoverPage,
  composeDinoCoverPage,
  composeDinoSpreadPages,
  DINO_PRINT_PAGE_SIZE,
} from '@/lib/dino-book-compose';
import { serializePagePayload } from '@/lib/generated-pages';
import { generateImageWithGemini } from '@/lib/image-generator';
import { getImageDataUrlMetadata, isLikelyBlankImage } from '@/lib/image-data-url';
import { generateDirectGeminiCoverPreview } from '@/lib/gemini-cover';
import { composePersonalizedCoverPreview, composePersonalizedScenePreview } from '@/lib/cover-compose';
import {
  buildStorageObjectPath,
  createSignedStorageUrl,
  downloadStorageObjectAsDataUrl,
  downloadJsonFromStorage,
  ensureStoryStorage,
  parseStorageUri,
  PRIVATE_REFERENCE_BUCKET,
  PRIVATE_RENDER_BUCKET,
  uploadBinaryToStorage,
  uploadDataUrlToStorage,
  uploadJsonToStorage,
  type StoredObjectRef,
} from '@/lib/storage';

export interface StoredStoryScene {
  sceneId: BookSceneDefinition['id'];
  pageNumber: number;
  pageType: 'cover' | 'story_page' | 'ending';
  title: string;
  text: string;
  summary: string;
  prompt: string;
  imageUrl: string;
  storage: {
    bucket: string;
    path: string;
  };
}

export interface DinoPreviewBundle {
  previewSessionId: string;
  storyId: string;
  storySlug: string;
  storyTitle: string;
  childName: string;
  referencePhoto: {
    bucket: string;
    path: string;
  };
  cover: StoredStoryScene;
  scenes: StoredStoryScene[];
  /** Canonical provider name from the image router (e.g. gemini, flux-kontext-max, seedream) or "fallback". */
  provider: string;
  model: string;
  generatedAt: string;
}

type PreviewSceneStatus = 'pending' | 'ready' | 'failed';
type PreviewSessionStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface PreviewSessionManifestScene {
  sceneId: BookSceneDefinition['id'];
  status: PreviewSceneStatus;
  storage?: {
    bucket: string;
    path: string;
  };
  errorMessage?: string | null;
}

interface PreviewSessionManifest {
  previewSessionId: string;
  storyId: string;
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  referencePhoto: {
    bucket: string;
    path: string;
  };
  status: PreviewSessionStatus;
  /** Canonical provider name from the image router, or "fallback". */
  provider: string;
  model: string;
  disableAiGeneration?: boolean;
  generatedAt: string;
  scenes: PreviewSessionManifestScene[];
}

export interface PreviewSessionState {
  status: PreviewSessionStatus;
  previewSessionId: string;
  completedPages: number;
  totalPages: number;
  pages: StoredStoryScene[];
  previewBundle: DinoPreviewBundle | null;
  errorMessage: string | null;
}

interface GeneratePreviewBundleInput {
  adminClient: SupabaseClient;
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  childPhotoDataUrl: string;
}

interface GenerateOrderPagesInput {
  adminClient: SupabaseClient;
  orderId: string;
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  previewBundle: DinoPreviewBundle | null;
  version?: number;
}

interface GeneratedOrderPage {
  order_id: string;
  page_number: number;
  page_type: 'cover' | 'story_page' | 'ending' | 'back_cover';
  render_purpose: 'print_page';
  image_url: string | null;
  prompt_used: string;
  width_px: number | null;
  height_px: number | null;
  status: 'ready' | 'failed';
  version: number;
  error_message: string | null;
}

function extFromMime(mimeType: string) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function sanitizePromptContext(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function isPermanentImageProviderFailure(message: string | null | undefined) {
  if (!message) return false;
  return (
    /exceeded your current quota/i.test(message) ||
    /quota exceeded/i.test(message) ||
    /limit:\s*0/i.test(message) ||
    /free_tier/i.test(message)
  );
}

function buildScenePrompt(scene: BookSceneDefinition, childName: string, childFeatures?: Record<string, unknown> | null) {
  const featureLines: string[] = [];
  if (childFeatures) {
    if (typeof childFeatures.hairColor === 'string') featureLines.push(`${childFeatures.hairColor} hair`);
    if (typeof childFeatures.hairType === 'string') featureLines.push(`${childFeatures.hairType} hair style`);
    if (typeof childFeatures.skinTone === 'string') featureLines.push(`${childFeatures.skinTone} skin`);
    if (typeof childFeatures.eyeColor === 'string') featureLines.push(`${childFeatures.eyeColor} eyes`);
  }
  const appearance = featureLines.length > 0
    ? `Key features to preserve: ${featureLines.join(', ')}.`
    : '';

  return [
    'Transform the child in Image 1 into the exact same 3D animated art style as Image 2.',
    'Keep the face structure, hair color, hair style, and skin tone from Image 1 recognizably the same.',
    appearance,
    `Place this transformed child into the same scene as Image 2. The child's name is ${childName}.`,
    'Keep the dinosaur, background, lighting, and composition identical to Image 2.',
    'Do NOT add text, labels, or watermarks.',
  ].filter(Boolean).join(' ');
}

function getSceneRenderConfig(
  scene: BookSceneDefinition,
  profile: 'preview' | 'print',
) {
  if (scene.assetKind === 'cover') {
    return {
      aspectRatio: '1:1',
      imageSize: profile === 'print' ? ('4K' as const) : ('1K' as const),
    };
  }

  return {
    aspectRatio: '16:9',
    imageSize: profile === 'print' ? ('4K' as const) : ('1K' as const),
  };
}

function getPreviewSessionManifestPath(previewSessionId: string) {
  return `preview-sessions/${previewSessionId}/manifest.json`;
}

function createInitialPreviewSessionManifest(input: {
  previewSessionId: string;
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  referencePhoto: {
    bucket: string;
    path: string;
  };
}): PreviewSessionManifest {
  return {
    previewSessionId: input.previewSessionId,
    storyId: VALENTIN_DINO_BOOK.id,
    childName: input.childName,
    childFeatures: input.childFeatures ?? null,
    referencePhoto: input.referencePhoto,
    status: 'queued',
    provider: 'fallback',
    model: 'unavailable',
    disableAiGeneration: false,
    generatedAt: new Date().toISOString(),
    scenes: getValentinDinoPreviewScenes().map((scene) => ({
      sceneId: scene.id,
      status: 'pending',
      errorMessage: null,
    })),
  };
}

async function savePreviewSessionManifest(adminClient: SupabaseClient, manifest: PreviewSessionManifest) {
  await uploadJsonToStorage(adminClient, {
    bucket: PRIVATE_RENDER_BUCKET,
    objectPath: getPreviewSessionManifestPath(manifest.previewSessionId),
    value: manifest,
    cacheControl: '60',
    upsert: true,
  });
}

async function loadPreviewSessionManifest(adminClient: SupabaseClient, previewSessionId: string) {
  return downloadJsonFromStorage<PreviewSessionManifest>(adminClient, {
    bucket: PRIVATE_RENDER_BUCKET,
    objectPath: getPreviewSessionManifestPath(previewSessionId),
  });
}

function getSceneDefinition(sceneId: BookSceneDefinition['id']) {
  const scene = getValentinDinoPreviewScenes().find((entry) => entry.id === sceneId);
  if (!scene) {
    throw new Error(`Unknown preview scene ${sceneId}`);
  }
  return scene;
}

async function buildPreviewSessionBundleFromManifest(
  adminClient: SupabaseClient,
  manifest: PreviewSessionManifest,
): Promise<DinoPreviewBundle | null> {
  const storedScenes: StoredStoryScene[] = [];
  for (const sceneState of manifest.scenes) {
    if (sceneState.status !== 'ready' || !sceneState.storage) continue;
    const scene = getSceneDefinition(sceneState.sceneId);
    const signedUrl = await createSignedStorageUrl(adminClient, {
      bucket: sceneState.storage.bucket,
      objectPath: sceneState.storage.path,
      expiresIn: 60 * 60,
    });
    storedScenes.push(
      buildStoredScene(
        scene,
        manifest.childName,
        {
          bucket: sceneState.storage.bucket,
          path: sceneState.storage.path,
          storageUri: `storage://${sceneState.storage.bucket}/${sceneState.storage.path}`,
        },
        signedUrl,
      ),
    );
  }

  const cover = storedScenes.find((scene) => scene.sceneId === 'cover') ?? storedScenes[0];
  if (!cover) return null;

  return {
    previewSessionId: manifest.previewSessionId,
    storyId: manifest.storyId,
    storySlug: VALENTIN_DINO_BOOK.slug,
    storyTitle: getValentinDinoPersonalizedTitle(manifest.childName),
    childName: manifest.childName,
    referencePhoto: manifest.referencePhoto,
    cover,
    scenes: storedScenes.filter((scene) => scene.sceneId !== cover.sceneId),
    provider: manifest.provider,
    model: manifest.model,
    generatedAt: manifest.generatedAt,
  };
}

async function buildPreviewSessionStateFromManifest(
  adminClient: SupabaseClient,
  manifest: PreviewSessionManifest,
): Promise<PreviewSessionState> {
  const previewBundle = await buildPreviewSessionBundleFromManifest(adminClient, manifest);
  const pages = previewBundle ? getAllPreviewScenes(previewBundle) : [];
  const failedScene = manifest.scenes.find((scene) => scene.status === 'failed');

  return {
    status: manifest.status,
    previewSessionId: manifest.previewSessionId,
    completedPages: manifest.scenes.filter((scene) => scene.status === 'ready').length,
    totalPages: manifest.scenes.length,
    pages,
    previewBundle,
    errorMessage: failedScene?.errorMessage ?? null,
  };
}

function buildStoredScene(
  scene: BookSceneDefinition,
  childName: string,
  objectRef: StoredObjectRef,
  imageUrl: string,
): StoredStoryScene {
  return {
    sceneId: scene.id,
    pageNumber: scene.pageNumber,
    pageType: scene.pageType,
    title: scene.title,
    text: getValentinDinoSceneText(scene, childName),
    summary: scene.summary,
    prompt: scene.prompt,
    imageUrl,
    storage: {
      bucket: objectRef.bucket,
      path: objectRef.path,
    },
  };
}

async function generateSceneDataUrl(params: {
  childName: string;
  childFeatures?: Record<string, unknown> | null;
  scene: BookSceneDefinition;
  childPhotoDataUrl: string;
  anchorDataUrls: string[];
  extraReferenceDataUrls?: string[];
  allowDeterministicFallback?: boolean;
  skipAiGeneration?: boolean;
  profile?: 'preview' | 'print';
}): Promise<Awaited<ReturnType<typeof generateImageWithGemini>>> {
  const baseScene = await readPublicAssetAsDataUrl(`/stories/valentin-noche-dinosaurios/${params.scene.fileName}`);
  const renderConfig = getSceneRenderConfig(params.scene, params.profile ?? 'preview');

  if (params.skipAiGeneration) {
    if (params.scene.id === 'cover') {
      const composedCover = await composePersonalizedCoverPreview(
        Buffer.from(baseScene.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'),
        params.childPhotoDataUrl,
      );
      return {
        imageDataUrl: composedCover,
        provider: 'fallback',
        model: 'composited-cover-preview',
        errorMessage: 'Skipped Gemini because the preview session is locked to deterministic fallback mode.',
      };
    }

    const composedScene = await composePersonalizedScenePreview(
      Buffer.from(baseScene.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'),
      params.childPhotoDataUrl,
      params.scene.id,
    );

    return {
      imageDataUrl: composedScene,
      provider: 'fallback',
      model: 'composited-scene-preview',
      errorMessage: 'Skipped Gemini because the preview session is locked to deterministic fallback mode.',
    };
  }

  if (params.scene.id === 'cover') {
    const generatedCover = await generateDirectGeminiCoverPreview({
      childPhotoDataUrl: params.childPhotoDataUrl,
      childName: params.childName,
      childFeatures: params.childFeatures,
      aspectRatio: renderConfig.aspectRatio,
      imageSize: renderConfig.imageSize,
    });

    if (generatedCover.imageDataUrl && !isLikelyBlankImage(generatedCover.imageDataUrl)) {
      return generatedCover;
    }

    const composedCover = await composePersonalizedCoverPreview(
      Buffer.from(baseScene.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'),
      params.childPhotoDataUrl,
    );
    return {
      imageDataUrl: composedCover,
      provider: 'fallback',
      model: 'composited-cover-preview',
      errorMessage: generatedCover.errorMessage ?? null,
    };
  }

  const prompt = buildScenePrompt(params.scene, params.childName, params.childFeatures);
  const sceneReferences = (params.extraReferenceDataUrls ?? []).filter(Boolean);
  const prioritizedSceneReference = sceneReferences[0] ?? null;
  const prioritizedAnchorReference = params.anchorDataUrls[0] ?? null;
  const strategies = [
    {
      // Most reliable path for the active Supabase image edge:
      // child reference + approved base scene only.
      prompt,
      references: [params.childPhotoDataUrl, baseScene.dataUrl],
    },
    prioritizedSceneReference
      ? {
          prompt,
          references: [params.childPhotoDataUrl, baseScene.dataUrl, prioritizedSceneReference],
        }
      : null,
    prioritizedAnchorReference
      ? {
          prompt,
          references: [params.childPhotoDataUrl, baseScene.dataUrl, prioritizedAnchorReference],
        }
      : null,
  ].filter(Boolean) as Array<{ prompt: string; references: string[] }>;

  let lastAttempt: Awaited<ReturnType<typeof generateImageWithGemini>> | null = null;

  for (const strategy of strategies) {
    const generated = await generateImageWithGemini({
      prompt: strategy.prompt,
      referenceImageBase64s: strategy.references,
      aspectRatio: renderConfig.aspectRatio,
      imageSize: renderConfig.imageSize,
    });
    lastAttempt = generated;

    if (generated.imageDataUrl && !isLikelyBlankImage(generated.imageDataUrl)) {
      return generated;
    }

    if (isPermanentImageProviderFailure(generated.errorMessage)) {
      break;
    }
  }

  if (params.allowDeterministicFallback) {
    const composedScene = await composePersonalizedScenePreview(
      Buffer.from(baseScene.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'),
      params.childPhotoDataUrl,
      params.scene.id,
    );

    return {
      imageDataUrl: composedScene,
      provider: 'fallback',
      model: 'composited-scene-preview',
      errorMessage: lastAttempt?.errorMessage ?? null,
    };
  }

  return lastAttempt ?? { imageDataUrl: null, provider: 'fallback', model: 'unavailable' };
}

async function uploadSceneToPreviewStorage(
  adminClient: SupabaseClient,
  params: {
    previewSessionId: string;
    scene: BookSceneDefinition;
    dataUrl: string;
  },
) {
  const metadata = getImageDataUrlMetadata(params.dataUrl);
  return uploadDataUrlToStorage(adminClient, {
    bucket: PRIVATE_RENDER_BUCKET,
    objectPath: buildStorageObjectPath(
      `preview-sessions/${params.previewSessionId}/${params.scene.id}`,
      `${params.scene.id}.${extFromMime(metadata.mimeType)}`,
    ),
    dataUrl: params.dataUrl,
    cacheControl: '31536000',
  });
}

async function duplicatePreviewSceneAsCover(
  adminClient: SupabaseClient,
  params: {
    previewSessionId: string;
    sourceSceneState: PreviewSessionManifestScene;
  },
) {
  if (!params.sourceSceneState.storage) {
    throw new Error('Source scene is missing storage reference.');
  }

  const dataUrl = await downloadStorageObjectAsDataUrl(adminClient, {
    bucket: params.sourceSceneState.storage.bucket,
    objectPath: params.sourceSceneState.storage.path,
  });

  return uploadSceneToPreviewStorage(adminClient, {
    previewSessionId: params.previewSessionId,
    scene: getSceneDefinition('cover'),
    dataUrl,
  });
}

export async function createValentinDinoPreviewSession(
  input: GeneratePreviewBundleInput,
): Promise<PreviewSessionState> {
  await ensureStoryStorage(input.adminClient);

  const previewSessionId = crypto.randomUUID();
  const photoMetadata = getImageDataUrlMetadata(input.childPhotoDataUrl);
  const referencePhoto = await uploadBinaryToStorage(input.adminClient, {
    bucket: PRIVATE_REFERENCE_BUCKET,
    objectPath: buildStorageObjectPath(
      `preview-sessions/${previewSessionId}/reference`,
      `child-reference.${extFromMime(photoMetadata.mimeType)}`,
    ),
    bytes: photoMetadata.bytes,
    contentType: photoMetadata.mimeType,
    cacheControl: '31536000',
  });

  const manifest = createInitialPreviewSessionManifest({
    previewSessionId,
    childName: input.childName,
    childFeatures: input.childFeatures,
    referencePhoto: {
      bucket: referencePhoto.bucket,
      path: referencePhoto.path,
    },
  });

  await savePreviewSessionManifest(input.adminClient, manifest);

  return {
    status: manifest.status,
    previewSessionId,
    completedPages: 0,
    totalPages: manifest.scenes.length,
    pages: [],
    previewBundle: null,
    errorMessage: null,
  };
}

export async function getValentinDinoPreviewSessionState(
  adminClient: SupabaseClient,
  previewSessionId: string,
): Promise<PreviewSessionState> {
  const manifest = await loadPreviewSessionManifest(adminClient, previewSessionId);
  return buildPreviewSessionStateFromManifest(adminClient, manifest);
}

export async function processValentinDinoPreviewSessionStep(
  adminClient: SupabaseClient,
  previewSessionId: string,
): Promise<PreviewSessionState> {
  const manifest = await loadPreviewSessionManifest(adminClient, previewSessionId);

  if (manifest.status === 'completed' || manifest.status === 'failed') {
    return getValentinDinoPreviewSessionState(adminClient, previewSessionId);
  }

  const nextSceneState = manifest.scenes.find((scene) => scene.status === 'pending');
  if (!nextSceneState) {
    manifest.status = 'completed';
    await savePreviewSessionManifest(adminClient, manifest);
    return buildPreviewSessionStateFromManifest(adminClient, manifest);
  }

  manifest.status = 'processing';
  await savePreviewSessionManifest(adminClient, manifest);

  const childPhotoDataUrl = await downloadStorageObjectAsDataUrl(adminClient, {
    bucket: manifest.referencePhoto.bucket,
    objectPath: manifest.referencePhoto.path,
  });

  const anchorDataUrls: string[] = [];
  for (const sceneState of manifest.scenes) {
    if (sceneState.status !== 'ready' || !sceneState.storage || anchorDataUrls.length >= 2) continue;
    anchorDataUrls.push(
      await downloadStorageObjectAsDataUrl(adminClient, {
        bucket: sceneState.storage.bucket,
        objectPath: sceneState.storage.path,
      }),
    );
  }

  const scene = getSceneDefinition(nextSceneState.sceneId);
  const generated = await generateSceneDataUrl({
    childName: manifest.childName,
    childFeatures: manifest.childFeatures,
    scene,
    childPhotoDataUrl,
    anchorDataUrls,
    allowDeterministicFallback: true,
    skipAiGeneration: manifest.disableAiGeneration,
    profile: 'preview',
  });

  if (isPermanentImageProviderFailure(generated.errorMessage)) {
    manifest.disableAiGeneration = true;
  }

  if (!generated.imageDataUrl) {
    if (scene.id === 'cover') {
      const firstReadyScene = manifest.scenes.find((entry) => entry.sceneId !== 'cover' && entry.status === 'ready');
      if (firstReadyScene?.storage) {
        const duplicatedCover = await duplicatePreviewSceneAsCover(adminClient, {
          previewSessionId,
          sourceSceneState: firstReadyScene,
        });

        nextSceneState.status = 'ready';
        nextSceneState.storage = {
          bucket: duplicatedCover.bucket,
          path: duplicatedCover.path,
        };
        nextSceneState.errorMessage = 'Cover fallback generated from first successful personalized scene.';
        manifest.status = manifest.scenes.every((sceneState) => sceneState.status === 'ready' || sceneState === nextSceneState)
          ? 'completed'
          : 'processing';
        await savePreviewSessionManifest(adminClient, manifest);
        return buildPreviewSessionStateFromManifest(adminClient, manifest);
      }
    }

    nextSceneState.status = 'failed';
    nextSceneState.errorMessage = generated.errorMessage
      ? `No se pudo generar la escena ${scene.id}. ${generated.errorMessage}`
      : `No se pudo generar la escena ${scene.id}.`;
    manifest.status = 'failed';
    manifest.provider = generated.provider;
    manifest.model = generated.model;
    await savePreviewSessionManifest(adminClient, manifest);
    return buildPreviewSessionStateFromManifest(adminClient, manifest);
  }

  const storedRef = await uploadSceneToPreviewStorage(adminClient, {
    previewSessionId,
    scene,
    dataUrl: generated.imageDataUrl,
  });

  nextSceneState.status = 'ready';
  nextSceneState.storage = {
    bucket: storedRef.bucket,
    path: storedRef.path,
  };
  nextSceneState.errorMessage = null;
  manifest.provider = generated.provider;
  manifest.model = generated.model;

  if (manifest.scenes.every((sceneState) => sceneState.status === 'ready')) {
    manifest.status = 'completed';
  } else {
    manifest.status = 'processing';
  }

  await savePreviewSessionManifest(adminClient, manifest);
  return buildPreviewSessionStateFromManifest(adminClient, manifest);
}

export async function generateValentinDinoPreviewBundle(
  input: GeneratePreviewBundleInput,
): Promise<DinoPreviewBundle> {
  const session = await createValentinDinoPreviewSession(input);
  let state = session;

  while (state.status === 'queued' || state.status === 'processing') {
    state = await processValentinDinoPreviewSessionStep(input.adminClient, session.previewSessionId);
  }

  if (!state.previewBundle) {
    throw new Error(state.errorMessage ?? 'No se pudo generar la preview completa.');
  }

  return state.previewBundle;
}

function toGeneratedOrderPage(
  orderId: string,
  page: {
    pageNumber: number;
    pageType: 'cover' | 'story_page' | 'back_cover';
    title: string;
    text: string;
    layoutVariant: 'cover' | 'image_only' | 'text_on_image' | 'back_cover';
    sourceSceneId?: string | null;
    storyPageRange?: [number, number] | null;
  },
  imageUrl: string,
  dataUrl: string,
  version = 1,
): GeneratedOrderPage {
  const metadata = getImageDataUrlMetadata(dataUrl);
  const hasExpectedPrintDimensions =
    metadata?.width === DINO_PRINT_PAGE_SIZE && metadata?.height === DINO_PRINT_PAGE_SIZE;
  const errorMessage = hasExpectedPrintDimensions
    ? null
    : `La página final no quedó en ${DINO_PRINT_PAGE_SIZE}x${DINO_PRINT_PAGE_SIZE}px para imprenta.`;

  return {
    order_id: orderId,
    page_number: page.pageNumber,
    page_type: page.pageType,
    render_purpose: 'print_page',
    image_url: imageUrl,
    prompt_used: serializePagePayload({
      title: page.title,
      text: page.text,
      layoutVariant: page.layoutVariant,
      sourceSceneId: page.sourceSceneId ?? null,
      storyPageRange: page.storyPageRange ?? null,
    }),
    width_px: metadata?.width ?? null,
    height_px: metadata?.height ?? null,
    status: hasExpectedPrintDimensions ? 'ready' : 'failed',
    version,
    error_message: errorMessage,
  };
}

async function uploadComposedOrderPage(
  adminClient: SupabaseClient,
  params: {
    orderId: string;
    sceneId: string;
    pageNumber: number;
    dataUrl: string;
  },
) {
  const metadata = getImageDataUrlMetadata(params.dataUrl);
  return uploadDataUrlToStorage(adminClient, {
    bucket: PRIVATE_RENDER_BUCKET,
    objectPath: buildStorageObjectPath(
      `orders/${params.orderId}/pages/${params.sceneId}`,
      `page-${String(params.pageNumber).padStart(2, '0')}.${extFromMime(metadata.mimeType)}`,
    ),
    dataUrl: params.dataUrl,
    cacheControl: '31536000',
  });
}

async function loadPreviewSceneDataUrl(
  adminClient: SupabaseClient,
  previewScene: StoredStoryScene | undefined,
) {
  if (!previewScene) return null;
  return downloadStorageObjectAsDataUrl(adminClient, {
    bucket: previewScene.storage.bucket,
    objectPath: previewScene.storage.path,
  });
}

function buildFailedGeneratedOrderPage(
  input: {
    orderId: string;
    pageNumber: number;
    pageType: 'cover' | 'story_page' | 'back_cover';
    sceneId: string;
    title: string;
    text: string;
    layoutVariant: 'cover' | 'image_only' | 'text_on_image' | 'back_cover';
    storyPageRange?: [number, number] | null;
    errorMessage: string;
    version?: number;
  },
): GeneratedOrderPage {
  return {
    order_id: input.orderId,
    page_number: input.pageNumber,
    page_type: input.pageType,
    render_purpose: 'print_page',
    image_url: null,
    prompt_used: serializePagePayload({
      title: input.title,
      text: input.text,
      layoutVariant: input.layoutVariant,
      sourceSceneId: input.sceneId,
      storyPageRange: input.storyPageRange ?? null,
    }),
    width_px: null,
    height_px: null,
    status: 'failed',
    version: input.version ?? 1,
    error_message: input.errorMessage,
  };
}

async function buildComposedPagesForScene(
  input: {
    adminClient: SupabaseClient;
    orderId: string;
    childName: string;
    childFeatures?: Record<string, unknown> | null;
    childPhotoDataUrl: string | null;
    previewSceneMap: Map<BookSceneDefinition['id'], StoredStoryScene>;
    anchorDataUrls: string[];
    scene: BookSceneDefinition;
    version?: number;
  },
): Promise<GeneratedOrderPage[]> {
  const personalizedText = getValentinDinoSceneText(input.scene, input.childName);
  const personalizedTitle =
    input.scene.id === 'cover'
      ? getValentinDinoPersonalizedTitle(input.childName)
      : input.scene.title;
  const previewScene = input.previewSceneMap.get(input.scene.id);
  const previewSceneDataUrl = await loadPreviewSceneDataUrl(input.adminClient, previewScene);

  if (!input.childPhotoDataUrl) {
    if (input.scene.assetKind === 'cover') {
      return [
        buildFailedGeneratedOrderPage({
          orderId: input.orderId,
          pageNumber: 1,
          pageType: 'cover',
          sceneId: input.scene.id,
          title: personalizedTitle,
          text: '',
          layoutVariant: 'cover',
          errorMessage: `No hay referencia de foto para generar ${input.scene.id}.`,
          version: input.version,
        }),
      ];
    }

    const leftPageNumber = input.scene.storyPageRange ? input.scene.storyPageRange[0] + 1 : input.scene.pageNumber;
    return [
      buildFailedGeneratedOrderPage({
        orderId: input.orderId,
        pageNumber: leftPageNumber,
        pageType: 'story_page',
        sceneId: input.scene.id,
        title: personalizedTitle,
        text: '',
        layoutVariant: 'image_only',
        storyPageRange: input.scene.storyPageRange,
        errorMessage: `No hay referencia de foto para generar ${input.scene.id}.`,
        version: input.version,
      }),
      buildFailedGeneratedOrderPage({
        orderId: input.orderId,
        pageNumber: leftPageNumber + 1,
        pageType: 'story_page',
        sceneId: input.scene.id,
        title: personalizedTitle,
        text: personalizedText,
        layoutVariant: 'text_on_image',
        storyPageRange: input.scene.storyPageRange,
        errorMessage: `No hay referencia de foto para generar ${input.scene.id}.`,
        version: input.version,
      }),
    ];
  }

  const generated = await generateSceneDataUrl({
    childName: input.childName,
    childFeatures: input.childFeatures,
    scene: input.scene,
    childPhotoDataUrl: input.childPhotoDataUrl,
    anchorDataUrls: input.anchorDataUrls,
    extraReferenceDataUrls: previewSceneDataUrl ? [previewSceneDataUrl] : [],
    allowDeterministicFallback: false,
    skipAiGeneration: false,
    profile: 'print',
  });

  if (!generated.imageDataUrl) {
    if (input.scene.assetKind === 'cover') {
      return [
        buildFailedGeneratedOrderPage({
          orderId: input.orderId,
          pageNumber: 1,
          pageType: 'cover',
          sceneId: input.scene.id,
          title: personalizedTitle,
          text: '',
          layoutVariant: 'cover',
          errorMessage: `No se pudo generar la escena ${input.scene.id}.`,
          version: input.version,
        }),
      ];
    }

    const leftPageNumber = input.scene.storyPageRange ? input.scene.storyPageRange[0] + 1 : input.scene.pageNumber;
    return [
      buildFailedGeneratedOrderPage({
        orderId: input.orderId,
        pageNumber: leftPageNumber,
        pageType: 'story_page',
        sceneId: input.scene.id,
        title: personalizedTitle,
        text: '',
        layoutVariant: 'image_only',
        storyPageRange: input.scene.storyPageRange,
        errorMessage: `No se pudo generar la escena ${input.scene.id}.`,
        version: input.version,
      }),
      buildFailedGeneratedOrderPage({
        orderId: input.orderId,
        pageNumber: leftPageNumber + 1,
        pageType: 'story_page',
        sceneId: input.scene.id,
        title: personalizedTitle,
        text: personalizedText,
        layoutVariant: 'text_on_image',
        storyPageRange: input.scene.storyPageRange,
        errorMessage: `No se pudo generar la escena ${input.scene.id}.`,
        version: input.version,
      }),
    ];
  }

  if (input.scene.assetKind === 'cover') {
    const composedCover = await composeDinoCoverPage({
      imageDataUrl: generated.imageDataUrl,
      title: personalizedTitle,
      childName: input.childName,
      theme: VALENTIN_DINO_BOOK.editorialTheme,
    });
    const uploaded = await uploadComposedOrderPage(input.adminClient, {
      orderId: input.orderId,
      sceneId: input.scene.id,
      pageNumber: composedCover.pageNumber,
      dataUrl: composedCover.imageDataUrl,
    });

    return [
      toGeneratedOrderPage(input.orderId, composedCover, uploaded.storageUri, composedCover.imageDataUrl, input.version ?? 1),
    ];
  }

  const leftPageNumber = input.scene.storyPageRange ? input.scene.storyPageRange[0] + 1 : input.scene.pageNumber;
  const composedPages = await composeDinoSpreadPages({
    spreadId: input.scene.id,
    spreadImageDataUrl: generated.imageDataUrl,
    title: personalizedTitle,
    text: personalizedText,
    leftPageNumber,
    storyPageRange: input.scene.storyPageRange ?? [leftPageNumber - 1, leftPageNumber],
    theme: VALENTIN_DINO_BOOK.editorialTheme,
    textPlacement: input.scene.textPlacement,
  });

  const uploadedPages = await Promise.all(
    composedPages.map(async (page) => ({
      page,
      uploaded: await uploadComposedOrderPage(input.adminClient, {
        orderId: input.orderId,
        sceneId: input.scene.id,
        pageNumber: page.pageNumber,
        dataUrl: page.imageDataUrl,
      }),
    })),
  );

  return uploadedPages.map(({ page, uploaded }) =>
    toGeneratedOrderPage(input.orderId, page, uploaded.storageUri, page.imageDataUrl, input.version ?? 1),
  );
}

export async function generateValentinDinoOrderPages(
  input: GenerateOrderPagesInput,
): Promise<GeneratedOrderPage[]> {
  await ensureStoryStorage(input.adminClient);

  const previewSceneMap = new Map<BookSceneDefinition['id'], StoredStoryScene>();
  if (input.previewBundle) {
    previewSceneMap.set(input.previewBundle.cover.sceneId, input.previewBundle.cover);
    for (const scene of input.previewBundle.scenes) {
      previewSceneMap.set(scene.sceneId, scene);
    }
  }

  const childPhotoDataUrl = input.previewBundle
    ? await downloadStorageObjectAsDataUrl(input.adminClient, {
        bucket: input.previewBundle.referencePhoto.bucket,
        objectPath: input.previewBundle.referencePhoto.path,
      })
    : null;

  const anchorDataUrls: string[] = [];
  if (input.previewBundle) {
    anchorDataUrls.push(
      await downloadStorageObjectAsDataUrl(input.adminClient, {
        bucket: input.previewBundle.cover.storage.bucket,
        objectPath: input.previewBundle.cover.storage.path,
      }),
    );
    const firstScene = input.previewBundle.scenes.find((scene) => scene.sceneId === 'spread-01-02');
    if (firstScene) {
      anchorDataUrls.push(
        await downloadStorageObjectAsDataUrl(input.adminClient, {
          bucket: firstScene.storage.bucket,
          objectPath: firstScene.storage.path,
        }),
      );
    }
  }

  const pages: GeneratedOrderPage[] = [];
  let generatedCoverDataUrl: string | null = null;

  for (const scene of VALENTIN_DINO_BOOK.scenes) {
    const scenePages = await buildComposedPagesForScene({
      adminClient: input.adminClient,
      orderId: input.orderId,
      childName: input.childName,
      childFeatures: input.childFeatures,
      childPhotoDataUrl,
      previewSceneMap,
      anchorDataUrls,
      scene,
      version: input.version,
    });

    if (scene.id === 'cover') {
      const readyCover = scenePages.find((page) => page.page_type === 'cover' && page.image_url);
      if (readyCover?.image_url) {
        const coverRef = parseStorageUri(readyCover.image_url);
        if (coverRef) {
          generatedCoverDataUrl = await downloadStorageObjectAsDataUrl(input.adminClient, {
            bucket: coverRef.bucket,
            objectPath: coverRef.objectPath,
          }).catch(() => null);
        }
      }
    }

    pages.push(...scenePages);
  }

  if (generatedCoverDataUrl) {
    const personalizedTitle = getValentinDinoPersonalizedTitle(input.childName);
    const backCover = await composeDinoBackCoverPage({
      coverImageDataUrl: generatedCoverDataUrl,
      title: personalizedTitle,
      theme: VALENTIN_DINO_BOOK.editorialTheme,
    });
    const uploadedBackCover = await uploadComposedOrderPage(input.adminClient, {
      orderId: input.orderId,
      sceneId: 'back-cover',
      pageNumber: backCover.pageNumber,
      dataUrl: backCover.imageDataUrl,
    });

    pages.push(
      toGeneratedOrderPage(
        input.orderId,
        backCover,
        uploadedBackCover.storageUri,
        backCover.imageDataUrl,
        input.version ?? 1,
      ),
    );
  } else {
    pages.push(
      buildFailedGeneratedOrderPage({
        orderId: input.orderId,
        pageNumber: 22,
        pageType: 'back_cover',
        sceneId: 'cover',
        title: 'Contratapa',
        text: '',
        layoutVariant: 'back_cover',
        errorMessage: 'No se pudo componer la contratapa porque la tapa no quedó disponible.',
        version: input.version,
      }),
    );
  }

  return pages.sort((left, right) => left.page_number - right.page_number);
}

export function buildPreviewBundleFromPayload(value: unknown): DinoPreviewBundle | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<DinoPreviewBundle>;

  if (
    payload.storyId !== VALENTIN_DINO_BOOK.id ||
    !payload.cover ||
    !Array.isArray(payload.scenes) ||
    !payload.referencePhoto
  ) {
    return null;
  }

  return payload as DinoPreviewBundle;
}

export function getPreviewCoverUrl(bundle: DinoPreviewBundle | null) {
  return bundle?.cover?.imageUrl ?? null;
}

export function getAllPreviewScenes(bundle: DinoPreviewBundle | null) {
  if (!bundle) return [];
  return [bundle.cover, ...bundle.scenes].sort((left, right) => left.pageNumber - right.pageNumber);
}

export function isDinoStoryPreviewSupported(storyId: string | null | undefined) {
  return isValentinDinoStoryId(storyId);
}
