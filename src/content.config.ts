import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    cat: z.string(),
    date: z.string(),
    excerpt: z.string(),
    label: z.string(),
    bg: z.string().default('#cdd5d8'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
