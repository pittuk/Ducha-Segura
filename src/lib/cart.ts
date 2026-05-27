export interface CartItem {
  id: string;
  name: string;
  variant: string;
  label: string;
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
