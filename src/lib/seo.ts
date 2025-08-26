export function absoluteUrl(path: string = ''): string {
  const base = process.env.SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

export function buildCanonical(path: string): string {
  return absoluteUrl(path);
}

export function jsonLdArticle(post: { title: string; slug: string; description?: string | null; createdAt: Date; updatedAt: Date; }): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description || undefined,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: buildCanonical(`/post/${post.slug}`),
  };
}
