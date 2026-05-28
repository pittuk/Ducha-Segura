# CLAUDE.md — Ducha Segura® (sitio web)

Sitio **Astro 5 estático** (catálogo + cotización lead-gen vía WhatsApp) para el cliente Ducha Segura. Migrado desde una landing monolítica. Preparado para sumar pagos online a futuro.

## Estado y handoff
**Lee primero [`docs/ESTADO.md`](docs/ESTADO.md)** — tiene el estado completo, lo hecho, los pendientes y dónde continuar. La migración está terminada y mergeada en `main`.

## Cómo correr (importante)
Este es el directorio del proyecto (la raíz `../` NO tiene `package.json`). Ejecutar siempre desde aquí:
```
npm install      # primera vez
npm run dev      # http://localhost:4321/
npm test         # Vitest (lógica de pricing/cart)
npm run build    # genera dist/ → desplegar en Hostinger
```
Node: `18.20.8 || ^20.3.0 || >=22.0.0`.

## Arquitectura (resumen)
- `src/data/` — **fuente única de datos** (productos, accesorios, convenios, comunas, prensa, testimonios, hero, site). Cambiar contenido/precios aquí.
- `src/lib/` — **lógica pura testeada**: `pricing.ts`, `cart.ts`, `format.ts`. `payments/` reservado (sin implementar).
- `src/scripts/` — JS de cliente (DOM/glue): `ui.ts`, `cart.ts`, `configurator.ts`, `calculator.ts`, `dom.ts`.
- `src/components/`, `src/layouts/BaseLayout.astro`, `src/pages/` (rutas), `src/content/blog/` (Markdown), `src/styles/` (`tokens.css` + `base.css`).

## Convenciones / cosas a respetar
- **No re-declarar clases globales** de `base.css` en estilos *scoped* de componentes (`.container .btn .btn--* .ic .section* .h2 .lead .kicker .see-all .reveal .product-grid .acc-grid .blog-grid`).
- **Cross-navigation (View Transitions):** listeners a nivel `document`/`window` se guardan con **banderas de módulo**, NO con `document.body.dataset` (Astro reemplaza el `<body>` en cada swap). Ver patrón en `src/scripts/ui.ts`.
- **Carrito:** el item usa `unitPrice` (no `price`); persiste en `localStorage` (`ds_cart`); se agrega vía `window.dsCart.add(...)`.
- **Precios/descuentos/cuotas** salen de `src/lib/pricing.ts` (no hardcodear números en componentes/scripts). Hay tests que validan los valores.
- Port fiel del diseño original; las imágenes son placeholders de texto (pendiente: fotos reales).
- Mensajes de commit en español; trailer `Co-Authored-By: Claude ...`.

## Pendientes principales
1. Imágenes reales de producto (hoy placeholders) — fuente en `../Imagenes de la pagina vieja/`.
2. Textos reales de los 3 artículos de blog (`src/content/blog/*.md`, hoy stubs).
3. Pagos online a futuro — guía en [`docs/PAYMENTS.md`](docs/PAYMENTS.md).
