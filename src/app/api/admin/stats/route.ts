import { NextRequest, NextResponse } from 'next/server';
import { getKV, getAllPhotos, getAllAlbums } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { CloudflareEnv } from '@/types/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
  try {
    const user = await getCurrentUser(request, context.env.JWT_SECRET);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const kv = getKV(context.env);
    
    const photos = await getAllPhotos(kv);
    const albums = await getAllAlbums(kv);
    
    const index = (await kv.get('index:users', 'json') as string[] | null) || [];
    const totalUsers = index.length;
    
    const priceRanges = {
      '0-500': 0,
      '500-1000': 0,
      '1000+': 0,
    };
    
    const cityStats: Record<string, number> = {};
    const tagStats: Record<string, number> = {};
    
    for (const photo of photos) {
      if (photo.price <= 500) priceRanges['0-500']++;
      else if (photo.price <= 1000) priceRanges['500-1000']++;
      else priceRanges['1000+']++;
      
      cityStats[photo.city] = (cityStats[photo.city] || 0) + 1;
      
      for (const tag of photo.tags) {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalPhotos: photos.length,
        totalAlbums: albums.length,
        totalUsers,
        priceRanges,
        cityStats,
        tagStats,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
