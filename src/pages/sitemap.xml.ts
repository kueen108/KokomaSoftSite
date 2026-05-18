import { apps } from '../i18n/apps';
import type { Lang } from '../i18n/translations';
import { ungyeolServiceAlternates, ungyeolServiceIds, ungyeolServicePath } from '../i18n/ungyeolServices';
import {
  absoluteUrl,
  accountDeletionAlternates,
  appAlternates,
  homeAlternates,
  languageCodes,
  privacyAlternates,
} from '../lib/seo';

interface SitemapPage {
  path: string;
  alternates: Partial<Record<Lang, string>>;
  xDefaultPath: string;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const lastmod = '2026-05-18';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderUrl(page: SitemapPage) {
  const alternateLinks = [
    ...Object.entries(page.alternates).map(
      ([lang, path]) =>
        `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(absoluteUrl(path))}" />`,
    ),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(page.xDefaultPath))}" />`,
  ].join('\n    ');

  return `<url>
    <loc>${escapeXml(absoluteUrl(page.path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    ${alternateLinks}
  </url>`;
}

export function GET() {
  const homePaths = homeAlternates();
  const pages: SitemapPage[] = [
    {
      path: '/',
      alternates: homePaths,
      xDefaultPath: '/',
      changefreq: 'weekly',
      priority: '1.0',
    },
    ...languageCodes.map((lang) => ({
      path: homePaths[lang],
      alternates: homePaths,
      xDefaultPath: '/',
      changefreq: 'weekly' as const,
      priority: lang === 'ko' ? '0.9' : '0.8',
    })),
    {
      path: '/tiktok/terms/',
      alternates: {},
      xDefaultPath: '/tiktok/terms/',
      changefreq: 'yearly',
      priority: '0.4',
    },
    {
      path: '/tiktok/privacy/',
      alternates: {},
      xDefaultPath: '/tiktok/privacy/',
      changefreq: 'yearly',
      priority: '0.4',
    },
    ...apps.flatMap((app) => {
      const paths = appAlternates(app.id);
      return languageCodes.map((lang) => ({
        path: paths[lang],
        alternates: paths,
        xDefaultPath: paths.ko,
        changefreq: 'monthly' as const,
        priority: '0.8',
      }));
    }),
    ...ungyeolServiceIds.flatMap((serviceId) => {
      const paths = ungyeolServiceAlternates(serviceId);
      return languageCodes.map((lang) => ({
        path: ungyeolServicePath(lang, serviceId),
        alternates: paths,
        xDefaultPath: paths.ko,
        changefreq: 'weekly' as const,
        priority: lang === 'ko' ? '0.85' : '0.75',
      }));
    }),
    ...apps.flatMap((app) => {
      const paths = privacyAlternates(app.id);
      return languageCodes.map((lang) => ({
        path: paths[lang],
        alternates: paths,
        xDefaultPath: paths.ko,
        changefreq: 'yearly' as const,
        priority: '0.5',
      }));
    }),
    ...apps
      .filter((app) => app.supportsAccountDeletion)
      .flatMap((app) => {
        const paths = accountDeletionAlternates(app.id);
        return languageCodes.map((lang) => ({
          path: paths[lang],
          alternates: paths,
          xDefaultPath: paths.ko,
          changefreq: 'yearly' as const,
          priority: '0.5',
        }));
      }),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${pages.map(renderUrl).join('\n  ')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
