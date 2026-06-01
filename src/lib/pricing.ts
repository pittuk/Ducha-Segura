export type Tipo = 'tradicional' | 'jacuzzi';
export type Ancho = 30 | 40 | 50;
export type Banco = 'santander' | 'chile' | 'losandes' | 'otro';

export const BASE_PRICES: Record<Tipo, Record<Ancho, number>> = {
  tradicional: { 30: 199000, 40: 229000, 50: 259000 },
  jacuzzi:     { 30: 399000, 40: 429000, 50: 469000 },
};

/** Descuento porcentual por banco/convenio asociado. */
export const DISCOUNTS: Record<Banco, number> = { santander: 15, chile: 20, losandes: 20, otro: 0 };

export const BANCO_LABELS: Record<Banco, string> = { santander: 'Santander', chile: 'Banco de Chile', losandes: 'Caja Los Andes', otro: '' };

export function basePrice(tipo: Tipo, ancho: Ancho): number {
  return BASE_PRICES[tipo][ancho];
}
export function discountAmount(base: number, banco: Banco): number {
  return Math.round(base * DISCOUNTS[banco] / 100);
}
export function finalPrice(base: number, banco: Banco): number {
  return base - discountAmount(base, banco);
}
export function installment(final: number, cuotas: number): number {
  return Math.round(final / cuotas);
}
