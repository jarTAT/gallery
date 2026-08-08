import { NextRequest, NextResponse } from 'next/server';
import { getKV, getAllPhotos, setPhoto } from '@/lib/kv';
import { getR2, uploadPhoto } from '@/lib/r2';
import { getCurrentUser } from '@/lib/auth';
import { Photo, PaginatedResponse, PhotoImage } from '@/types';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

function sanitizePhoto(photo: Photo, showContact: boolean): Photo {
  if (showContact) return photo;
  return { ...photo, contact: '', link: '' };
}

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    const user = await getCurrentUser(request, env.JWT_SECRET);
    const showContact = user?.role === 'admin';
    
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
    
    const cities = Array.from(new Set(photos.map(p => p.city).filter(Boolean))).sort();
    
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
      const keywords = search
        .split(/[\s,]+/)
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);
      
      if (keywords.length > 0) {
        photos = photos.filter(p => {
          const haystack = [
            p.name.toLowerCase(),
            ...p.tags.map(t => t.toLowerCase()),
            p.city.toLowerCase(),
            p.district.toLowerCase(),
          ];
          return keywords.every(kw => haystack.some(h => h.includes(kw)));
        });
      }
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
    const paginatedPhotos = photos.slice(offset, offset + limit).map(p => sanitizePhoto(p, showContact));
    
    const response: PaginatedResponse<Photo> = {
      data: paginatedPhotos,
      total,
      page,
      limit,
      has_more: offset + limit < total,
    };
    
    return NextResponse.json({ success: true, data: response, cities });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string || '0');
    const tags = (formData.get('tags') as string || '').split(',').filter(Boolean);
    const city = formData.get('city') as string || '';
    const district = formData.get('district') as string || '';
    const contact = formData.get('contact') as string || '';
    const link = formData.get('link') as string || '';
    const album_id = formData.get('album_id') as string || '';
    
    if (files.length === 0 || !name) {
      return NextResponse.json(
        { success: false, error: 'At least one file and name are required' },
        { status: 400 }
      );
    }
    
    const photoId = crypto.randomUUID();
    const images: PhotoImage[] = [];
    
    for (const file of files) {
      const imageId = crypto.randomUUID();
      const arrayBuffer = await file.arrayBuffer();
      const contentType = file.type || 'image/jpeg';
      const image = await uploadPhoto(r2, photoId, imageId, arrayBuffer, contentType);
      images.push(image);
    }
    
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
      images,
      cover_index: 0,
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
