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

const wc: Producto[] = (data as Producto[]).map((p) => ({
  ...p,
  image: IMG_OVERRIDE[p.slug] ?? p.image,
}));

// Spa XL: no existe en WooCommerce. Producto a medida, con su propia ficha.
const spaXl: Producto = {
  id: 'spa-xl',
  slug: 'rebaje-de-tina-spa-xl',
  name: 'Rebaje de tina: Spa XL',
  grupo: 'rebaje',
  price: 0,
  regularPrice: null,
  salePrice: null,
  priceLabel: 'A medida',
  shortDescription: 'Para tinas grandes, ofuro y spa doméstico. Visita técnica previa y diseño a medida.',
  descriptionHtml: '<p>El <strong>Rebaje de tina Spa XL</strong> está pensado para tinas de gran tamaño, ofuro y spa doméstico, donde la profundidad y el ancho requieren una adaptación especial.</p><p>Por sus dimensiones, cada proyecto parte con una <strong>visita técnica previa</strong> para evaluar la factibilidad y diseñar el rebaje a medida, manteniendo la seguridad y la estética del baño.</p><ul><li>Diseño a medida según tu tina</li><li>Visita técnica previa</li><li>Instalación incluida · garantía 3 años</li></ul>',
  image: '/images/rebajes/Rebaje Tina Spa XL.webp',
  images: ['/images/rebajes/Rebaje Tina Spa XL.webp'],
  featured: true,
  custom: true,
};

export const PRODUCTOS: Producto[] = [...wc, spaXl];

export const REBAJES = PRODUCTOS.filter((p) => p.grupo === 'rebaje');
export const KITS = PRODUCTOS.filter((p) => p.grupo === 'kit');
export const ACCESORIOS = PRODUCTOS.filter((p) => p.grupo === 'accesorio');

export const getProducto = (slug: string): Producto | undefined =>
  PRODUCTOS.find((p) => p.slug === slug);
