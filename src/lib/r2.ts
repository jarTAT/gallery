import { CloudflareEnv, R2Bucket, R2ObjectBody } from '@/types/cloudflare';
import { PhotoImage } from '@/types';

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
  imageId: string,
  file: ArrayBuffer,
  contentType: string
): Promise<PhotoImage> {
  const key = `${PREFIXES.photos}${photoId}/${imageId}`;
  const thumbKey = `${PREFIXES.thumbnails}${photoId}/${imageId}`;
  await r2.put(key, file, {
    httpMetadata: { contentType },
    customMetadata: { photoId, imageId },
  });
  await r2.put(thumbKey, file, {
    httpMetadata: { contentType },
    customMetadata: { photoId, imageId },
  });
  return { key, thumb_key: thumbKey };
}

export async function uploadPhotoImage(
  r2: R2Bucket,
  photoId: string,
  imageId: string,
  file: ArrayBuffer,
  contentType: string
): Promise<PhotoImage> {
  return uploadPhoto(r2, photoId, imageId, file, contentType);
}

export async function getPhotoImageObject(
  r2: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  const object = await r2.get(key);
  return object;
}

export async function deletePhotoImageFiles(
  r2: R2Bucket,
  photoId: string,
  imageId: string
): Promise<void> {
  const photoKey = `${PREFIXES.photos}${photoId}/${imageId}`;
  const thumbKey = `${PREFIXES.thumbnails}${photoId}/${imageId}`;
  await r2.delete([photoKey, thumbKey]);
}

export async function deletePhotoFiles(
  r2: R2Bucket,
  images: { key: string; thumb_key: string }[]
): Promise<void> {
  const keys: string[] = [];
  for (const img of images) {
    if (img?.key) keys.push(img.key);
    if (img?.thumb_key) keys.push(img.thumb_key);
  }
  if (keys.length > 0) {
    await r2.delete(keys);
  }
}

export function getPublicPhotoUrl(photoId: string, index?: number): string {
  return index !== undefined ? `/api/photos/${photoId}/original?index=${index}` : `/api/photos/${photoId}/original`;
}

export function getPublicThumbnailUrl(photoId: string, index?: number): string {
  return index !== undefined ? `/api/photos/${photoId}/thumb?index=${index}` : `/api/photos/${photoId}/thumb`;
}