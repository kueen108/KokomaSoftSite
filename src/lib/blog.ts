import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'medium-digest'>;

export async function getMediumDigestPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('medium-digest');
  return posts.sort(
    (a, b) =>
      new Date(b.data.pubDate).getTime() -
      new Date(a.data.pubDate).getTime(),
  );
}

export function getBlogPostSlug(post: BlogPost) {
  return post.id.replace(/\.md$/, '');
}

export async function getMediumDigestPost(slug: string) {
  const posts = await getMediumDigestPosts();
  return posts.find((post) => getBlogPostSlug(post) === slug);
}
