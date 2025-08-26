import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  res.cookies.set('token', '', { httpOnly: true, path: '/', expires: new Date(0) });
  return res;
}
