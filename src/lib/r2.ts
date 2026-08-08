import { CloudflareEnv, R2Bucket, R2ObjectBody } from '@/types/cloudflare';
import { PhotoImage, PhotoMediaType } from '@/types';

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
  return { key, thumb_key: thumbKey, type: mediaTypeOf(contentType) };
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

// Derive the media kind from the stored content type.
export function mediaTypeOf(contentType: string): PhotoMediaType {
  return contentType.startsWith('video/') ? 'video' : 'image';
}

export function isMediaVideo(image: Pick<PhotoImage, 'type'> | undefined | null): boolean {
  return image?.type === 'video';
}

// Index of the first image (non-video) in the list, or -1 if none.
export function firstImageIndex(images: PhotoImage[]): number {
  return images.findIndex((i) => !isMediaVideo(i));
}

// Resolve the cover index: it must always point to an image. Falls back to
// index 0 preserved for legacy records created before media types existed.
export function resolveCoverIndex(images: PhotoImage[], current: number): number {
  const first = firstImageIndex(images);
  if (first >= 0) return first;
  return images.length > 0 ? Math.min(Math.max(current, 0), images.length - 1) : 0;
}

export interface ServeMediaResult {
  status: number;
  body: ReadableStream | null;
  headers: Record<string, string>;
}

// Streams an R2 object with HTTP Range support so videos can seek and play.
// R2 itself honors range reads when an offset/length is requested.
export async function servePhotoMedia(
  r2: R2Bucket,
  key: string,
  rangeHeader: string | null,
  fallbackContentType: string
): Promise<ServeMediaResult> {
  const object = await r2.get(key);
  if (!object) throw new Error('Media object not found');

  const size = object.size;
  const contentType = object.httpMetadata?.contentType || fallbackContentType;
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': object.etag,
    'Accept-Ranges': 'bytes',
    'Content-Length': String(size),
  };

  if (!rangeHeader || size <= 0) {
    return { status: 200, body: object.body, headers };
  }

  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match) {
    return { status: 200, body: object.body, headers };
  }

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || start >= size) {
    delete headers['Content-Length'];
    headers['Content-Range'] = `bytes */${size}`;
    return { status: 416, body: null, headers };
  }

  const length = end - start + 1;
  const partial = await r2.get(key, { range: { offset: start, length } });
  if (!partial?.body) {
    delete headers['Content-Length'];
    headers['Content-Range'] = `bytes */${size}`;
    return { status: 416, body: null, headers };
  }

  headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  headers['Content-Length'] = String(partial.size || length);
  return { status: 206, body: partial.body, headers };
}