export interface Env {
  ASSETS: Fetcher;
}

const BLOG_HOST = 'blog.kokomasoft.com';
const MYTUBE_HOST = 'mytube.kokomasoft.com';
const MYTUBE_API_BASE = 'https://mytube-api.kueen108.workers.dev/api';

function hasFileExtension(pathname: string) {
  return /\/[^/]+\.[^/]+$/.test(pathname);
}


function mainSiteRedirect(url: URL) {
  const target = new URL(url.pathname + url.search + url.hash, 'https://www.kokomasoft.com');
  return Response.redirect(target.href, 301);
}

function isMainSitePath(pathname: string) {
  return /^\/(ko|en|zh|ja|sns-publisher)(\/|$)/.test(pathname);
}

function blogRobotsResponse() {
  return new Response('User-agent: *\nAllow: /\n\nSitemap: https://blog.kokomasoft.com/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function myTubeRobotsResponse() {
  return new Response('User-agent: *\nAllow: /\n\nSitemap: https://mytube.kokomasoft.com/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function myTubeSitemapResponse() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mytube.kokomasoft.com/</loc>
    <lastmod>2026-05-25</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

function blogAssetRequest(request: Request) {
  const url = new URL(request.url);

  if (url.hostname !== BLOG_HOST) {
    return request;
  }

  if (url.pathname === '/sitemap.xml') {
    url.pathname = '/blog/sitemap.xml';
  } else if (url.pathname === '/') {
    url.pathname = '/blog/';
  } else if (
    !url.pathname.startsWith('/blog/') &&
    !url.pathname.startsWith('/_astro/') &&
    !hasFileExtension(url.pathname)
  ) {
    url.pathname = `/blog${url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`}`;
  }

  return new Request(url, request);
}

function myTubeAssetRequest(request: Request) {
  const url = new URL(request.url);

  if (url.hostname !== MYTUBE_HOST) {
    return request;
  }

  if (
    url.pathname === '/' ||
    (!url.pathname.startsWith('/mytube/') &&
      !url.pathname.startsWith('/_astro/') &&
      !hasFileExtension(url.pathname))
  ) {
    url.pathname = '/mytube/';
  }

  return new Request(url, request);
}

async function myTubeApiProxy(request: Request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Only GET is supported' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const apiPath = url.pathname.slice('/api'.length);
  const target = `${MYTUBE_API_BASE}${apiPath}${url.search}`;
  const upstream = await fetch(target, {
    headers: {
      Accept: request.headers.get('Accept') || 'application/json',
    },
  });
  const headers = new Headers(upstream.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Vary', 'Accept-Encoding');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function forceHtmlResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Content-Disposition', 'inline');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.hostname === MYTUBE_HOST) {
      if (url.pathname === '/robots.txt') {
        return myTubeRobotsResponse();
      }
      if (url.pathname === '/sitemap.xml') {
        return myTubeSitemapResponse();
      }
      if (url.pathname.startsWith('/api/')) {
        return myTubeApiProxy(request);
      }
    }

    if (url.hostname === BLOG_HOST) {
      if (url.pathname === '/robots.txt') {
        return blogRobotsResponse();
      }
      if (isMainSitePath(url.pathname)) {
        return mainSiteRedirect(url);
      }
    }

    const assetRequest = myTubeAssetRequest(blogAssetRequest(request));
    const response = await env.ASSETS.fetch(assetRequest);

    if ((url.hostname === BLOG_HOST || url.hostname === MYTUBE_HOST) && !hasFileExtension(url.pathname)) {
      return forceHtmlResponse(response);
    }

    return response;
  },
};
