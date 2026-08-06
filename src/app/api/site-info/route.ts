import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv();
    return NextResponse.json({
      success: true,
      data: {
        adminContact: env.ADMIN_CONTACT || '',
      },
    });
  } catch (error) {
    console.error('Get site info error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
