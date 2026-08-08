import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto } from '@/lib/kv';
import { getR2, getPhotoImageObject } from '@/lib/r2';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    const r2 = getR2(env);

    const photo = await getPhoto(kv, context.params.id);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coverIndex = Math.min(photo.cover_index || 0, photo.images.length - 1);
    const requestedIndex = parseInt(searchParams.get('index') || '');
    const index = Number.isNaN(requestedIndex)
      ? coverIndex
      : Math.min(Math.max(requestedIndex, 0), photo.images.length - 1);

    const image = (photo.images && photo.images[index]) || null;
    if (!image || !image.thumb_key) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const object = await getPhotoImageObject(r2, image.thumb_key);
    if (!object) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const arrayBuffer = await object.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('Get thumbnail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
