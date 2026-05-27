import { describe, it, expect } from 'vitest';
import { addItem, removeItem, changeQty, subtotal, count, hasItem, type CartItem } from './cart';

const base = { id: 'p1', name: 'Rebaje', variant: '40 cm', label: 'REBAJE 40', unitPrice: 229000 };

describe('cart', () => {
  it('agrega un item nuevo con qty 1', () => {
    const c = addItem([], base);
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(1);
  });

  it('agregar un id existente incrementa qty sin duplicar', () => {
    const c = addItem(addItem([], base), base);
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(2);
  });

  it('no muta el array original (inmutable)', () => {
    const original: CartItem[] = [];
    addItem(original, base);
    expect(original).toHaveLength(0);
  });

  it('changeQty respeta mínimo de 1', () => {
    const c = changeQty(addItem([], base), 'p1', -5);
    expect(c[0].qty).toBe(1);
  });

  it('removeItem elimina por id', () => {
    expect(removeItem(addItem([], base), 'p1')).toHaveLength(0);
  });

  it('subtotal y count suman precio*qty y cantidades', () => {
    let c = addItem([], base);          // qty 1
    c = changeQty(c, 'p1', 2);          // qty 3
    expect(subtotal(c)).toBe(687000);   // 229000 * 3
    expect(count(c)).toBe(3);
  });

  it('hasItem detecta presencia por id', () => {
    const c = addItem([], base);
    expect(hasItem(c, 'p1')).toBe(true);
    expect(hasItem(c, 'otro')).toBe(false);
    expect(hasItem([], 'p1')).toBe(false);
  });
});
