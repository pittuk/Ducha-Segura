import { describe, it, expect } from 'vitest';
import { basePrice, discountAmount, finalPrice, installment, INSTALLATION_FEE } from './pricing';

describe('pricing', () => {
  it('precio base por tipo y ancho', () => {
    expect(basePrice('tradicional', 40)).toBe(229000);
    expect(basePrice('tradicional', 30)).toBe(199000);
    expect(basePrice('jacuzzi', 40)).toBe(429000);
  });

  it('descuento Santander 15% sobre 229.000 = 34.350', () => {
    expect(discountAmount(229000, 'santander')).toBe(34350);
  });

  it('precio final con Santander = 194.650', () => {
    expect(finalPrice(229000, 'santander')).toBe(194650);
  });

  it('sin descuento cuando banco = otro', () => {
    expect(discountAmount(229000, 'otro')).toBe(0);
    expect(finalPrice(229000, 'otro')).toBe(229000);
  });

  it('valor de cuota = final / nº cuotas redondeado (194.650 / 12 = 16.221)', () => {
    expect(installment(194650, 12)).toBe(16221);
  });

  it('cargo de instalación fijo = 30.000', () => {
    expect(INSTALLATION_FEE).toBe(30000);
  });
});
