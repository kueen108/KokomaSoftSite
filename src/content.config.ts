import { defineCollection, z } from 'astro:content';

const mediumDigest = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    canonicalSlug: z.string().optional(),
    description: z.string(),
    pubDate: z.string(),
    sourceTitle: z.string(),
    sourceUrl: z.string().url(),
    sourceAuthor: z.string().optional(),
    duplicateSimilarityThreshold: z.number().min(0).max(1).optional(),
    tags: z.array(z.string()).optional(),
    hero: z.string().optional(),
  }),
});

export const collections = {
  'medium-digest': mediumDigest,
};
