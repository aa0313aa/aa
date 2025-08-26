import { prisma } from '../lib/prisma';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 60; // ISR for list

export const metadata: Metadata = {
  alternates: { canonical: '/' }
};

export default async function Home({ searchParams }: { searchParams: { page?: string; category?: string } }) {
  const page = Number(searchParams.page) > 0 ? Number(searchParams.page) : 1;
  const category = searchParams.category || '';
  const pageSize = 10;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
  select: { id: true, title: true, slug: true, description: true, createdAt: true }
    }),
    prisma.post.count({ where: { published: true, ...(category ? { category } : {}) } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="space-y-8">
      <section>
        <nav className="flex gap-3 mb-4">
          <a className={`px-3 py-1 rounded ${category === '' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/">전체</a>
          <a className={`px-3 py-1 rounded ${category === 'CREDIT_CARD' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/?category=CREDIT_CARD">신용카드현금화정보</a>
          <a className={`px-3 py-1 rounded ${category === 'MOBILE_CHARGE' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/?category=MOBILE_CHARGE">휴대폰결제 정보</a>
          <a className={`px-3 py-1 rounded ${category === 'LOAN' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/?category=LOAN">대출정보</a>
          <a className={`px-3 py-1 rounded ${category === 'SCAM' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/?category=SCAM">사기공유</a>
          <a className={`px-3 py-1 rounded ${category === 'GENERAL' ? 'bg-slate-900 text-white' : 'bg-white'}`} href="/?category=GENERAL">기타</a>
        </nav>
      </section>
      <section>
        <h1 className="text-2xl font-bold mb-2">최신 글</h1>
        <p className="text-sm text-slate-600">검색 친화적 구조 & 구조화 데이터 포함</p>
      </section>
      <ul className="space-y-4">
        {posts.map(p => (
          <li key={p.id} className="border rounded-md p-4 bg-white shadow-sm">
            <h2 className="font-semibold text-lg"><Link href={`/post/${p.slug}`}>{p.title}</Link></h2>
            <p className="text-sm text-slate-600 line-clamp-2">{p.description}</p>
            <time className="block mt-1 text-xs text-slate-400" dateTime={p.createdAt.toISOString()}>{p.createdAt.toLocaleDateString('ko-KR')}</time>
          </li>
        ))}
      </ul>
  <nav className="flex gap-2 items-center justify-center pt-4 text-sm">
        {page > 1 && (
          <>
            <Link href={`/?page=1${category ? `&category=${category}` : ''}`} className="px-3 py-1 border rounded">처음</Link>
            <Link href={`/?page=${page-1}${category ? `&category=${category}` : ''}`} rel="prev" className="px-3 py-1 border rounded">이전</Link>
          </>
        )}

        {/* numbered window */}
        {(() => {
          const windowSize = 5;
          const half = Math.floor(windowSize / 2);
          let start = Math.max(1, page - half);
          let end = Math.min(totalPages, page + half);
          if (end - start + 1 < windowSize) {
            start = Math.max(1, Math.min(start, totalPages - windowSize + 1));
            end = Math.min(totalPages, start + windowSize - 1);
          }
          const nodes = [] as any[];
          for (let p = start; p <= end; p++) {
            nodes.push(
              <Link key={p} href={`/?page=${p}${category ? `&category=${category}` : ''}`} className={`px-3 py-1 border rounded ${p === page ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                {p}
              </Link>
            );
          }
          return nodes;
        })()}

        {page < totalPages && (
          <>
            <Link href={`/?page=${page+1}${category ? `&category=${category}` : ''}`} rel="next" className="px-3 py-1 border rounded">다음</Link>
            <Link href={`/?page=${totalPages}${category ? `&category=${category}` : ''}`} className="px-3 py-1 border rounded">마지막</Link>
          </>
        )}

        <span className="ml-2">{page} / {totalPages}</span>
        {/* page jump form */}
        <form method="get" className="ml-4 flex items-center gap-2">
          <label htmlFor="page-jump" className="sr-only">페이지 이동</label>
          <input id="page-jump" name="page" type="number" min={1} max={totalPages} defaultValue={page} className="w-20 px-2 py-1 border rounded text-sm" />
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit" className="px-3 py-1 border rounded text-sm">이동</button>
        </form>
      </nav>
    </div>
  );
}
