import { prisma } from '../../../lib/prisma';
import { verifyTempToken, signTempToken } from '../../../lib/auth';
import { redirect } from 'next/navigation';

interface Props { params: { token: string } }

export default function ResetTokenPage({ params }: Props) {
  const token = params.token;

  async function resetAction(formData: FormData) {
    'use server';
    const pw = (formData.get('password') as string || '').trim();
    const pw2 = (formData.get('passwordConfirm') as string || '').trim();
    if (!pw || pw !== pw2) return redirect('/');

    // validate token against DB and temp token
  const record = await (prisma as any).user.findFirst({ where: { passwordResetToken: token } }) as any;
    if (!record) return redirect('/');
  if (record.passwordResetTokenExpiry && new Date(record.passwordResetTokenExpiry) < new Date()) return redirect('/');

    const decoded = verifyTempToken(token as string) as any;
    if (!decoded?.id || Number(decoded.id) !== record.id) return redirect('/');

    // hash password via import to avoid circular
    const { hashPassword } = await import('../../../lib/auth');
    const hashed = await hashPassword(pw);
  await (prisma as any).user.update({ where: { id: record.id }, data: { password: hashed, passwordResetToken: null, passwordResetTokenExpiry: null } as any });
    return redirect('/login');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">비밀번호 재설정</h1>
      <form action={resetAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호</label>
          <input name="password" type="password" required minLength={8} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
          <input name="passwordConfirm" type="password" required minLength={8} className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="flex items-center justify-end">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">비밀번호 변경</button>
        </div>
      </form>
    </div>
  );
}
