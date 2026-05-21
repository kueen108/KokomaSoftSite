export interface Env {
  ASSETS: Fetcher;
}

const BLOG_HOST = 'blog.kokomasoft.com';

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

function forceHtmlResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.delete('Content-Disposition');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.hostname === BLOG_HOST) {
      if (url.pathname === '/robots.txt') {
        return blogRobotsResponse();
      }
      if (isMainSitePath(url.pathname)) {
        return mainSiteRedirect(url);
      }
    }

    const assetRequest = blogAssetRequest(request);
    const response = await env.ASSETS.fetch(assetRequest);

    if (url.hostname === BLOG_HOST && !hasFileExtension(url.pathname)) {
      return forceHtmlResponse(response);
    }

    return response;
  },
};
