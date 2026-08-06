import { NextRequest, NextResponse } from 'next/server';
import { getKV, deletePhoto } from '@/lib/kv';
import { getR2, deletePhotoFiles } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv();
    const user = await getCurrentUser(request, env.JWT_SECRET);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const kv = getKV(env);
    const r2 = getR2(env);

    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photo ids provided' },
        { status: 400 }
      );
    }

    let deleted = 0;
    for (const id of ids) {
      await deletePhotoFiles(r2, id);
      await deletePhoto(kv, id);
      deleted++;
    }

    return NextResponse.json({ success: true, data: { deleted } });
  } catch (error) {
    console.error('Batch delete photos error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}