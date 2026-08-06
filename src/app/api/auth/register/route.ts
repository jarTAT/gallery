import { NextRequest, NextResponse } from 'next/server';
import { getKV, getUser, setUser } from '@/lib/kv';
import { hashPassword, createToken } from '@/lib/auth';
import { User } from '@/types';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    
    const body = await request.json();
    const { username, password, email } = body;
    
    if (!username || !password || !email) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and email are required' },
        { status: 400 }
      );
    }
    
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-20 characters' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    const existingUser = await getUser(kv, username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    const password_hash = await hashPassword(password);
    const user: User = {
      username,
      password_hash,
      email,
      role: 'user',
      is_member: false,
      member_expire: null,
      created_at: new Date().toISOString(),
    };
    
    await setUser(kv, user);
    
    const token = await createToken({
      username: user.username,
      role: user.role,
      is_member: user.is_member,
    }, env.JWT_SECRET);
    
    const response = NextResponse.json({
      success: true,
      data: { token, user: { username: user.username, email: user.email, role: user.role } },
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
