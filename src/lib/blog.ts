export interface BlogPostFrontmatter {
  title: string;
  description: string;
  pubDate: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceAuthor?: string;
  tags?: string[];
  hero?: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  Content: unknown;
}

const modules = import.meta.glob<{
  frontmatter: BlogPostFrontmatter;
  Content: unknown;
}>('../content/medium-digest/*.md', { eager: true });

export function getMediumDigestPosts(): BlogPost[] {
  return Object.entries(modules)
    .map(([path, post]) => ({
      slug: path.split('/').pop()?.replace(/\.md$/, '') ?? '',
      frontmatter: post.frontmatter,
      Content: post.Content,
    }))
    .sort(
      (a, b) =>
        new Date(b.frontmatter.pubDate).getTime() -
        new Date(a.frontmatter.pubDate).getTime(),
    );
}

export function getMediumDigestPost(slug: string) {
  return getMediumDigestPosts().find((post) => post.slug === slug);
}
