import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getImageDataUrlMetadata } from '@/lib/image-data-url';

export const PRIVATE_REFERENCE_BUCKET = 'reference-looks';
export const PRIVATE_RENDER_BUCKET = 'book-renders';

export interface StoredObjectRef {
  bucket: string;
  path: string;
  storageUri: string;
}

const STORAGE_URI_PREFIX = 'storage://';

export async function ensureStorageBucket(
  adminClient: SupabaseClient,
  bucket: string,
  isPublic: boolean,
) {
  const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
  if (bucketsError) {
    throw new Error(bucketsError.message);
  }

  const existing = (buckets ?? []).find((item) => item.name === bucket || item.id === bucket);
  if (existing) {
    const bucketIsPublic = Boolean((existing as { public?: boolean }).public);
    if (bucketIsPublic !== isPublic) {
      const { error: updateError } = await adminClient.storage.updateBucket(bucket, {
        public: isPublic,
        fileSizeLimit: '10MB',
      });
      if (updateError) {
        throw new Error(updateError.message);
      }
    }
    return existing;
  }

  const { data, error } = await adminClient.storage.createBucket(bucket, {
    public: isPublic,
    fileSizeLimit: '10MB',
  });

  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw new Error(error.message);
  }

  return data ?? { id: bucket, name: bucket, public: isPublic };
}

export async function ensureStoryStorage(adminClient: SupabaseClient) {
  await ensureStorageBucket(adminClient, PRIVATE_REFERENCE_BUCKET, false);
  await ensureStorageBucket(adminClient, PRIVATE_RENDER_BUCKET, false);
}

export async function uploadDataUrlToStorage(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
    dataUrl: string;
    cacheControl?: string;
    upsert?: boolean;
  },
): Promise<StoredObjectRef> {
  const metadata = getImageDataUrlMetadata(params.dataUrl);

  const { error } = await adminClient.storage.from(params.bucket).upload(params.objectPath, metadata.bytes, {
    contentType: metadata.mimeType,
    cacheControl: params.cacheControl ?? '3600',
    upsert: params.upsert ?? true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket: params.bucket,
    path: params.objectPath,
    storageUri: buildStorageUri(params.bucket, params.objectPath),
  };
}

export async function uploadBinaryToStorage(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
    bytes: Buffer;
    contentType: string;
    cacheControl?: string;
    upsert?: boolean;
  },
): Promise<StoredObjectRef> {
  const { error } = await adminClient.storage.from(params.bucket).upload(params.objectPath, params.bytes, {
    contentType: params.contentType,
    cacheControl: params.cacheControl ?? '3600',
    upsert: params.upsert ?? true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket: params.bucket,
    path: params.objectPath,
    storageUri: buildStorageUri(params.bucket, params.objectPath),
  };
}

export async function uploadJsonToStorage(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
    value: unknown;
    cacheControl?: string;
    upsert?: boolean;
  },
) {
  const bytes = Buffer.from(JSON.stringify(params.value, null, 2), 'utf8');
  return uploadBinaryToStorage(adminClient, {
    bucket: params.bucket,
    objectPath: params.objectPath,
    bytes,
    contentType: 'application/json',
    cacheControl: params.cacheControl ?? '60',
    upsert: params.upsert,
  });
}

export async function downloadStorageObjectAsDataUrl(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
  },
) {
  const { data, error } = await adminClient.storage.from(params.bucket).download(params.objectPath);
  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to download storage object');
  }

  const arrayBuffer = await data.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  const mimeType = data.type || 'image/jpeg';

  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

export async function downloadJsonFromStorage<T>(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
  },
) {
  const { data, error } = await adminClient.storage.from(params.bucket).download(params.objectPath);
  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to download storage JSON');
  }

  const text = Buffer.from(await data.arrayBuffer()).toString('utf8');
  return JSON.parse(text) as T;
}

export function getPublicStorageUrl(adminClient: SupabaseClient, bucket: string, objectPath: string) {
  const { data } = adminClient.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl ?? null;
}

export async function createSignedStorageUrl(
  adminClient: SupabaseClient,
  params: {
    bucket: string;
    objectPath: string;
    expiresIn?: number;
  },
) {
  const { data, error } = await adminClient.storage
    .from(params.bucket)
    .createSignedUrl(params.objectPath, params.expiresIn ?? 60 * 60);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Unable to create signed URL');
  }

  return data.signedUrl;
}

export function buildStorageUri(bucket: string, objectPath: string) {
  return `${STORAGE_URI_PREFIX}${bucket}/${objectPath}`;
}

export function isStorageUri(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(STORAGE_URI_PREFIX);
}

export function parseStorageUri(value: string) {
  if (!isStorageUri(value)) return null;
  const remainder = value.slice(STORAGE_URI_PREFIX.length);
  const slashIndex = remainder.indexOf('/');
  if (slashIndex === -1) return null;
  return {
    bucket: remainder.slice(0, slashIndex),
    objectPath: remainder.slice(slashIndex + 1),
  };
}

export async function resolveStorageUrlForClient(
  adminClient: SupabaseClient,
  value: string | null | undefined,
  expiresIn = 60 * 60,
) {
  if (!value) return null;
  const parsed = parseStorageUri(value);
  if (!parsed) return value;
  return createSignedStorageUrl(adminClient, {
    bucket: parsed.bucket,
    objectPath: parsed.objectPath,
    expiresIn,
  });
}

export function buildStorageObjectPath(prefix: string, fileName: string) {
  const normalizedFileName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${prefix}/${crypto.randomUUID()}-${normalizedFileName}`;
}
