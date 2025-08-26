import { NextResponse } from 'next/server';
import { verifyTempToken } from '../../../../src/lib/auth';
import { prisma } from '../../../../src/lib/prisma';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const token = params.token;
  const decoded = verifyTempToken(token as string) as any;
  if (!decoded?.id) return NextResponse.redirect('/');
  const id = Number(decoded.id);
  try {
    await prisma.user.update({ where: { id }, data: { emailVerified: true } });
  } catch (e) {
    // ignore
  }
  return NextResponse.redirect('/login');
}
