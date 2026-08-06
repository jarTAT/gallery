import { NextRequest, NextResponse } from 'next/server';
import { getKV, getAlbum, updateAlbum, deleteAlbum } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    
    const album = await getAlbum(kv, context.params.id);
    if (!album) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    console.error('Get album error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
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
    
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.cover_photo_id !== undefined) updates.cover_photo_id = body.cover_photo_id;
    
    await updateAlbum(kv, context.params.id, updates);
    
    const updatedAlbum = await getAlbum(kv, context.params.id);
    return NextResponse.json({ success: true, data: updatedAlbum });
  } catch (error) {
    console.error('Update album error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
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
    
    await deleteAlbum(kv, context.params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete album error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
