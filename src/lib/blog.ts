import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'medium-digest'>;
export type BlogCategory = 'ai' | 'knowledge' | 'developer';

export const blogCategoryMeta: Record<BlogCategory, { label: string; eyebrow: string; description: string }> = {
  ai: {
    label: 'AI 글',
    eyebrow: 'Daily AI Digest',
    description: 'AI, 코딩 에이전트, Claude Code, Codex, OpenClaw 흐름에서 읽을 가치가 큰 글을 정리합니다.',
  },
  knowledge: {
    label: '오늘의 지식',
    eyebrow: 'Daily Knowledge',
    description: '고전, 과학, 예술, 문화, 기술 등 현대의 지적인 사람이 알아두면 좋은 주제를 엄선합니다.',
  },
  developer: {
    label: '개발 지식',
    eyebrow: 'Developer Knowledge',
    description: 'CS, 아키텍처, 보안, 성능, 데이터베이스 등 소프트웨어 개발자가 실무에서 알아야 할 지식을 정리합니다.',
  },
};

export async function getMediumDigestPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('medium-digest');
  return posts.sort(
    (a, b) =>
      new Date(b.data.pubDate).getTime() -
      new Date(a.data.pubDate).getTime(),
  );
}

export function getBlogPostSlug(post: BlogPost) {
  return post.data.canonicalSlug ?? post.id.replace(/\.md$/, '');
}

export function getBlogPostCategory(post: BlogPost): BlogCategory {
  const slug = getBlogPostSlug(post);
  if (slug.startsWith('developer-knowledge-') || post.data.tags?.includes('개발자가 알아야 할 지식')) {
    return 'developer';
  }
  if (slug.startsWith('knowledge-') || post.data.tags?.includes('오늘의 지식')) {
    return 'knowledge';
  }
  return 'ai';
}

export async function getMediumDigestPost(slug: string) {
  const posts = await getMediumDigestPosts();
  return posts.find((post) => getBlogPostSlug(post) === slug);
}
