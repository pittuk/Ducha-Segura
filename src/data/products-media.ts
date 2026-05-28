import type { ImageMetadata } from 'astro';
import tradicional from '../assets/productos/rebaje-tradicional.png';
import jacuzzi from '../assets/productos/rebaje-jacuzzi.webp';
import spa from '../assets/productos/rebaje-spa.webp';

export interface ProductMedia {
  src: ImageMetadata;
  fit: 'contain' | 'cover';
  alt: string;
}

// Mapa id de producto → imagen. Importa assets, por eso vive aparte de
// products.ts (que debe quedar libre de imports de imágenes para Vitest).
export const PRODUCT_MEDIA: Record<string, ProductMedia> = {
  tradicional: {
    src: tradicional,
    fit: 'contain',
    alt: 'Pieza de rebaje de tina Ducha Segura, vista de producto',
  },
  jacuzzi: {
    src: jacuzzi,
    fit: 'cover',
    alt: 'Antes y después: rebaje instalado en una tina jacuzzi',
  },
  spa: {
    src: spa,
    fit: 'cover',
    alt: 'Tina grande con rebaje de acceso instalado',
  },
};
