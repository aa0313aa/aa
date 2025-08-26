export function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Sitemap: ' + (process.env.SITE_URL || 'http://localhost:3000') + '/sitemap.xml'
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain' } });
}
