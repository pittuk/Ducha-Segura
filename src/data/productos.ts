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
// (El rebaje de jacuzzi conserva el nombre "Jacuzzi" del JSON; no se sobrescribe.)
const NAME_OVERRIDE: Record<string, string> = {
  'barra-de-cromada-40cm': 'Barra cromada 40cm',
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

// Kits curados (no existen en WooCommerce). Imágenes reales. Precios reales entregados por el cliente.
const CURATED: Producto[] = [
  {
    id: 'kit-rebaje-40cm',
    slug: 'kit-rebaje-40cm',
    name: 'Kit Rebaje 40 cm',
    grupo: 'kit',
    price: 154700,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje de 40 cm para instalar tú mismo. Incluye manual paso a paso.',
    descriptionHtml: '<p>Kit de rebaje de tina formato <strong>hágalo usted mismo</strong>: incluye la pieza de rebaje de 40 cm en fibra de vidrio reforzada y un manual de instalación paso a paso.</p>',
    image: '/images/kits/Kit Rebaje 40 cm - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm - DUCHA SEGURA.webp'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra',
    slug: 'kit-rebaje-40cm-barra',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox',
    grupo: 'kit',
    price: 205000,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra de seguridad de acero inoxidable de 40 cm.',
    descriptionHtml: '<p>Incluye la pieza de rebaje de 40 cm y una <strong>barra de seguridad de acero inoxidable de 40 cm</strong> con sus elementos de fijación y guía de montaje.</p>',
    image: '/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox - DUCHA SEGURA.webp'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra-silicona',
    slug: 'kit-rebaje-40cm-barra-silicona',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética',
    grupo: 'kit',
    price: 215000,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra inox 40 cm + silicona blanca acética de 280 ml para el sellado.',
    descriptionHtml: '<p>Kit completo: pieza de rebaje de 40 cm, <strong>barra de acero inoxidable de 40 cm</strong> y <strong>silicona blanca acética de 280 ml</strong> para un sellado prolijo y duradero.</p>',
    image: '/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética - DUCHA SEGURA.webp'],
    custom: true,
  },
];

export const PRODUCTOS: Producto[] = [...wc, ...CURATED];

export const REBAJES = PRODUCTOS.filter((p) => p.grupo === 'rebaje');
export const KITS = PRODUCTOS.filter((p) => p.grupo === 'kit');

// Orden de accesorios: barras de seguridad estrictamente por tamaño (menor → mayor),
// luego el resto de las barras. Los slugs no listados aquí quedan al final en su orden original.
const ACCESORIOS_ORDER: string[] = [
  'barra-de-seguridad-30cm',
  'barra-de-seguridad-40cm',
  'barra-de-seguridad-60cm',
  'barra-de-seguridad-76cm',
  'barra-de-cromada-40cm',
  'barra-abatible',
  'barra-borde-tina',
  'barra-muro-piso-60cm',
];
export const ACCESORIOS = (() => {
  const list = PRODUCTOS.filter((p) => p.grupo === 'accesorio');
  const rank = (slug: string, origIdx: number): number => {
    const i = ACCESORIOS_ORDER.indexOf(slug);
    return i === -1 ? ACCESORIOS_ORDER.length + origIdx : i;
  };
  return list
    .map((p, idx) => ({ p, r: rank(p.slug, idx) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p);
})();

export const getProducto = (slug: string): Producto | undefined =>
  PRODUCTOS.find((p) => p.slug === slug);
