import { getUserFromToken } from '../../../lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export default async function ComposePage() {
  const token = cookies().get('token')?.value || null;
  const me = await getUserFromToken(token);
  if (!me) return (
    <div className="max-w-3xl mx-auto">
      <p>로그인이 필요합니다. <Link href="/login">로그인</Link></p>
    </div>
  );

  async function sendMessageAction(formData: FormData) {
    'use server';
    const toEmail = String(formData.get('to'));
    const content = String(formData.get('content'));
    const sender = me as any;
    const receiver = await prisma.user.findUnique({ where: { email: toEmail } }) as any;
    if (!receiver) {
      // simple validation failure; could throw or set cookie
      const { redirect } = await import('next/navigation');
      redirect('/messages/compose?error=no_user');
      return null;
    }
    await (prisma as any).message.create({ data: { senderId: sender.id, receiverId: receiver.id, content } });
    // set a short-lived cookie to show success banner on inbox
  const { setFlash } = await import('../../../lib/flash');
  setFlash('msg-sent', 10);
    const { redirect } = await import('next/navigation');
    redirect('/messages');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">쪽지쓰기</h1>
      <form action={sendMessageAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">받는이 이메일</label>
          <input name="to" className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">내용</label>
          <textarea name="content" rows={6} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded">전송</button>
        </div>
      </form>
    </div>
  );
}
