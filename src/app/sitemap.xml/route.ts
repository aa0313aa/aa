import { prisma } from '../../lib/prisma';
import { absoluteUrl } from '../../lib/seo';

export const revalidate = 600; // 10분

export async function GET() {
  const posts = await prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
  const urls = posts.map(p => `  <url>\n    <loc>${absoluteUrl('/post/' + p.slug)}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${absoluteUrl('/')}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </url>\n${urls}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
