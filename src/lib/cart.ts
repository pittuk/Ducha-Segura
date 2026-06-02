export type Grupo = 'rebaje' | 'kit' | 'accesorio';

export interface CartItem {
  id: string;
  name: string;
  variant: string;
  label: string;
  grupo: Grupo;        // categoría del producto (define cotizar vs comprar)
  image?: string;      // ruta de imagen en public/ (thumbnail); si falta, cae al label
  unitPrice: number;   // precio unitario (checkout-ready)
  qty: number;
}
export type NewItem = Omit<CartItem, 'qty'>;

export function addItem(cart: CartItem[], item: NewItem): CartItem[] {
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    return cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
  }
  return [...cart, { ...item, qty: 1 }];
}

export function removeItem(cart: CartItem[], id: string): CartItem[] {
  return cart.filter(i => i.id !== id);
}

export function changeQty(cart: CartItem[], id: string, delta: number): CartItem[] {
  return cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
}

export function subtotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
}

export function count(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function hasItem(cart: CartItem[], id: string): boolean {
  return cart.some(i => i.id === id);
}

export function hasRebaje(cart: CartItem[]): boolean {
  return cart.some(i => i.grupo === 'rebaje');
}

// Comprar solo está disponible si el carrito tiene productos y son todos
// kits/accesorios (sin rebaje). Con un rebaje presente, va sí o sí a cotización.
export function canBuy(cart: CartItem[]): boolean {
  return cart.length > 0 && !hasRebaje(cart) &&
    cart.every(i => i.grupo === 'kit' || i.grupo === 'accesorio');
}

// Fallback para items viejos de localStorage sin `grupo`: se deriva del prefijo del id.
export function deriveGrupo(id: string): Grupo {
  if (/^(reb|cfg|calc)-/.test(id)) return 'rebaje';
  if (id.startsWith('kit-')) return 'kit';
  return 'accesorio';
}
