import { describe, it, expect } from 'vitest';
import { addItem, removeItem, changeQty, subtotal, count, hasItem, hasRebaje, canBuy, deriveGrupo, type CartItem, type Grupo } from './cart';

const base = { id: 'p1', name: 'Rebaje', variant: '40 cm', label: 'REBAJE 40', unitPrice: 229000, grupo: 'rebaje' as Grupo };

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

const acc = { id: 'acc-barra', name: 'Barra', variant: '40 cm', label: 'BARRA', unitPrice: 25000, grupo: 'accesorio' as Grupo };
const kit = { id: 'kit-basico', name: 'Kit', variant: 'básico', label: 'KIT', unitPrice: 80000, grupo: 'kit' as Grupo };
const reb = { id: 'reb-trad', name: 'Rebaje', variant: '40 cm', label: 'REBAJE', unitPrice: 229000, grupo: 'rebaje' as Grupo };

describe('hasRebaje', () => {
  it('false en carrito vacío', () => { expect(hasRebaje([])).toBe(false); });
  it('false con solo accesorios/kits', () => {
    expect(hasRebaje(addItem(addItem([], acc), kit))).toBe(false);
  });
  it('true cuando hay un rebaje', () => {
    expect(hasRebaje(addItem(addItem([], acc), reb))).toBe(true);
  });
});

describe('canBuy', () => {
  it('false en carrito vacío', () => { expect(canBuy([])).toBe(false); });
  it('true con solo accesorios', () => { expect(canBuy(addItem([], acc))).toBe(true); });
  it('true con solo kits', () => { expect(canBuy(addItem([], kit))).toBe(true); });
  it('true mezclando kits y accesorios', () => {
    expect(canBuy(addItem(addItem([], acc), kit))).toBe(true);
  });
  it('false si hay un rebaje', () => {
    expect(canBuy(addItem(addItem([], acc), reb))).toBe(false);
  });
});

describe('deriveGrupo', () => {
  it('reb-/cfg-/calc- → rebaje', () => {
    expect(deriveGrupo('reb-x')).toBe('rebaje');
    expect(deriveGrupo('cfg-x')).toBe('rebaje');
    expect(deriveGrupo('calc-jacuzzi-40-santander')).toBe('rebaje');
  });
  it('kit- → kit', () => { expect(deriveGrupo('kit-basico')).toBe('kit'); });
  it('acc- → accesorio', () => { expect(deriveGrupo('acc-barra')).toBe('accesorio'); });
  it('desconocido → accesorio', () => { expect(deriveGrupo('x-foo')).toBe('accesorio'); });
});
