import { getBlogPostSlug, getMediumDigestPosts } from '../../lib/blog';

const BLOG_URL = 'https://blog.kokomasoft.com';
const blogIndexLastmod = import.meta.env.PUBLIC_BLOG_LASTMOD ?? new Date().toISOString().slice(0, 10);

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function blogUrl(path: string) {
  return new URL(path, BLOG_URL).href;
}

function renderUrl(path: string, lastmod: string, changefreq: 'daily' | 'weekly', priority: string) {
  return `<url>
    <loc>${escapeXml(blogUrl(path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const posts = await getMediumDigestPosts();
  const urls = [
    renderUrl('/', blogIndexLastmod, 'daily', '0.9'),
    ...posts.map((post) =>
      renderUrl(`/${getBlogPostSlug(post)}/`, post.data.pubDate, 'weekly', '0.8'),
    ),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('\n  ')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
