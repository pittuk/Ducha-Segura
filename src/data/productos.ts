import data from './productos.json';

export type Grupo = 'rebaje' | 'kit' | 'accesorio';

export interface Producto {
  id: string;
  slug: string;            // coincide con el slug de WooCommerce → /producto/<slug>/
  name: string;
  grupo: Grupo;
  price: number;           // 0 = a medida / a consultar
  regularPrice: number | null;
  salePrice: number | null;
  shortDescription: string;
  descriptionHtml: string;
  image: string;
  images: string[];
  priceLabel?: string;     // ej. "A medida" cuando no hay precio fijo
  featured?: boolean;      // tarjeta destacada (banner ancho)
  custom?: boolean;        // no proviene de WooCommerce
}

// Imágenes curadas para rebajes (elegidas por el cliente; mejores que las de WC).
const IMG_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-tradicional': '/images/rebajes/Rebaje Tina Tradicional.webp',
  'rebaje-de-tina-jacuzzi': '/images/rebajes/Rebaje Tina Jacuzzi.webp',
};

// Renombrar el nombre VISIBLE (no el slug, que está indexado). Sobrevive a re-importar de WC.
const NAME_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-jacuzzi': 'Rebaje de tina: Hidromasaje',
};

const wc: Producto[] = (data as Producto[]).map((p) => ({
  ...p,
  name: NAME_OVERRIDE[p.slug] ?? p.name,
  image: IMG_OVERRIDE[p.slug] ?? p.image,
}));

export const PRODUCTOS: Producto[] = [...wc];

export const REBAJES = PRODUCTOS.filter((p) => p.grupo === 'rebaje');
export const KITS = PRODUCTOS.filter((p) => p.grupo === 'kit');
export const ACCESORIOS = PRODUCTOS.filter((p) => p.grupo === 'accesorio');

export const getProducto = (slug: string): Producto | undefined =>
  PRODUCTOS.find((p) => p.slug === slug);
