import { verifyPassword, signToken } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function action(formData: FormData) {
    'use server';
    const email = (formData.get('email') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();
    if (!email || !password) return;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const ok = await verifyPassword(password, user.password);
    if (!ok) return;
    const token = signToken({ id: user.id });
    const DEBUG_LOGIN = process.env.DEBUG_LOGIN === 'true';
    try {
      cookies().set({ name: 'token', value: token, httpOnly: true, path: '/', sameSite: 'lax' });
      if (DEBUG_LOGIN) console.debug('[LOGIN] set token cookie for user', user.id);
    } catch (e) {
      if (DEBUG_LOGIN) console.debug('[LOGIN] cookies().set failed', e);
    }
    redirect('/');
  }

  return (
    <form action={action} className="space-y-4 max-w-md">
      <h1 className="text-xl font-semibold">로그인</h1>
      <input name="email" type="email" required placeholder="email" />
      <input name="password" type="password" required placeholder="password" />
      <button className="px-3 py-1 bg-blue-600 text-white rounded">로그인</button>
    </form>
  );
}
