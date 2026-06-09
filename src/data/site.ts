export interface NavItem { label: string; href: string; children?: NavItem[]; }

export const NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo', children: [
    { label: 'Rebajes', href: '/rebaje-de-tina' },
    { label: 'Accesorios', href: '/accesorios' },
    { label: 'Kits', href: '/kits' },
  ] },
  { label: 'Convenios', href: '/convenios' },
  { label: 'Blog', href: '/blog' },
];

export const SITE = {
  name: 'Ducha Segura®',
  whatsappNumber: '56934044939',
  whatsappUrl: 'https://wa.me/56934044939',
};

// Mensajes rotativos del topbar. Copiados de legacy/index.html (const topbarMessages, ~1372–1376).
export const TOPBAR_MESSAGES: string[] = [
  '20% de descuento pagando con Banco de Chile',
  'Hasta 24 cuotas sin interés con tarjeta de crédito',
  'Servicios en RM, Valparaíso, Biobío y otras regiones',
];
