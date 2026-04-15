/**
 * Shared types for the image provider abstraction layer.
 *
 * Every provider adapter (gemini, flux-kontext, seedream, ...) implements
 * the same `ImageProvider` interface so the rest of the app can call a
 * single `generateImage()` function without knowing which model is active.
 *
 * See `lib/image-providers/index.ts` for the factory / router.
 */

export type ImageProviderName =
  | "gemini"
  | "flux-kontext-pro"
  | "flux-kontext-max"
  | "seedream";

export type ImageSize = "1K" | "2K" | "4K";

export type ImageProfile = "preview" | "print";

export interface GenerateImageInput {
  /** Main text prompt that describes the scene. */
  prompt: string;

  /**
   * Reference images as data URLs or raw base64 strings. Order matters:
   * the first reference is treated as the main identity anchor (usually
   * the child's photo); subsequent entries are secondary anchors (base
   * scene template, previous scene, etc.).
   *
   * Legacy callers used `referenceImageBase64` + `referenceImageBase64s`
   * separately. The adapter layer normalizes both into this single array.
   */
  references?: string[];

  /** Aspect ratio hint. Providers normalize this to their closest supported value. */
  aspectRatio?: string;

  /** Target rendering size. Used to choose model tier / resolution. */
  imageSize?: ImageSize;

  /** Preview vs. paid print. Lets adapters pick cheaper/faster params for previews. */
  profile?: ImageProfile;

  /** Optional override of the adapter's default model name (provider-specific). */
  modelOverride?: string;

  /** Retry budget for transient errors. */
  maxRetries?: number;

  /** Timeout for a single remote call in ms. */
  timeoutMs?: number;
}

export interface GenerateImageResult {
  /** Data URL (`data:image/png;base64,...`) of the generated image, or null on failure. */
  imageDataUrl: string | null;
  /** Which provider actually produced the image (may differ from requested on fallback). */
  provider: ImageProviderName | "fallback";
  /** Concrete model id used (useful for logs / billing attribution). */
  model: string;
  /** Populated only when `imageDataUrl` is null. */
  errorMessage?: string | null;
  /** Optional latency measurement in ms (set by the router wrapper). */
  latencyMs?: number;
}

export interface ImageProvider {
  /** Canonical provider name. */
  readonly name: ImageProviderName;

  /** True when the provider has all env/credentials it needs to run. */
  isConfigured(): boolean;

  /**
   * Generate a single image. Must not throw; always return a
   * `GenerateImageResult` with `imageDataUrl=null` and an error message
   * on failure so the router can decide whether to fall back.
   */
  generate(input: GenerateImageInput): Promise<GenerateImageResult>;
}
