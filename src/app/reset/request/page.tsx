import { prisma } from '../../../lib/prisma';
import { signTempToken } from '../../../lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function ResetRequestPage() {
  async function sendResetAction(formData: FormData) {
    'use server';
    const email = (formData.get('email') as string || '').trim();
    if (!email) return redirect('/');
    const user = await prisma.user.findUnique({ where: { email } }) as any;
    if (!user) return redirect('/');

    // create token and store to DB for extra safety
    const token = signTempToken({ id: user.id, t: Date.now() }, '1h');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: token, passwordResetTokenExpiry: expiry } as any });

    try {
      const { sendMail } = await import('../../../lib/mailer');
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset/${token}`;
      await sendMail({ to: user.email, subject: '[SEO Board] 비밀번호 재설정', html: `<p>다음 링크로 비밀번호를 재설정하세요:</p><p><a href="${url}">${url}</a></p>` });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PW RESET] sendMail failed', e);
    }

    // redirect back to login with notice (could set cookie for flash)
    return redirect('/login');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">비밀번호 재설정 요청</h1>
      <p className="text-sm text-slate-500 mb-4">이메일을 입력하면 비밀번호 재설정 링크를 이메일로 전송합니다 (개발환경에서는 서버 콘솔에 링크가 출력됩니다).</p>
      <form action={sendResetAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input name="email" type="email" required className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="flex items-center justify-end">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">링크 전송</button>
        </div>
      </form>
    </div>
  );
}
