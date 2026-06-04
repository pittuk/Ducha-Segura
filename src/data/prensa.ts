export interface PrensaItem {
  name: string;     // nombre del medio (alt de la imagen y placeholder tipográfico)
  logo: string;     // ruta en public/images/prensa/. Si el archivo falta, el componente
                    // muestra un placeholder con `name` (onerror); al subir el logo real
                    // con este nombre, aparece solo sin tocar código.
  excerpt: string;  // frase corta para el tooltip
  href: string;     // nota interna en el sitio (entrada de blog "Ducha Segura en medios")
}

// Medios reales que han cubierto a Ducha Segura. Cada ítem enlaza a su nota en el blog.
// Logos en public/images/prensa/ (ver spec para los que faltan por subir).
export const PRENSA: PrensaItem[] = [
  { name: 'Las Últimas Noticias', logo: '/images/prensa/logo-lun.png',
    href: '/prensa-diario-lun',
    excerpt: 'Un error de obra que se volvió solución de accesibilidad.' },
  { name: 'Diario La Estrella', logo: '/images/prensa/Diario_La_Estrella.png',
    href: '/prensa-diario-la-estrella-concepcion',
    excerpt: '«El error que se convirtió en una solución».' },
  { name: 'Radio Festival de Valparaíso', logo: '/images/prensa/favicon-radio-festival-valparaiso.png',
    href: '/prensa-radio-festival-valparaiso',
    excerpt: 'Adapta la tina en un par de horas, a un valor accesible.' },
  { name: 'Diario El Sur', logo: '/images/prensa/logo-el-sur.png',
    href: '/prensa-diario-el-sur',
    excerpt: 'Adapta tinas para reducir las caídas en el hogar.' },
  { name: 'Diario La Crónica', logo: '/images/prensa/logo-la-cronica.png',
    href: '/prensa-diario-la-cronica',
    excerpt: 'Adapta tinas para prevenir caídas en adultos mayores.' },
  { name: 'Diario La Discusión', logo: '/images/prensa/logo-la-discusion.png',
    href: '/prensa-diario-la-discusion',
    excerpt: 'Mejora la accesibilidad del baño, desde Chillán.' },
  { name: 'Canal Regional TVU', logo: '/images/prensa/logo-tvu.png',
    href: '/prensa-tvu-hualpen',
    excerpt: 'La adaptación para personas mayores, en Hualpén.' },
  { name: 'Universidad del Desarrollo', logo: '/images/prensa/logo-udd.png',
    href: '/prensa-universidad-del-desarrollo',
    excerpt: 'Un alumni de Arquitectura por la accesibilidad.' },
  { name: 'Prensa 2025', logo: '/images/prensa/logo-entrevistas.png',
    href: '/prensa-entrevistas-2025',
    excerpt: 'Radio Agricultura, CHV y 24 Horas destacan a Ducha Segura®.' },
];
