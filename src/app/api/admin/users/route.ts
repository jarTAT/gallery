import { NextRequest, NextResponse } from 'next/server';
import { getKV, getUser, setUser, updateUser } from '@/lib/kv';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { User } from '@/types';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
    
    const body = await request.json();
    const {
      username,
      password,
      email,
      role,
      is_member,
      member_expire,
    } = body;
    
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
    
    const targetRole = role === 'admin' ? 'admin' : 'user';
    const targetIsMember = is_member === true;
    const password_hash = await hashPassword(password);
    
    const newUser: User = {
      username,
      password_hash,
      email,
      role: targetRole,
      is_member: targetIsMember,
      member_expire: targetIsMember && member_expire
        ? new Date(member_expire).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };
    
    await setUser(kv, newUser);
    
    const { password_hash: _ph, ...safeUser } = newUser;
    
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const body = await request.json();
    const {
      username,
      email,
      role,
      is_member,
      member_expire,
      password,
    } = body;
    
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
    
    if (email !== undefined && email !== '') {
      if (typeof email !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid email' },
          { status: 400 }
        );
      }
      updates.email = email;
    }
    
    if (role !== undefined) {
      if (role !== 'user' && role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        );
      }
      updates.role = role;
    }
    
    if (is_member !== undefined) {
      updates.is_member = is_member === true;
    }
    
    if (member_expire !== undefined) {
      updates.member_expire = member_expire
        ? new Date(member_expire).toISOString()
        : null;
    }
    
    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      updates.password_hash = await hashPassword(password);
    }
    
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