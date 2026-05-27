// Interfaz genérica de pasarela de pago. Reservado: NO implementado todavía.
// Cuando se active el cobro online, implementar un adaptador por proveedor
// (Transbank/Webpay, Mercado Pago, Flow, Khipu) que cumpla esta interfaz.

import type { CartItem } from '../cart';

export interface PaymentInitResult { redirectUrl: string; token: string; }

export interface PaymentProvider {
  /** Crea una transacción y devuelve la URL de redirección a la pasarela. */
  createTransaction(input: { items: CartItem[]; buyOrder: string; returnUrl: string }): Promise<PaymentInitResult>;
  /** Confirma/valida el retorno de la pasarela. */
  confirmTransaction(token: string): Promise<{ status: 'approved' | 'rejected'; amount: number }>;
}

// export function getProvider(): PaymentProvider { throw new Error('Pagos no habilitados'); }
