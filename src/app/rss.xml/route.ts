import { prisma } from '../../lib/prisma';
import { absoluteUrl } from '../../lib/seo';

export const revalidate = 600;

export async function GET() {
  const posts = await prisma.post.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 50 });
  const items = posts.map(p => `  <item>\n    <title><![CDATA[${p.title}]]></title>\n    <link>${absoluteUrl('/post/' + p.slug)}</link>\n    <guid>${absoluteUrl('/post/' + p.slug)}</guid>\n    <pubDate>${p.createdAt.toUTCString()}</pubDate>\n    <description><![CDATA[${p.description || p.content.slice(0,180)}]]></description>\n  </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version=\"2.0\">\n<channel>\n  <title>SEO Board RSS</title>\n  <link>${absoluteUrl('/')}</link>\n  <description>최근 게시물 피드</description>\n${items}\n</channel>\n</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
