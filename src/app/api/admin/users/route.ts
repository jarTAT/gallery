import { NextRequest, NextResponse } from 'next/server';
import { getKV, getUser, updateUser } from '@/lib/kv';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/types';
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
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (username) {
      const userData = await getUser(kv, username);
      if (!userData) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      const { password_hash, ...safeUser } = userData;
      return NextResponse.json({ success: true, data: safeUser });
    }
    
    const index = (await kv.get('index:users', 'json') as string[] | null) || [];
    const users: Omit<User, 'password_hash'>[] = [];
    
    for (const uname of index) {
      const userData = await getUser(kv, uname);
      if (userData) {
        const { password_hash, ...safeUser } = userData;
        users.push(safeUser);
      }
    }
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Record<string, string>; env: CloudflareEnv }) {
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
    const { username, is_member, member_expire } = body;
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }
    
    const userData = await getUser(kv, username);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const updates: Partial<User> = {};
    if (is_member !== undefined) updates.is_member = is_member;
    if (member_expire !== undefined) updates.member_expire = member_expire;
    
    await updateUser(kv, username, updates);
    
    const updatedUser = await getUser(kv, username);
    const { password_hash, ...safeUser } = updatedUser!;
    
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
