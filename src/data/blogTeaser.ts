export interface BlogTeaserPost {
  cat: string;
  date: string;
  title: string;
  excerpt: string;
  label: string;
  bg: string;
  slug?: string;
}

export const BLOG_POSTS: BlogTeaserPost[] = [
  { cat:'BAÑO ACCESIBLE', date:'Abr 2026',
    title:'¿Cómo debe ser un baño para un adulto mayor?',
    excerpt:'Altura del WC, ubicación de las barras, antideslizantes, iluminación. Los seis cambios que más impactan.',
    label:'FOTO BAÑO ACCESIBLE', bg:'#cdd5d8' },
  { cat:'REFORMA', date:'Feb 2026',
    title:'Reforma de baño: cómo crear un espacio accesible y seguro en Chile',
    excerpt:'Guía paso a paso con normativa local, opciones según presupuesto y plazos reales en Santiago y regiones.',
    label:'FOTO REFORMA BAÑO', bg:'#d8cdb8' },
  { cat:'HÁGALO USTED MISMO', date:'Ene 2026',
    title:'Rebaje de Tina Hágalo Usted Mismo: la nueva solución DIY de Ducha Segura®',
    excerpt:'Para casos puntuales o instaladores locales: el kit que llega listo para colocar en una mañana.',
    label:'FOTO KIT DIY', bg:'#c8bfb0' },
];
