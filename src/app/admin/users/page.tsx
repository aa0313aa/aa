import { prisma } from '../../../lib/prisma';
import { getUserFromToken } from '../../../lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default async function AdminUsersPage() {
  const token = cookies().get('token')?.value || null;
  // debug logs only when DEBUG_ADMIN env var is set
  const DEBUG_ADMIN = process.env.DEBUG_ADMIN === 'true';
  if (DEBUG_ADMIN) {
    // eslint-disable-next-line no-console
    console.debug('[ADMIN DEBUG] incoming token:', token);
  }
  const me = await getUserFromToken(token);
  if (DEBUG_ADMIN) {
    // eslint-disable-next-line no-console
    console.debug('[ADMIN DEBUG] resolved me:', me);
  }
  if (!me || !(me as any).isAdmin) return redirect('/');

  // simple search & paging
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  // read search params from runtime environment via headers
  const q = (typeof globalThis !== 'undefined' && (globalThis as any).location?.searchParams?.get('q')) || null;
  // fallback: check cookies/search not easily available here; implement simple list for now
  const pageSize = 20;
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: pageSize });

  async function toggleAdminAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const meToken = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(meToken);
    if (!meUser || !(meUser as any).isAdmin) return redirect('/');
  const target = await prisma.user.findUnique({ where: { id } }) as any;
  if (!target) return redirect('/admin/users');
  await prisma.user.update({ where: { id }, data: { isAdmin: !target.isAdmin } as any });
    return redirect('/admin/users');
  }

  async function deleteUserAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const meToken = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(meToken);
    if (!meUser || !(meUser as any).isAdmin) return redirect('/');
    // unlink posts by setting authorId to null first
    await prisma.post.updateMany({ where: { authorId: id }, data: { authorId: null } });
    await prisma.user.delete({ where: { id } });
    return redirect('/admin/users');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">관리자 - 회원 관리</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">ID</th>
            <th className="py-2">이메일</th>
            <th className="py-2">이름</th>
            <th className="py-2">가입일</th>
            <th className="py-2">관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="py-2">{u.id}</td>
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.name}</td>
              <td className="py-2">{new Date(u.createdAt).toLocaleString('ko-KR')}</td>
              <td className="py-2 flex gap-2">
                <form action={toggleAdminAction} method="post">
                  <input type="hidden" name="id" value={String(u.id)} />
                  <button className="px-2 py-1 bg-slate-700 text-white rounded">{(u as any).isAdmin ? '관리자해제' : '관리자지정'}</button>
                </form>
                <form action={deleteUserAction} method="post">
                  <input type="hidden" name="id" value={String(u.id)} />
                  <button className="px-2 py-1 bg-red-600 text-white rounded">삭제</button>
                </form>
                <a href={`/admin/users/${u.id}/posts`} className="px-2 py-1 bg-blue-600 text-white rounded">작성글</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
