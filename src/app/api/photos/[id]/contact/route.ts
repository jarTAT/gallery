import { NextRequest, NextResponse } from 'next/server';
import { getKV, getPhoto, getDailyUsage, incrementDailyUsage } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const env = await getEnv();
    const user = await getCurrentUser(request, env.JWT_SECRET);
    
    const kv = getKV(env);
    
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
        { success: false, error: '非会员每日最多查看5次；如需查看更多请联系管理员加入会员。' },
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
