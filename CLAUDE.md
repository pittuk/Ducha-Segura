# CLAUDE.md — Ducha Segura® (sitio web)

Front **Astro 5 estático** (catálogo + cotización lead-gen) con un **backend PHP + MySQL** para recibir cotizaciones (`public/api/`) y un panel de administración (`public/admin/`), todo para el cliente Ducha Segura. Migrado desde una landing monolítica. Preparado para sumar pagos online a futuro (hoy stub 501).

## Estado y handoff
**Lee primero [`docs/ESTADO.md`](docs/ESTADO.md)** — tiene el estado completo, lo hecho, los pendientes y dónde continuar. La migración está terminada y mergeada en `main`.

## Cómo correr (importante)
Este es el directorio del proyecto (la raíz `../` NO tiene `package.json`). Ejecutar siempre desde aquí:
```
npm install      # primera vez
npm run dev      # http://localhost:4321/
npm test         # Vitest: src/**/*.test.ts + scripts/**/*.test.ts (pricing, cart, watermark)
npm run build    # genera dist/ → desplegar en Hostinger
```
`build` corre `prebuild` (`scripts/watermark.mjs`) automáticamente: marca de agua sobre las imágenes. Para regenerar solo las marcas: `npm run watermark`.
Node: `18.20.8 || ^20.3.0 || >=22.0.0`.

**Backend local (PHP+MySQL):** el front es estático pero `/cotizar` hace POST a `public/api/cotizacion.php`. Para probarlo: `& 'C:\tools\php\php.exe' -S localhost:8080 -t public` junto al `npm run dev`. Entorno portable (PHP en `C:\tools\php`, MariaDB en `C:\tools\mariadb`) detallado en la memoria `reference_backend-dev-env`.

**Despliegue (Hostinger):** solo SFTP (puerto 65002, shell nologin). El build copia `public/api/config.php` (dev) a `dist/api/` → **borrar `dist/api/config.php` antes de subir**; el `config.php` real se crea en el servidor (está en `.gitignore`). Ver memoria `project_deploy-hostinger`.

## Arquitectura (resumen)
- `src/data/` — **fuente única de datos** (`productos`, `convenios`, `comunas`, `regiones`, `tinas`, `prensa`, `testimonios`, `testimonios-video`, `products-media`, `hero`, `site`). Cambiar contenido/precios aquí. Los productos salen de WooCommerce vía `scripts/import-woo.mjs` → `productos.json` (wrapper `productos.ts` con tipos/overrides + curados que no están en WC).
- `src/lib/` — **lógica pura testeada**: `pricing.ts`, `cart.ts`, `format.ts`, `seo.ts`, `asset.ts`. `payments/` reservado (sin implementar).
- `src/scripts/` — JS de cliente (DOM/glue): `ui.ts`, `cart.ts`, `calculator.ts`, `cotizar.ts`, `catalog-filter.ts`, `search.ts`, `quickview.ts`, `dom.ts`.
- `public/api/` — **backend PHP**: `cotizacion.php` (POST → MySQL + email vía PHPMailer), `comprar.php` (stub 501 pagos), `db.php` (PDO), `mailer.php`, `schema.sql`, `config.example.php` (el real `config.php` está gitignored). `public/admin/` — panel (login/CSRF, listado, detalle, export CSV, usuarios).
- `src/components/`, `src/layouts/BaseLayout.astro`, `src/pages/` (rutas), `src/content/blog/` (Markdown, ~50 posts reales importados de WordPress), `src/styles/` (`tokens.css` + `base.css`).

## Convenciones / cosas a respetar
- **No re-declarar clases globales** de `base.css` en estilos *scoped* de componentes (`.container .btn .btn--* .ic .section* .h2 .lead .kicker .see-all .reveal .product-grid .acc-grid .blog-grid`).
- **Cross-navigation (View Transitions):** listeners a nivel `document`/`window` se guardan con **banderas de módulo**, NO con `document.body.dataset` (Astro reemplaza el `<body>` en cada swap). Ver patrón en `src/scripts/ui.ts`.
- **Carrito:** el item usa `unitPrice` (no `price`); persiste en `localStorage` (`ds_cart`); se agrega vía `window.dsCart.add(...)`.
- **Precios/descuentos/cuotas/instalación** salen de `src/lib/pricing.ts` (no hardcodear números en componentes/scripts). Hay tests que validan los valores.
- **Slugs alineados con WordPress** para preservar indexación: los posts de blog se sirven en la **raíz** (`/<slug>` vía `src/pages/[slug].astro`); las páginas estáticas tienen prioridad sobre esa ruta dinámica. No cambiar slugs/claves internas aunque cambie el texto visible (p. ej. rename Jacuzzi→Hidromasaje es solo display vía `NAME_OVERRIDE`).
- Mensajes de commit en español; trailer `Co-Authored-By: Claude ...`.

## Pendientes principales
1. **Precios reales de los 3 kits DIY** — hoy placeholder (99k/129k/139k) en `src/data/productos.ts`, array `CURATED`.
2. **Fotos reales de los 6 tipos de tina** (`public/images/tinas/`, hoy placeholders SVG) y del flujo `/cotizar`.
3. **Reseñas reales de Google** — los testimonios de `src/data/testimonios.ts` son ficticios (diferido; captura manual).
4. **Despliegue del backend** en Hostinger (crear DB, importar `schema.sql`, `config.php` real, sembrar admin).
5. **Pagos online** a futuro (botón "Comprar" apunta al stub 501) — guía en [`docs/PAYMENTS.md`](docs/PAYMENTS.md).
