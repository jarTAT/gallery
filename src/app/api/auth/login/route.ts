import { NextRequest, NextResponse } from 'next/server';
import { getKV, getUser, updateUser } from '@/lib/kv';
import { verifyPassword, verifyAdminPassword, createToken, createAdminToken } from '@/lib/auth';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv();
    const kv = getKV(env);
    
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const isAdminLogin = username === 'admin';
    
    if (isAdminLogin) {
      const isAdminValid = await verifyAdminPassword(password, env.ADMIN_PASSWORD);
      if (!isAdminValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid admin password' },
          { status: 401 }
        );
      }
      
      const token = await createAdminToken(env.JWT_SECRET);
      const response = NextResponse.json({
        success: true,
        data: { token, user: { username: 'admin', role: 'admin', is_member: true } },
      });
      
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      
      return response;
    }
    
    const userData = await getUser(kv, username);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await verifyPassword(password, userData.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    let is_member = userData.is_member;
    if (is_member && userData.member_expire) {
      const expireDate = new Date(userData.member_expire);
      if (expireDate < new Date()) {
        is_member = false;
        await updateUser(kv, username, { is_member: false });
      }
    }
    
    const token = await createToken({
      username: userData.username,
      role: userData.role,
      is_member,
    }, env.JWT_SECRET);
    
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          username: userData.username,
          email: userData.email,
          role: userData.role,
          is_member,
        },
      },
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
