import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto, updatePhoto, deletePhoto } from '@/lib/kv';
import { getR2, deletePhotoFiles, deletePhotoImageFiles, uploadPhoto } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { Photo, PhotoImage } from '@/types';
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

    const existing = await getPhoto(kv, context.params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const updates: Partial<Photo> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];

      let images = Array.isArray(existing.images) ? existing.images : [];

      if (files.length > 0) {
        const newImages: PhotoImage[] = [];
        for (const file of files) {
          if (file.size <= 0) continue;
          const imageId = crypto.randomUUID();
          const arrayBuffer = await file.arrayBuffer();
          const fileType = file.type || 'image/jpeg';
          const image = await uploadPhoto(r2, context.params.id, imageId, arrayBuffer, fileType);
          newImages.push(image);
        }
        images = [...images, ...newImages];
      }

      updates.images = images;

      if (formData.get('name') !== null) updates.name = formData.get('name') as string;
      if (formData.get('price') !== null) updates.price = parseInt(formData.get('price') as string || '0');
      if (formData.get('tags') !== null) updates.tags = (formData.get('tags') as string || '').split(',').filter(Boolean);
      if (formData.get('city') !== null) updates.city = formData.get('city') as string || '';
      if (formData.get('district') !== null) updates.district = formData.get('district') as string || '';
      if (formData.get('contact') !== null) updates.contact = formData.get('contact') as string || '';
      if (formData.get('link') !== null) updates.link = formData.get('link') as string || '';
      if (formData.get('album_id') !== null) updates.album_id = formData.get('album_id') as string || '';
      if (formData.get('is_pinned') !== null) updates.is_pinned = formData.get('is_pinned') === 'true';
      if (formData.get('cover_index') !== null) {
        const ci = parseInt(formData.get('cover_index') as string);
        updates.cover_index = Number.isNaN(ci) ? existing.cover_index : Math.min(Math.max(ci, 0), images.length - 1);
      }
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

      if (body.cover_index !== undefined) {
        const count = Array.isArray(existing.images) ? existing.images.length : 0;
        const ci = parseInt(body.cover_index);
        updates.cover_index = Number.isNaN(ci) ? existing.cover_index : Math.min(Math.max(ci, 0), Math.max(count - 1, 0));
      }

      if (Array.isArray(body.remove_indices)) {
        const indices = body.remove_indices.map(Number).filter(i => !Number.isNaN(i));
        const currentImages = Array.isArray(existing.images) ? existing.images : [];
        const remaining: PhotoImage[] = [];
        for (let i = 0; i < currentImages.length; i++) {
          if (!indices.includes(i)) {
            remaining.push(currentImages[i]);
          } else {
            await deletePhotoImageFiles(r2, context.params.id, currentImages[i]?.key?.split('/').pop() || crypto.randomUUID());
          }
        }
        updates.images = remaining;
        updates.cover_index = Math.min(existing.cover_index, Math.max(remaining.length - 1, 0));
      }
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

    const existing = await getPhoto(kv, context.params.id);
    if (existing) {
      await deletePhotoFiles(r2, Array.isArray(existing.images) ? existing.images : []);
    }
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
