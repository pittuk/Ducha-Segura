import { describe, it, expect } from 'vitest';
import { promoActiva, precioVigente } from './promo';

const kit = { slug: 'kit-rebaje-40cm', price: 178500 };
const rebaje = { slug: 'rebaje-de-tina-tradicional', price: 365000 };
const barra = { slug: 'barra-de-seguridad-40cm', price: 25000 };

const lunes = Date.parse('2026-10-12T23:59:59-03:00');
const martes = Date.parse('2026-10-13T00:00:00-03:00');

describe('promo Cyber', () => {
  it('vigente hasta el lunes 12 a las 23:59 (hora Chile)', () => {
    expect(promoActiva(lunes)).toBe(true);
    expect(precioVigente(kit, lunes)).toBe(149990);
    expect(precioVigente(rebaje, lunes)).toBe(279990);
  });
  it('el martes 13 vuelve el precio normal', () => {
    expect(promoActiva(martes)).toBe(false);
    expect(precioVigente(kit, martes)).toBe(178500);
    expect(precioVigente(rebaje, martes)).toBe(365000);
  });
  it('un producto fuera de la promo no cambia', () => {
    expect(precioVigente(barra, lunes)).toBe(25000);
  });
});
