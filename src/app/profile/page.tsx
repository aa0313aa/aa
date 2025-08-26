import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getUserFromToken, hashPassword, verifyPassword, signToken, signTempToken } from '../../lib/auth';
import { sendMail } from '../../lib/mailer';

// server actions were moved inside the ProfilePage component to avoid typegen issues

export default async function ProfilePage() {
  const token = cookies().get('token')?.value || null;
  const user = await getUserFromToken(token);
  if (!user) {
    return redirect('/login');
  }

  // nested server action: update profile
  async function updateProfileAction(formData: FormData) {
    'use server';
    const name = String(formData.get('name') || '');
    const email = String(formData.get('email') || '');
    const currentPassword = String(formData.get('currentPassword') || '');
    const newPassword = String(formData.get('newPassword') || '');
    const confirmNewPassword = String(formData.get('confirmNewPassword') || '');

    const token = cookies().get('token')?.value || null;
    const user = await getUserFromToken(token);
    if (!user) return redirect('/login');

    if (!name || !email) return redirect('/profile');

    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) return redirect('/profile');
    }

    let passwordToSave: string | undefined = undefined;
    if (newPassword) {
      if (!currentPassword) return redirect('/profile');
      const ok = await verifyPassword(currentPassword, user.password);
      if (!ok) return redirect('/profile');
      if (newPassword !== confirmNewPassword) return redirect('/profile');
      passwordToSave = await hashPassword(newPassword);
    }

    await prisma.user.update({ where: { id: user.id }, data: { name: name || undefined, email: email || undefined, password: passwordToSave || undefined } });

    if (email !== user.email) {
      const newToken = signToken({ id: user.id, email });
      cookies().set({ name: 'token', value: newToken, httpOnly: true, path: '/', sameSite: 'lax' });
    }

    return redirect('/profile');
  }

  // nested server action: resend verification
  async function resendVerificationAction() {
    'use server';
    const token = cookies().get('token')?.value || null;
    const user = await getUserFromToken(token);
    if (!user) return redirect('/login');
    if ((user as any).emailVerified) return redirect('/profile');

    const temp = signTempToken({ id: user.id, purpose: 'verify-email' }, '6h');
    const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';
    const verifyUrl = new URL(`/verify/${temp}`, site).toString();

  await sendMail({ to: user.email, subject: '이메일 확인 안내', html: `<p>아래 링크를 눌러 이메일을 확인하세요:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>` });

  const { setFlash } = await import('../../lib/flash');
  setFlash('verify-sent', 10);
    return redirect('/profile');
  }

  // read flash cookie (set by server actions)
  const flash = cookies().get('flash')?.value || null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* flash banners */}
      {flash === 'verify-sent' ? (
        <div className="mb-4 p-3 rounded bg-green-50 border text-sm text-green-800">확인 메일을 전송했습니다. 메일함을 확인하세요.</div>
      ) : null}
      {flash === 'need-verify' ? (
        <div className="mb-4 p-3 rounded bg-yellow-50 border text-sm text-yellow-800">게시물 작성은 이메일 확인이 필요합니다. 아래에서 확인 메일을 재발송하세요.</div>
      ) : null}
      <h1 className="text-2xl font-bold mb-4">내 프로필</h1>

  <form action={updateProfileAction} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-slate-700">이름</label>
          <input name="name" defaultValue={user.name ?? ''} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">이메일</label>
          <input name="email" defaultValue={user.email} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <hr />

        <p className="text-sm text-slate-600">비밀번호 변경 (원하면 아래 입력)</p>
        <div>
          <label className="block text-sm font-medium text-slate-700">현재 비밀번호</label>
          <input name="currentPassword" type="password" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">새 비밀번호</label>
          <input name="newPassword" type="password" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">새 비밀번호 확인</label>
          <input name="confirmNewPassword" type="password" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">저장</button>
        </div>
      </form>

  {/* Email verification area */}
  {!((user as any).emailVerified) ? (
        <div className="mt-6 p-4 border rounded bg-yellow-50">
          <p className="text-sm">이메일이 확인되지 않았습니다. 확인 메일을 다시 받으시려면 아래 버튼을 클릭하세요.</p>
          <form action={resendVerificationAction} className="mt-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">확인 메일 재발송</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
