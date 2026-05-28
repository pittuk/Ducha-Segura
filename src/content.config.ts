import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    cat: z.string(),
    date: z.string(),
    pubdate: z.string().optional(),       // ISO, para ordenar por fecha real
    excerpt: z.string(),
    seoDescription: z.string().optional(), // meta description (Yoast)
    image: z.string().optional(),          // ruta local de la imagen destacada
    label: z.string().default(''),         // placeholder legacy (fallback sin imagen)
    bg: z.string().default('#cdd5d8'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
