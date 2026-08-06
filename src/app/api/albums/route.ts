import { NextRequest, NextResponse } from 'next/server';
import { getKV, getAllAlbums, setAlbum } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { Album } from '@/types';
import { CloudflareEnv } from '@/types/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
  try {
    const kv = getKV(context.env);
    
    const albums = await getAllAlbums(kv);
    albums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    console.error('Get albums error:', error);
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
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Album name is required' },
        { status: 400 }
      );
    }
    
    const album: Album = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      cover_photo_id: null,
      created_at: new Date().toISOString(),
    };
    
    await setAlbum(kv, album);
    
    return NextResponse.json({ success: true, data: album }, { status: 201 });
  } catch (error) {
    console.error('Create album error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
