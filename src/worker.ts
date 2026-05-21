export interface Env {
  ASSETS: Fetcher;
}

const BLOG_HOST = 'blog.kokomasoft.com';

function hasFileExtension(pathname: string) {
  return /\/[^/]+\.[^/]+$/.test(pathname);
}

function blogAssetRequest(request: Request) {
  const url = new URL(request.url);

  if (url.hostname !== BLOG_HOST) {
    return request;
  }

  if (url.pathname === '/') {
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

export default {
  fetch(request: Request, env: Env) {
    return env.ASSETS.fetch(blogAssetRequest(request));
  },
};
