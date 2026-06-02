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
  'rebaje-de-tina-jacuzzi': '/images/rebajes/rebaje de tina hidromasaje.jpg',
};

// Renombrar el nombre VISIBLE (no el slug, que está indexado). Sobrevive a re-importar de WC.
const NAME_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-jacuzzi': 'Rebaje de tina: Hidromasaje',
};

// Recategorizar productos (decisión del cliente; sobrevive a re-importar de WC).
const GRUPO_OVERRIDE: Record<string, Grupo> = {
  'juego-de-ducha-2-funciones': 'accesorio',
  'kit-cortina-bano': 'accesorio',
};

const wc: Producto[] = (data as Producto[]).map((p) => ({
  ...p,
  name: NAME_OVERRIDE[p.slug] ?? p.name,
  grupo: GRUPO_OVERRIDE[p.slug] ?? p.grupo,
  image: IMG_OVERRIDE[p.slug] ?? p.image,
}));

// Kits curados (no existen en WooCommerce). ⚠️ PLACEHOLDER: precios e imágenes
// provisionales — reemplazar por los reales cuando el cliente los entregue.
const CURATED: Producto[] = [
  {
    id: 'kit-rebaje-40cm',
    slug: 'kit-rebaje-40cm',
    name: 'Kit Rebaje 40 cm',
    grupo: 'kit',
    price: 99000, // PLACEHOLDER
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje de 40 cm para instalar tú mismo. Incluye manual paso a paso.',
    descriptionHtml: '<p>Kit de rebaje de tina formato <strong>hágalo usted mismo</strong>: incluye la pieza de rebaje de 40 cm en fibra de vidrio reforzada y un manual de instalación paso a paso.</p><p><em>Precio e imagen provisionales — pendiente de actualización.</em></p>',
    image: '/images/kits/kit-rebaje-40cm.svg',
    images: ['/images/kits/kit-rebaje-40cm.svg'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra',
    slug: 'kit-rebaje-40cm-barra',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox',
    grupo: 'kit',
    price: 129000, // PLACEHOLDER
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra de seguridad de acero inoxidable de 40 cm.',
    descriptionHtml: '<p>Incluye la pieza de rebaje de 40 cm y una <strong>barra de seguridad de acero inoxidable de 40 cm</strong> con sus elementos de fijación y guía de montaje.</p><p><em>Precio e imagen provisionales — pendiente de actualización.</em></p>',
    image: '/images/kits/kit-rebaje-40cm-barra.svg',
    images: ['/images/kits/kit-rebaje-40cm-barra.svg'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra-silicona',
    slug: 'kit-rebaje-40cm-barra-silicona',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética',
    grupo: 'kit',
    price: 139000, // PLACEHOLDER
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra inox 40 cm + silicona blanca acética para el sellado.',
    descriptionHtml: '<p>Kit completo: pieza de rebaje de 40 cm, <strong>barra de acero inoxidable de 40 cm</strong> y <strong>silicona blanca acética</strong> para un sellado prolijo y duradero.</p><p><em>Precio e imagen provisionales — pendiente de actualización.</em></p>',
    image: '/images/kits/kit-rebaje-40cm-barra-silicona.svg',
    images: ['/images/kits/kit-rebaje-40cm-barra-silicona.svg'],
    custom: true,
  },
];

export const PRODUCTOS: Producto[] = [...wc, ...CURATED];

export const REBAJES = PRODUCTOS.filter((p) => p.grupo === 'rebaje');
export const KITS = PRODUCTOS.filter((p) => p.grupo === 'kit');
export const ACCESORIOS = PRODUCTOS.filter((p) => p.grupo === 'accesorio');

export const getProducto = (slug: string): Producto | undefined =>
  PRODUCTOS.find((p) => p.slug === slug);
