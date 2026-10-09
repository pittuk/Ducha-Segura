// Oferta temporal con vencimiento por fecha. El sitio es estático: el HTML se publica con el
// precio normal y la oferta se enciende en el navegador solo mientras `ahora < ends`, así que
// al vencer se revierte sola (precio y adornos) sin redesplegar.
// Próxima oferta: cambiar `ends`, `prices` y los textos de PromoBar.astro.
export const PROMO = {
  ends: '2026-10-13T00:00:00-03:00',   // martes 00:00 Chile → vigente hasta el lunes 12 inclusive
  hasta: 'lunes 12 de octubre',        // texto visible del último día
  prices: {
    'kit-rebaje-40cm': 149990,
    'rebaje-de-tina-tradicional': 279990,
  } as Record<string, number>,
};

export const PROMO_ENDS_MS = Date.parse(PROMO.ends);

export function promoActiva(now: number = Date.now()): boolean {
  return now < PROMO_ENDS_MS;
}

/** Precio de oferta del producto, o undefined si no participa. */
export function precioPromo(slug: string): number | undefined {
  return PROMO.prices[slug];
}

/** Precio a cobrar/mostrar ahora: el de oferta si está vigente y el producto participa. */
export function precioVigente(p: { slug: string; price: number }, now: number = Date.now()): number {
  return (promoActiva(now) && precioPromo(p.slug)) || p.price;
}
