# Ducha Segura® — Sitio web

Sitio [Astro](https://astro.build) (estático) modular. Catálogo + cotización (lead-gen vía WhatsApp). Preparado para sumar pagos online a futuro sin re-arquitectura.

## Requisitos
- Node `18.20.8 || ^20.3.0 || >=22.0.0`

## Desarrollo
```bash
npm install
npm run dev      # servidor local (http://localhost:4321)
npm test         # tests de lógica pura (pricing, cart) con Vitest
npm run build    # genera dist/ (sitio estático)
npm run preview  # sirve el build de dist/
```

## Arquitectura
- `src/data/` — fuente única de datos (productos, accesorios, convenios, comunas, prensa, testimonios, hero, site).
- `src/lib/` — lógica pura testeable: `pricing.ts` (precios/descuentos/cuotas), `cart.ts` (operaciones de carrito), `format.ts`. `payments/` está **reservado** (sin implementar).
- `src/scripts/` — JS de cliente: `ui.ts` (topbar, slider, menú, toggle, reveal), `cart.ts` (cotizador cross-page con localStorage), `configurator.ts`, `calculator.ts`, `catalog-filter.ts`, `dom.ts`.
- `src/components/` — componentes (`Header`, `Footer`, `Topbar`, `Hero`, `ProductCard`, `AccessoryCard`, `QuoteDrawer`, `Configurator`, `Calculator`, etc.).
- `src/layouts/BaseLayout.astro` — shell común (head/SEO, fuentes, View Transitions, Header/Footer/cotizador).
- `src/pages/` — rutas: `/`, `/catalogo`, `/rebajes`, `/accesorios`, `/convenios`, `/blog`, `/blog/<slug>`, `404`.
- `src/content/blog/` — artículos del blog en Markdown (content collection).
- `src/styles/` — `tokens.css` (design tokens) + `base.css` (reset + utilidades globales).

## Páginas
| Ruta | Contenido |
|---|---|
| `/` | Landing: hero, convenios, cómo funciona, productos, configurador, calculadora, prensa, testimonios, blog |
| `/catalogo` | Rebajes + accesorios con filtro por categoría |
| `/rebajes` | Rebajes + configurador + calculadora |
| `/accesorios` | Listado de accesorios |
| `/convenios` | Convenios y descuentos |
| `/blog` · `/blog/<slug>` | Blog (Markdown) |

## Cotizador
El carrito de cotización persiste entre páginas (`localStorage` clave `ds_cart`) y deriva a WhatsApp. La lógica de carrito y precios es pura y está cubierta por tests.

## Despliegue (Hostinger)
`npm run build` y publicar el contenido de `dist/` (sitio estático).
Para activar pagos online en el futuro: ver [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## Imágenes
Las imágenes de producto usan placeholders de texto (igual que el sitio original). Reemplazarlas por fotos reales es una tarea de contenido posterior: copiar a `public/images/` y sustituir los placeholders en los componentes.
