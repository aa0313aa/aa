import { prisma } from '../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { slugify } from '../../../lib/slugify';
import { revalidatePath } from 'next/cache';
import { getUserFromToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const take = Math.min(Math.max(1, Number(searchParams.get('take')) || 10), 50);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const where = q ? {
    published: true,
    OR: [
      { title: { contains: q } },
      { content: { contains: q } },
      { tags: { some: { tag: { name: { contains: q } } } } }
    ]
  } : { published: true };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip: (page - 1) * take }),
    prisma.post.count({ where }),
  ]);
  return Response.json({ posts, total, page, take });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title: string = body.title?.toString() || '';
  const content: string = body.content?.toString() || '';
  if (!title || !content) return new Response('Missing fields', { status: 400 });

  // authentication: require logged-in user with verified email
  const token = req.cookies.get('token')?.value || null;
  const me = await getUserFromToken(token);
  if (!me) return new Response('Unauthorized', { status: 401 });
  if (!(me as any).emailVerified) return new Response('Email not verified', { status: 403 });
  const slug = slugify(title);
  const post = await prisma.post.create({ data: { title, slug, content, description: body.description?.toString(), authorId: (me as any).id } });
  const tagNames: string[] = Array.isArray(body.tags) ? body.tags.slice(0,8).map((t: any) => String(t).toLowerCase()) : [];
  if (tagNames.length) {
    for (const name of [...new Set(tagNames)]) {
      const tag = await prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
    }
  }
  revalidatePath('/');
  revalidatePath(`/post/${slug}`);
  return Response.json(post, { status: 201 });
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // expect /api/posts/:slug
    const slug = decodeURIComponent(parts.slice(2).join('/'));
    if (!slug) return new Response('Missing slug', { status: 400 });
    const body = await req.json();
    const title: string = body.title?.toString() || '';
    const content: string = body.content?.toString() || '';
    if (!title || !content) return new Response('Missing fields', { status: 400 });
    const token = req.cookies.get('token')?.value || null;
    const me = await getUserFromToken(token);
    if (!me) return new Response('Unauthorized', { status: 401 });
    // find post
    const post = await prisma.post.findUnique({ where: { slug } }) as any;
    if (!post) return new Response('Not found', { status: 404 });
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase());
    const isAdmin = me.email && adminEmails.includes(me.email.toLowerCase());
    if (!(me.id === post.authorId) && !isAdmin) return new Response('Forbidden', { status: 403 });

    // update
    const newSlug = slugify(title);
    await prisma.post.update({ where: { id: post.id }, data: { title, slug: newSlug, content, description: body.description?.toString(), category: body.category?.toString() } as any });
    // tags
    const tagsRaw = Array.isArray(body.tags) ? body.tags.slice(0,8).map((t:any) => String(t).toLowerCase()) : [];
    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    for (const raw of [...new Set(tagsRaw)]) {
      const name = String(raw);
      const tag = await prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
    }
    revalidatePath('/');
    revalidatePath(`/post/${newSlug}`);
    return Response.json({ slug: newSlug }, { status: 200 });
  } catch (e:any) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
