# Pagos (reservado)

Carpeta reservada para la integración de pagos online (fase futura). Hoy el sitio
funciona como catálogo + cotización por WhatsApp; no procesa pagos.

`index.ts` define la interfaz `PaymentProvider`. Para activar pagos:
1. `npm i @astrojs/node` y añadir el adapter en `astro.config.mjs`.
2. Implementar un adaptador (p. ej. `transbank.ts`) que cumpla `PaymentProvider`.
3. Crear endpoints en `src/pages/api/` (`create-transaction.ts`, `payment-return.ts`)
   con `export const prerender = false`.
4. Completar las variables en `.env` según `.env.example`.
