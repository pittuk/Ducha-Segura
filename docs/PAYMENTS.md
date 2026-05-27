# Activar pagos online (guía futura)

Estado actual: `output: 'static'`, todo el sitio se compila a estático.

Para habilitar cobro online sin re-arquitectura:
1. Instalar adapter Node: `npm i @astrojs/node`.
2. En `astro.config.mjs`: importar `node` y añadir `adapter: node({ mode: 'standalone' })`.
   El sitio sigue generando estático; solo las rutas con `prerender = false` corren en servidor.
3. Implementar `src/lib/payments/<proveedor>.ts` (interfaz en `src/lib/payments/index.ts`).
4. Crear `src/pages/api/create-transaction.ts` y `src/pages/api/payment-return.ts`
   (ambos con `export const prerender = false`).
5. Añadir una página `/checkout` que tome el carrito (`localStorage ds_cart`) y llame al endpoint.
6. Variables de entorno en `.env` (ver `.env.example`).
7. Desplegar en Hostinger como app Node (no solo archivos estáticos).
