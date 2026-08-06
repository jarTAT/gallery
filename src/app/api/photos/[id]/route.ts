import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto, updatePhoto, deletePhoto } from '@/lib/kv';
import { getR2, deletePhotoFiles, uploadPhoto, uploadThumbnail } from '@/lib/r2';
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
    const r2 = getR2(env);
    
    const contentType = request.headers.get('content-type') || '';
    const updates: Partial<Photo> = {};
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const fileType = file.type || 'image/jpeg';
        
        await deletePhotoFiles(r2, context.params.id);
        const r2Key = await uploadPhoto(r2, context.params.id, arrayBuffer, fileType);
        const thumbKey = await uploadThumbnail(r2, context.params.id, arrayBuffer, fileType);
        updates.r2_key = r2Key;
        updates.thumb_r2_key = thumbKey;
      }
      
      if (formData.get('name') !== null) updates.name = formData.get('name') as string;
      if (formData.get('price') !== null) updates.price = parseInt(formData.get('price') as string || '0');
      if (formData.get('tags') !== null) updates.tags = (formData.get('tags') as string || '').split(',').filter(Boolean);
      if (formData.get('city') !== null) updates.city = formData.get('city') as string || '';
      if (formData.get('district') !== null) updates.district = formData.get('district') as string || '';
      if (formData.get('contact') !== null) updates.contact = formData.get('contact') as string || '';
      if (formData.get('link') !== null) updates.link = formData.get('link') as string || '';
      if (formData.get('album_id') !== null) updates.album_id = formData.get('album_id') as string || '';
      if (formData.get('is_pinned') !== null) updates.is_pinned = formData.get('is_pinned') === 'true';
    } else {
      const body = await request.json();
      
      if (body.name !== undefined) updates.name = body.name;
      if (body.price !== undefined) updates.price = body.price;
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.city !== undefined) updates.city = body.city;
      if (body.district !== undefined) updates.district = body.district;
      if (body.contact !== undefined) updates.contact = body.contact;
      if (body.link !== undefined) updates.link = body.link;
      if (body.album_id !== undefined) updates.album_id = body.album_id;
      if (body.is_pinned !== undefined) updates.is_pinned = Boolean(body.is_pinned);
    }
    
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
