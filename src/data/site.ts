export interface NavItem { label: string; href: string; }

export const NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Rebajes', href: '/rebajes' },
  { label: 'Accesorios', href: '/accesorios' },
  { label: 'Blog', href: '/blog' },
  { label: 'Convenios', href: '/convenios' },
];

export const SITE = {
  name: 'Ducha Segura®',
  whatsappNumber: '56934044939',
  whatsappUrl: 'https://wa.me/56934044939',
};

// Mensajes rotativos del topbar. Copiados de legacy/index.html (const topbarMessages, ~1372–1376).
export const TOPBAR_MESSAGES: string[] = [
  '15% dcto. pagando con Banco Santander en Santiago y Gran Concepción',
  'Hasta 24 cuotas sin interés con tarjeta de crédito',
  'Despacho a RM, Valparaíso y Bío Bío — Instalación en 7–10 días hábiles',
];
