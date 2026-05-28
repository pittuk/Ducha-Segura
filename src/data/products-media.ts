export interface ProductMedia {
  /** Ruta de imagen en public/ (ej. /images/rebajes/...). */
  image: string;
  fit: 'contain' | 'cover';
  alt: string;
}

// Mapa id de producto → imagen real (en public/images/rebajes/).
// Se usa con <img> en ProductCard; si un producto no está aquí, cae al placeholder.
export const PRODUCT_MEDIA: Record<string, ProductMedia> = {
  tradicional: {
    image: '/images/rebajes/Rebaje Tina Tradicional.webp',
    fit: 'cover',
    alt: 'Rebaje de tina tradicional instalado en un baño',
  },
  jacuzzi: {
    image: '/images/rebajes/Rebaje Tina Jacuzzi.webp',
    fit: 'cover',
    alt: 'Tina jacuzzi en un baño, lista para rebaje',
  },
  spa: {
    image: '/images/rebajes/Rebaje Tina Spa XL.webp',
    fit: 'cover',
    alt: 'Rebaje en tina grande tipo spa instalado en un baño',
  },
};
