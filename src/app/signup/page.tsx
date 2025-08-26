import { hashPassword, signToken } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function SignupPage() {
  async function action(formData: FormData) {
    'use server';
    const name = (formData.get('name') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();
    const passwordConfirm = (formData.get('passwordConfirm') as string || '').trim();

  if (!email || !password) throw new Error('Missing fields');
  if (password !== passwordConfirm) throw new Error('Passwords do not match');

    const DEBUG_SIGNUP = process.env.DEBUG_SIGNUP === 'true';
    if (DEBUG_SIGNUP) console.debug('[SIGNUP] checking existing user for', email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (DEBUG_SIGNUP) console.debug('[SIGNUP] existing user found, redirecting to /login', existing.id);
      redirect('/login');
    }

    const hashed = await hashPassword(password);
    let user;
    try {
      user = await prisma.user.create({ data: { email, password: hashed, name: name || undefined } });
      if (DEBUG_SIGNUP) console.debug('[SIGNUP] created user', user.id);
    } catch (e: any) {
      if (e?.code === 'P2002') {
        if (DEBUG_SIGNUP) console.debug('[SIGNUP] caught P2002 race condition for', email);
        redirect('/login');
      }
      throw e;
    }

    const token = signToken({ id: user.id });
    // create email verification token (short lived)
    try {
      const { signTempToken } = await import('../../lib/auth');
      const { sendMail } = await import('../../lib/mailer');
      const vtoken = signTempToken({ id: user.id }, '24h');
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify/${vtoken}`;
      await sendMail({ to: user.email, subject: '[SEO Board] 이메일 인증', html: `<p>다음 링크를 클릭해 이메일을 인증하세요:</p><p><a href="${url}">${url}</a></p>` });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[SIGNUP] sendMail failed', e);
    }
    // set cookie server-side without returning a Response object
    try {
      cookies().set({ name: 'token', value: token, httpOnly: true, path: '/', sameSite: 'lax' });
      if (DEBUG_SIGNUP) console.debug('[SIGNUP] cookies().set token for user', user.id);
    } catch (e) {
      if (DEBUG_SIGNUP) console.debug('[SIGNUP] cookies().set failed', e);
    }
    redirect('/');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-2">회원가입</h1>
      <p className="text-sm text-slate-500 mb-4">SEO Board에 오신 것을 환영합니다 — 간단한 정보만 입력하면 바로 이용할 수 있습니다.</p>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이름 (선택)</label>
          <input name="name" className="w-full border px-3 py-2 rounded" placeholder="홍길동" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input name="email" type="email" required className="w-full border px-3 py-2 rounded" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input name="password" type="password" required minLength={8} className="w-full border px-3 py-2 rounded" placeholder="최소 8자" />
          <p className="text-xs text-slate-500 mt-1">비밀번호는 8자 이상 권장합니다.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
          <input name="passwordConfirm" type="password" required minLength={8} className="w-full border px-3 py-2 rounded" placeholder="비밀번호를 다시 입력하세요" />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">가입하기</button>
          <a href="/login" className="text-sm text-blue-600 hover:underline">이미 계정이 있으신가요? 로그인</a>
        </div>
      </form>
    </div>
  );
}
