import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto, updatePhoto, deletePhoto } from '@/lib/kv';
import { getR2, deletePhotoFiles } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { Photo } from '@/types';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    
    const photo = await getPhoto(kv, context.params.id);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    console.error('Get photo error:', error);
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
    const updates: Partial<Photo> = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) updates.price = body.price;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.city !== undefined) updates.city = body.city;
    if (body.district !== undefined) updates.district = body.district;
    if (body.contact !== undefined) updates.contact = body.contact;
    if (body.link !== undefined) updates.link = body.link;
    if (body.album_id !== undefined) updates.album_id = body.album_id;
    if (body.is_pinned !== undefined) updates.is_pinned = Boolean(body.is_pinned);
    
    await updatePhoto(kv, context.params.id, updates);
    
    const updatedPhoto = await getPhoto(kv, context.params.id);
    return NextResponse.json({ success: true, data: updatedPhoto });
  } catch (error) {
    console.error('Update photo error:', error);
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
    const r2 = getR2(env);
    
    await deletePhotoFiles(r2, context.params.id);
    await deletePhoto(kv, context.params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
