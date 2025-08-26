import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail fast in non-development environments
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload: object) {
  const secret = JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(payload as any, secret as any, { expiresIn: '7d' } as any);
}

export function verifyToken(token: string) {
  const secret = JWT_SECRET || 'dev-secret-change-me';
  try {
    return jwt.verify(token, secret as any) as any;
  } catch (e) {
    return null;
  }
}

// short lived tokens for email verification / password reset
export function signTempToken(payload: object, expires = '1h') {
  const secret = JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(payload as any, secret as any, { expiresIn: expires } as any);
}

export function verifyTempToken(token: string) {
  const secret = JWT_SECRET || 'dev-secret-change-me';
  try {
    return jwt.verify(token, secret as any) as any;
  } catch (e) {
    return null;
  }
}

export async function getUserFromToken(token?: string | null) {
  const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';
  if (DEBUG_AUTH) {
    // eslint-disable-next-line no-console
    console.debug('[AUTH DEBUG] getUserFromToken token:', token);
  }
  if (!token) return null;
  const decoded = verifyToken(token as string) as any;
  if (DEBUG_AUTH) {
    // eslint-disable-next-line no-console
    console.debug('[AUTH DEBUG] verifyToken result:', decoded);
  }
  if (!decoded?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (DEBUG_AUTH) {
    // eslint-disable-next-line no-console
    console.debug('[AUTH DEBUG] prisma.user.findUnique returned:', user);
  }
  return user;
}
