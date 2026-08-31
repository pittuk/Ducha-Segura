export interface NavItem { label: string; href: string; children?: NavItem[]; }

export const NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo', children: [
    { label: 'Rebajes', href: '/rebaje-de-tina' },
    { label: 'Accesorios', href: '/accesorios' },
    { label: 'Kits', href: '/kits' },
  ] },
  { label: 'Instalación', href: '/instalacion-de-rebaje-de-tina', children: [
    { label: 'Cómo instalamos', href: '/instalacion-de-rebaje-de-tina' },
    { label: '¿Cuál es tu tipo de tina?', href: '/tipos-de-tina' },
  ] },
  { label: 'Convenios', href: '/convenios' },
  { label: 'Blog', href: '/blog' },
];

export const SITE = {
  name: 'Ducha Segura®',
  whatsappNumber: '56965945008',
  whatsappUrl: 'https://wa.me/56965945008',
  // Línea telefónica: solo llamadas (no recibe WhatsApp, ese es whatsappNumber).
  phoneNumber: '+56934044939',
  phoneDisplay: '+56 9 3404 4939',
  phoneNote: 'Solo llamadas',
};

// Mensajes rotativos del topbar. Copiados de legacy/index.html (const topbarMessages, ~1372–1376).
export const TOPBAR_MESSAGES: string[] = [
  '20% de descuento pagando con Banco de Chile',
  'Hasta 24 cuotas sin interés con tarjeta de crédito',
  'Servicios en RM, Valparaíso, Biobío y otras regiones',
];
