import NewPostForm from '../../../../components/NewPostForm';
import { prisma } from '../../../../lib/prisma';
import { getUserFromToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const post = await prisma.post.findUnique({ where: { slug }, include: { tags: { include: { tag: true } } } }) as any;
  if (!post) return redirect('/');

  const token = cookies().get('token')?.value || null;
  const user = await getUserFromToken(token);
  const adminEmails = (process.env.ADMIN_EMAILS || 'dksgytjd07@gmail.com').split(',').map((s) => s.trim().toLowerCase());
  const isAdmin = user && user.email && adminEmails.includes(user.email.toLowerCase());
  if (!user || (!(user.id === post.authorId) && !isAdmin)) return redirect('/');

  const initial = {
    title: post.title,
    description: post.description ?? '',
    tags: post.tags.map((t: any) => t.tag.name).join(', '),
    category: post.category || 'GENERAL',
    content: post.content || ''
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">글 수정</h1>
      {/* client form handles PUT via editSlug prop */}
      <NewPostForm defaultCategory={initial.category} initial={initial} editSlug={slug} />
    </div>
  );
}
