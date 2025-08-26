import { getUserFromToken } from '../../lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export default async function MessagesPage() {
  const token = cookies().get('token')?.value || null;
  const me = await getUserFromToken(token);
  if (!me) return (
    <div className="max-w-3xl mx-auto">
      <p>로그인이 필요합니다. <Link href="/login">로그인</Link></p>
    </div>
  );

  // check for success cookie set by compose action
  const msgSuccess = cookies().get('msg_success')?.value;
  if (msgSuccess) {
    // clear the cookie
  const { clearFlash } = await import('../../lib/flash');
  clearFlash();
  }

  // prisma client may not have generated precise typings here in this workspace snapshot;
  // cast to any to avoid TS build errors while preserving runtime behavior.
  const messages = await (prisma as any).message.findMany({ where: { receiverId: me.id }, orderBy: { createdAt: 'desc' }, include: { sender: true } });

  async function markReadAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const token = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(token);
    if (!meUser) return;
    await (prisma as any).message.update({ where: { id }, data: { read: true } });
    const { redirect } = await import('next/navigation');
    redirect('/messages');
  }

  async function deleteMessageAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const token = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(token);
    if (!meUser) return;
    await (prisma as any).message.delete({ where: { id } });
    const { redirect } = await import('next/navigation');
    redirect('/messages');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">쪽지함</h1>
      {msgSuccess && (
        <div className="p-3 bg-green-100 text-green-800 rounded">쪽지가 성공적으로 전송되었습니다.</div>
      )}
      <Link href="/messages/compose" className="text-sm text-blue-600">쪽지쓰기</Link>
      <ul className="space-y-4">
  {messages.map((m: any) => (
          <li key={m.id} className="p-4 border rounded">
            <div className="flex justify-between items-start">
              <div className="text-sm text-slate-600">보낸이: {m.sender?.email || '익명'} • {new Date(m.createdAt).toLocaleString('ko-KR')}</div>
              <div className="flex gap-2">
                {!m.read && (
                  <form action={markReadAction} method="post">
                    <input type="hidden" name="id" value={String(m.id)} />
                    <button className="text-sm px-2 py-1 bg-yellow-400 rounded">읽음표시</button>
                  </form>
                )}
                <form action={deleteMessageAction} method="post">
                  <input type="hidden" name="id" value={String(m.id)} />
                  <button className="text-sm px-2 py-1 bg-red-500 text-white rounded">삭제</button>
                </form>
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap">{m.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
