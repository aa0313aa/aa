import { prisma } from '../../../lib/prisma';
import { getUserFromToken } from '../../../lib/auth';
import { cookies } from 'next/headers';

export default async function AdminMessagesPage() {
  const token = cookies().get('token')?.value || null;
  const me = await getUserFromToken(token);
  if (!me || !(me as any).isAdmin) {
    const { redirect } = await import('next/navigation');
    return redirect('/');
  }

  const messages = await (prisma as any).message.findMany({ include: { sender: true, receiver: true }, orderBy: { createdAt: 'desc' } });

  async function deleteMessageAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const token = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(token);
    if (!meUser || !(meUser as any).isAdmin) {
      const { redirect } = await import('next/navigation');
      return redirect('/');
    }
    await (prisma as any).message.delete({ where: { id } });
    const { redirect } = await import('next/navigation');
    redirect('/admin/messages');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">관리자 - 쪽지 관리</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">ID</th>
            <th className="py-2">보낸이</th>
            <th className="py-2">받는이</th>
            <th className="py-2">내용</th>
            <th className="py-2">읽음</th>
            <th className="py-2">시간</th>
            <th className="py-2">관리</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m: any) => (
            <tr key={m.id} className="border-b">
              <td className="py-2">{m.id}</td>
              <td className="py-2">{m.sender?.email}</td>
              <td className="py-2">{m.receiver?.email}</td>
              <td className="py-2">{m.content.slice(0, 120)}</td>
              <td className="py-2">{m.read ? 'Y' : 'N'}</td>
              <td className="py-2">{new Date(m.createdAt).toLocaleString('ko-KR')}</td>
              <td className="py-2">
                <form action={deleteMessageAction} method="post">
                  <input type="hidden" name="id" value={String(m.id)} />
                  <button className="px-2 py-1 bg-red-600 text-white rounded">삭제</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
