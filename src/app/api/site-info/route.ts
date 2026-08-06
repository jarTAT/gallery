import { NextRequest, NextResponse } from 'next/server';
import { CloudflareEnv } from '@/types/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        adminContact: context.env.ADMIN_CONTACT || '',
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
