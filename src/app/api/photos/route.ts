import { NextRequest, NextResponse } from 'next/server';
import { getKV, getAllPhotos, setPhoto } from '@/lib/kv';
import { getR2, uploadPhoto, uploadThumbnail } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { Photo, PaginatedResponse } from '@/types';
import { CloudflareEnv } from '@/types/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
  try {
    const kv = getKV(context.env);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const min_price = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined;
    const max_price = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const city = searchParams.get('city') || undefined;
    const search = searchParams.get('search') || undefined;
    const album_id = searchParams.get('album_id') || undefined;
    
    let photos = await getAllPhotos(kv);
    
    if (min_price !== undefined) {
      photos = photos.filter(p => p.price >= min_price);
    }
    if (max_price !== undefined) {
      photos = photos.filter(p => p.price <= max_price);
    }
    if (tags && tags.length > 0) {
      photos = photos.filter(p => tags.some(t => p.tags.includes(t)));
    }
    if (city) {
      photos = photos.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      photos = photos.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.tags.some(t => t.toLowerCase().includes(searchLower)) ||
        p.city.toLowerCase().includes(searchLower) ||
        p.district.toLowerCase().includes(searchLower)
      );
    }
    if (album_id) {
      photos = photos.filter(p => p.album_id === album_id);
    }
    
    photos.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    const total = photos.length;
    const offset = (page - 1) * limit;
    const paginatedPhotos = photos.slice(offset, offset + limit);
    
    const response: PaginatedResponse<Photo> = {
      data: paginatedPhotos,
      total,
      page,
      limit,
      has_more: offset + limit < total,
    };
    
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
  try {
    const user = await getCurrentUser(request, context.env.JWT_SECRET);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const kv = getKV(context.env);
    const r2 = getR2(context.env);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string || '0');
    const tags = (formData.get('tags') as string || '').split(',').filter(Boolean);
    const city = formData.get('city') as string || '';
    const district = formData.get('district') as string || '';
    const contact = formData.get('contact') as string || '';
    const link = formData.get('link') as string || '';
    const album_id = formData.get('album_id') as string || '';
    
    if (!file || !name) {
      return NextResponse.json(
        { success: false, error: 'File and name are required' },
        { status: 400 }
      );
    }
    
    const photoId = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || 'image/jpeg';
    
    const r2Key = await uploadPhoto(r2, photoId, arrayBuffer, contentType);
    const thumbKey = await uploadThumbnail(r2, photoId, arrayBuffer, contentType);
    
    const photo: Photo = {
      id: photoId,
      name,
      price,
      tags,
      city,
      district,
      contact,
      link,
      album_id,
      r2_key: r2Key,
      thumb_r2_key: thumbKey,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
    
    await setPhoto(kv, photo);
    
    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (error) {
    console.error('Create photo error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
