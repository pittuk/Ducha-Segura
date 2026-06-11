// Reseñas reales de clientes en Google (perfil de Ducha Segura®).
// Actualización MANUAL: copiar desde Google Business / Maps las últimas reseñas y
// los agregados (promedio + total) cuando cambien. Última carga: junio 2026.
export interface Testimonio {
  name: string;     // nombre del autor tal como aparece en Google
  meta: string;     // línea secundaria: mes/año de la reseña (las fechas relativas de Google envejecen)
  text: string;     // texto de la reseña
  stars?: number;   // 1–5; por defecto 5
}

// Agregados del perfil de Google (mostrados en el encabezado de la sección).
export const REVIEWS_RATING = 5.0;
export const REVIEWS_TOTAL = 439;

export const TESTIMONIOS: Testimonio[] = [
  { name: 'María Gabriela Triozzi Sierra', meta: 'Junio 2026',
    text: 'Fue un proceso rápido, menos de 2 horas de duración.' },
  { name: 'Ina Gloria Quiñones García', meta: 'Junio 2026',
    text: 'Excelente trabajo, puntualidad y limpieza en la ejecución. 100% recomendado.' },
  { name: 'Isidora Caviedes', meta: 'Mayo 2026',
    text: 'Excelente la calidad del trabajo, muy satisfechos con el rebaje de tina. El técnico muy cordial y amable, realiza su trabajo con gran profesionalismo.' },
  { name: 'Verónica Maru', meta: 'Mayo 2026',
    text: 'Excelente trabajo, muy buen técnico. Lo recomiendo.' },
  { name: 'René Sánchez', meta: 'Mayo 2026',
    text: 'Excelente trabajo. Servicio expedito, puntualidad y eficiencia. 100% recomendable.' },
  { name: 'Paula Olguín', meta: 'Mayo 2026',
    text: 'Quiero agradecer a Ducha Segura por el trabajo realizado, en tiempo y forma, a un valor económico y con un profesionalismo impecable. 100% recomendado. Ahora mis papás podrán ducharse sin problemas de movilidad.' },
];
