import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto, getDailyUsage, incrementDailyUsage } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { CloudflareEnv } from '@/types/cloudflare';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  context: { params: { id: string }; env: CloudflareEnv }
) {
  try {
    const user = await getCurrentUser(request, context.env.JWT_SECRET);
    
    const kv = getKV(context.env);
    
    const photo = await getPhoto(kv, context.params.id);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Login required to view contact info', requireLogin: true },
        { status: 401 }
      );
    }
    
    const today = new Date().toISOString().split('T')[0];
    const usage = await getDailyUsage(kv, user.username, today);
    
    if (!user.is_member && usage.contact_views >= 5) {
      return NextResponse.json(
        { success: false, error: 'Daily limit reached (5 views per day for non-members)' },
        { status: 429 }
      );
    }
    
    const newUsage = await incrementDailyUsage(kv, user.username, 'contact_views');
    
    return NextResponse.json({
      success: true,
      data: {
        contact: photo.contact,
        link: photo.link,
        remaining: user.is_member ? Infinity : 5 - newUsage.contact_views,
      },
    });
  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
