import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().set({ name: 'flash', value: '', path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
