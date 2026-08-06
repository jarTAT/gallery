import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { JwtPayload } from '@/types';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createToken(payload: Omit<JwtPayload, 'exp'>, secret: string): Promise<string> {
  const jwtSecret = secret || 'default-secret';
  const secretKey = new TextEncoder().encode(jwtSecret);
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const jwtSecret = secret || 'default-secret';
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      username: payload.username as string,
      role: payload.role as 'user' | 'admin',
      is_member: payload.is_member as boolean,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

export async function verifyAdminPassword(password: string, adminPassword: string): Promise<boolean> {
  const storedPassword = adminPassword;
  if (!storedPassword) {
    throw new Error('ADMIN_PASSWORD not configured');
  }
  return password === storedPassword;
}

export async function createAdminToken(secret: string): Promise<string> {
  return createToken({
    username: 'admin',
    role: 'admin',
    is_member: true,
  }, secret);
}

export async function extractTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }
  
  return null;
}

export async function getCurrentUser(request: Request, secret: string): Promise<JwtPayload | null> {
  const token = await extractTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token, secret);
}
