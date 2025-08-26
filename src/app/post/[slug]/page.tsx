import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { buildCanonical, jsonLdArticle } from '../../../lib/seo';
import dynamicImport from 'next/dynamic';

const CopyButton = dynamicImport(() => import('../../../components/CopyButton'), { ssr: false });
import { cookies } from 'next/headers';
import { getUserFromToken } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

interface Props { params: { slug: string } }

// 새로 생성된 글이 즉시 접근 가능하도록 동적 렌더 강제
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await prisma.post.findMany({ where: { published: true }, select: { slug: true } });
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const post = await prisma.post.findUnique({ where: { slug }, include: { tags: { include: { tag: true } } } });
  if (!post || !post.published) return {};
  const url = `/post/${post.slug}`;
  return {
    title: post.title,
    description: post.description || post.content.slice(0, 140),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      url
    },
    twitter: {
      card: 'summary'
    }
  };
}

export const revalidate = 300; // 5분

type PostWithTags = {
  id: number; title: string; slug: string; description: string | null; content: string; published: boolean; views: number; createdAt: Date; updatedAt: Date; authorId?: number | null;
  tags: { tag: { name: string } }[];
};

export default async function PostPage({ params }: Props) {
  console.log('[POST PAGE] incoming slug =', params.slug);
  const slug = decodeURIComponent(params.slug);
  console.log('[POST PAGE] decoded slug =', slug);
  const post = await prisma.post.findUnique({ where: { slug }, include: { tags: { include: { tag: true } } } }) as PostWithTags | null;
  if (!post) {
    console.log('[POST PAGE] not found in DB');
    notFound();
  }
  if (!post.published) {
    console.log('[POST PAGE] unpublished post slug=', post.slug);
    notFound();
  }
  console.log('[POST PAGE] loaded post id=', post.id, 'slug=', post.slug);

  // determine if current viewer is the author or admin
  let isAuthor = false;
  let isAdmin = false;
  try {
    const token = cookies().get('token')?.value || null;
    const user = await getUserFromToken(token);
    const adminEmails = (process.env.ADMIN_EMAILS || 'dksgytjd07@gmail.com').split(',').map((s) => s.trim().toLowerCase());
    if (user) {
      if (user.id === post.authorId) isAuthor = true;
      if (user.email && adminEmails.includes(user.email.toLowerCase())) isAdmin = true;
    }
  } catch (err) {
    isAuthor = false;
    isAdmin = false;
  }

  const jsonLd = jsonLdArticle(post);

  return (
    <article className="prose max-w-none">
      <h1>{post.title}</h1>
      <p className="text-sm text-slate-500">{new Date(post.createdAt).toLocaleString('ko-KR')}</p>
      <div className="my-4 flex gap-2 text-xs">
        {post.tags.map(pt => (
          <a key={pt.tag.name} href={`/tag/${encodeURIComponent(pt.tag.name)}`} className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 no-underline">#{pt.tag.name}</a>
        ))}
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
      <hr />
      <div className="text-sm flex gap-3 items-center">
        <span>공유:</span>
        <a target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(buildCanonical('/post/' + post.slug))}&text=${encodeURIComponent(post.title)}`}>X</a>
        <a target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildCanonical('/post/' + post.slug))}`}>Facebook</a>
        <a target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(buildCanonical('/post/' + post.slug))}`}>LinkedIn</a>
  {/* client component for clipboard */}
  <CopyButton text={buildCanonical('/post/' + post.slug)} />
      </div>
      {(isAuthor || isAdmin) && (
        <div className="flex gap-2 mt-4">
          <a href={`/post/${post.slug}/edit`} className="px-3 py-2 bg-yellow-500 text-white rounded">수정</a>
          <form action={async (formData: FormData) => {
            'use server';
            // re-check user inside server action
            const token = cookies().get('token')?.value || null;
            const user = await getUserFromToken(token);
            const adminEmails = (process.env.ADMIN_EMAILS || 'dksgytjd07@gmail.com').split(',').map((s) => s.trim().toLowerCase());
            const allowed = user && (user.id === post.authorId || (user.email && adminEmails.includes(user.email.toLowerCase())));
            if (!allowed) return redirect('/');
            // remove many-to-many join rows first to avoid foreign key constraint errors
            await prisma.postTag.deleteMany({ where: { postId: post.id } });
            await prisma.post.delete({ where: { id: post.id } });
            revalidatePath('/');
            return redirect('/');
          }} method="post">
            <button type="submit" className="bg-red-600 text-white px-3 py-2 rounded">삭제</button>
          </form>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
