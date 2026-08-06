import { CloudflareEnv, R2Bucket, R2ObjectBody } from '@/types/cloudflare';

export function getR2(env: CloudflareEnv): R2Bucket {
  if (!env?.R2) {
    throw new Error('R2 binding not available');
  }
  return env.R2;
}

const PREFIXES = {
  photos: 'photos/',
  thumbnails: 'thumbnails/',
};

export async function uploadPhoto(
  r2: R2Bucket,
  photoId: string,
  file: ArrayBuffer,
  contentType: string
): Promise<string> {
  const key = `${PREFIXES.photos}${photoId}/original`;
  await r2.put(key, file, {
    httpMetadata: { contentType },
    customMetadata: { photoId },
  });
  return key;
}

export async function uploadThumbnail(
  r2: R2Bucket,
  photoId: string,
  file: ArrayBuffer,
  contentType: string
): Promise<string> {
  const key = `${PREFIXES.thumbnails}${photoId}/thumb`;
  await r2.put(key, file, {
    httpMetadata: { contentType },
    customMetadata: { photoId },
  });
  return key;
}

export async function getPhotoObject(r2: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  const object = await r2.get(key);
  return object;
}

export async function deletePhotoFiles(r2: R2Bucket, photoId: string): Promise<void> {
  const photoKey = `${PREFIXES.photos}${photoId}/original`;
  const thumbKey = `${PREFIXES.thumbnails}${photoId}/thumb`;
  
  await r2.delete([photoKey, thumbKey]);
}

export function getPublicPhotoUrl(photoId: string): string {
  return `/api/photos/${photoId}/original`;
}

export function getPublicThumbnailUrl(photoId: string): string {
  return `/api/photos/${photoId}/thumb`;
}
