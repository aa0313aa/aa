import { prisma } from '../../../../../lib/prisma';
import { getUserFromToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function UserPostsPage({ params }: Props) {
  const token = cookies().get('token')?.value || null;
  const me = await getUserFromToken(token);
  if (!me || !(me as any).isAdmin) return redirect('/');

  const userId = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
  if (!user) return redirect('/admin/users');

  const posts = await prisma.post.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' } }) as any;

  async function deletePostAction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const meToken = cookies().get('token')?.value || null;
    const meUser = await getUserFromToken(meToken);
    if (!meUser || !(meUser as any).isAdmin) return redirect('/');
    // delete post and related PostTag rows
    await prisma.postTag.deleteMany({ where: { postId: id } as any }).catch(() => {});
    await prisma.post.delete({ where: { id } });
    return redirect(`/admin/users/${userId}/posts`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">회원 {user.email}의 작성글</h1>
      {posts.length === 0 ? (
        <p>작성한 글이 없습니다.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">ID</th>
              <th className="py-2">제목</th>
              <th className="py-2">카테고리</th>
              <th className="py-2">작성일</th>
              <th className="py-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.id}</td>
                <td className="py-2"><a href={`/post/${encodeURIComponent(p.slug)}`} className="text-blue-600">{p.title}</a></td>
                <td className="py-2">{p.category}</td>
                <td className="py-2">{new Date(p.createdAt).toLocaleString('ko-KR')}</td>
                <td className="py-2">
                  <form action={deletePostAction} method="post">
                    <input type="hidden" name="id" value={String(p.id)} />
                    <button className="px-2 py-1 bg-red-600 text-white rounded">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <a href="/admin/users" className="text-sm text-slate-600">← 회원 목록으로 돌아가기</a>
      </p>
    </div>
  );
}
