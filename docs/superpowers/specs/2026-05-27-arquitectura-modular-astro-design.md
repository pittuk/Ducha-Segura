# Diseño — Migración a arquitectura modular (Astro)

**Fecha:** 2026-05-27
**Proyecto:** Ducha Segura® — sitio web
**Estado:** Aprobado por el cliente (Partes A y B). Pendiente de revisión del documento.

---

## 1. Contexto y objetivo

El sitio actual es una **landing de una sola página**: un único `index.html` (~1920 líneas) con
CSS y JavaScript inline. Todos los datos (productos, accesorios, convenios, prensa, testimonios,
comunas, precios, copy del hero) están como constantes JS dentro del HTML. Tiene interactividad
rica: configurador, calculadora por comuna, cotizador tipo carrito (deriva a WhatsApp), slider
antes/después y toggle usuario/cuidador.

**Objetivo:** pasar de esa landing monolítica a una **arquitectura modular y escalable** donde:

1. Cada ítem del navbar es una **página independiente**.
2. Existe un **catálogo** navegable.
3. Las bases quedan listas para **pagos online a futuro**, sin construirlos todavía.

El sitio que se entrega en esta etapa sigue siendo **catálogo + cotización (lead-gen)**: estático,
sin pago online. La migración es un **refactor fiel 1:1** del diseño visual y las features actuales,
no un rediseño.

## 2. Decisiones tomadas (resumen de brainstorming)

| Decisión | Elección |
|---|---|
| Naturaleza del proyecto | Sitio catálogo + cotización (lead-gen). Sin pago online ahora. |
| Tooling / hosting | Hostinger con soporte Node.js. Build moderno permitido. |
| Páginas de detalle por producto | No por ahora; solo listados por categoría (datos modelados para sumar detalle fácil luego). |
| Mapa de páginas | Inicio + Catálogo + Rebajes + Accesorios + Blog + Convenios. |
| Stack | **Astro** (HTML-first, componentes, routing por archivos, content collections). |
| Pagos | Necesarios **más adelante** → arquitectura preparada (modo `hybrid`, carrito checkout-ready, carpetas reservadas). |

## 3. Stack y modo de salida

- **Astro** compilando en modo **`hybrid`**:
  - Hoy, **todas** las páginas se renderizan estáticas (SSG) → rápidas, baratas, seguras. El
    resultado es la carpeta `dist/`, que se publica en Hostinger como archivos estáticos.
  - El modo `hybrid` deja habilitada la capacidad de marcar páginas/endpoints concretos como
    server-rendered cuando se activen pagos, **sin re-arquitectura**. No se paga el costo de SSR hoy.
- **View Transitions** de Astro para transiciones fluidas entre páginas (sensación SPA sin recarga visible).
- **TypeScript** para datos y scripts de cliente.
- Control de versiones: **git** (ya inicializado, rama `main`).

**Por qué Astro:** es HTML-first, así que se reutiliza el CSS/JS vanilla actual sin reescribir a
React; envía 0 JS por defecto (buen Core Web Vitals y SEO); el routing por archivos y las content
collections encajan exactamente con un sitio de catálogo + blog que va a crecer.

## 4. Estructura de carpetas

```
Sitio Web/
├─ astro.config.mjs · package.json · tsconfig.json
├─ .env.example                 ← variables esperadas a futuro (claves de pasarela), sin valores
├─ public/
│   ├─ favicon.png
│   └─ images/                  ← logos + imágenes migradas y optimizadas
├─ legacy/
│   └─ index.html               ← referencia del sitio actual durante la migración (se elimina al cerrar)
├─ src/
│   ├─ data/                    ← FUENTE ÚNICA de verdad (hoy son const dentro del HTML)
│   │   ├─ site.ts              (nav items, WhatsApp, contacto, topbar promo, copy hero por modo)
│   │   ├─ products.ts          (PRODUCTS + BASE_PRICES + medidas/colores)
│   │   ├─ accesorios.ts
│   │   ├─ convenios.ts
│   │   ├─ comunas.ts
│   │   ├─ prensa.ts
│   │   └─ testimonios.ts
│   ├─ content/
│   │   ├─ config.ts            (esquema de la colección blog)
│   │   └─ blog/                (posts en Markdown)
│   ├─ layouts/
│   │   └─ BaseLayout.astro     (<head>, SEO/meta, fuentes, ViewTransitions, Topbar+Header+Footer+QuoteDrawer)
│   ├─ components/
│   │   ├─ Header.astro · Footer.astro · Topbar.astro      (únicos, compartidos)
│   │   ├─ ProductCard.astro · AccessoryCard.astro
│   │   ├─ Hero.astro · ComoFunciona.astro · ConveniosMarquee.astro
│   │   ├─ Prensa.astro · Testimonios.astro · CtaFinal.astro
│   │   ├─ Configurator.astro · Calculator.astro · BeforeAfterSlider.astro
│   │   └─ QuoteDrawer.astro    (cotizador / carrito)
│   ├─ scripts/                 ← JS de cliente modular (TS)
│   │   ├─ cart.ts              (localStorage, cross-page, checkout-ready)
│   │   ├─ configurator.ts
│   │   ├─ calculator.ts
│   │   └─ ui.ts                (topbar, menú móvil, slider, reveal-on-scroll, toggle usuario/cuidador)
│   ├─ lib/
│   │   └─ payments/            ← RESERVADO (vacío hoy): adaptador genérico de pasarela
│   ├─ styles/
│   │   ├─ tokens.css           (:root del design system)
│   │   └─ base.css             (reset, tipografía, utilidades globales)
│   └─ pages/
│       ├─ index.astro          (/)
│       ├─ catalogo.astro       (/catalogo)
│       ├─ rebajes.astro        (/rebajes)
│       ├─ accesorios.astro     (/accesorios)
│       ├─ convenios.astro      (/convenios)
│       ├─ blog/
│       │   ├─ index.astro      (/blog)
│       │   └─ [slug].astro     (/blog/<post> — se activa al haber artículos en Markdown)
│       ├─ api/                 ← RESERVADO (vacío hoy): endpoints de pago (crear transacción, retorno/webhook)
│       └─ 404.astro
```

## 5. Principios de modularidad

- **Componente único por elemento compartido:** Header, Footer y Topbar se definen una vez y se usan
  en todas las páginas vía `BaseLayout`. Elimina la duplicación actual (el logo/nav vive hoy en 2-3
  lugares del HTML).
- **Datos separados de la presentación:** todo lo que hoy son `const PRODUCTS = [...]`, `ACCESORIOS`,
  `CONVENIOS`, etc., pasa a `src/data/*.ts`. Páginas y tarjetas importan esos datos. Cambiar un precio
  = una línea, un archivo, reflejado en toda la web.
- **Estilos:** el `:root` (design system) y el reset/tipografía pasan a `tokens.css` y `base.css`
  globales; los estilos específicos de cada componente quedan *scoped* dentro de su `.astro`.
- **Interactividad enfocada:** cada feature es un módulo en `src/scripts/`, montado vía `<script>` del
  componente que lo usa. Mismo comportamiento que hoy, en piezas reutilizables.

## 6. Páginas y su contenido

| Ruta | Contenido |
|---|---|
| `/` Inicio | Landing actual íntegra: Hero (slider antes/después), marquee de convenios, "Cómo funciona", teaser de productos (3 tarjetas → enlazan a `/rebajes` / `/catalogo`), Configurador, Calculadora, Prensa, Testimonios, CTA final. |
| `/catalogo` | Listado completo: rebajes + accesorios en grilla, con filtro por categoría (Rebajes / Accesorios). Cada tarjeta con CTA "Sumar a cotización" o "Configurar". |
| `/rebajes` | Los 3 rebajes (Tradicional, Jacuzzi, Spa XL) + Configurador + Calculadora (contexto natural de los rebajes). |
| `/accesorios` | Listado de accesorios (tarjetas con precio + "Sumar a cotización"). |
| `/convenios` | Versión ampliada: todos los convenios/bancos, explicación del descuento y cómo usarlo. |
| `/blog` | Listado de artículos (los 3 actuales), montado sobre content collection en Markdown. |
| `/blog/<slug>` | Página de artículo. Se activa cuando existan artículos reales en Markdown (depende de contenido del cliente). |
| `/404` | Error con vuelta al inicio. |

## 7. Carrito / cotización cross-page

- `QuoteDrawer.astro` se incluye en `BaseLayout` → presente en todas las páginas.
- `cart.ts` persiste en `localStorage` con forma **checkout-ready**:
  `{ id, variante, cantidad, precioUnitario }`, con subtotal calculado. Actualiza el badge del header.
- Se re-hidrata en cada carga de página y tras cada View Transition.
- Todos los botones "Sumar a cotización" (catálogo, rebajes, configurador) llaman a la **misma** API
  de `cart.ts`.
- **Salida hoy:** cotización por WhatsApp/formulario (igual que la landing actual).
- **Salida a futuro:** el mismo carrito deriva a `/checkout` + pasarela, sin rehacer el modelo.

## 8. Preparación para pagos (no se implementa en esta etapa)

- **Modo `hybrid`** ya configurado: permite endpoints/páginas server-rendered cuando se necesiten.
- **Carrito checkout-ready** (sección 7).
- **Carpetas reservadas y documentadas, vacías hoy:**
  - `src/pages/api/` → endpoints de servidor (crear transacción, retorno/webhook de la pasarela).
  - `src/lib/payments/` → adaptador de pasarela con interfaz genérica (para no acoplarse a un proveedor;
    candidatos en Chile: Webpay/Transbank, Mercado Pago, Flow, Khipu).
  - `.env.example` → variables esperadas (claves de comercio) sin valores reales; `.env` ignorado por git.

## 9. SEO y assets

- `BaseLayout` recibe props `title` / `description` / `og` por página; cada página define los suyos
  (hoy hay un único set de meta para todo el sitio).
- Se agrega `@astrojs/sitemap` y un `robots.txt`.
- Imágenes: se migran logos y las imágenes útiles de `Imagenes de la pagina vieja/` a `public/images/`,
  optimizadas. Las no usadas quedan fuera del repo.

## 10. Despliegue (Hostinger)

- **Etapa actual:** `npm run build` → `dist/` (estático) → publicar en Hostinger (FTP o Git). Sin runtime.
- **Etapa con pagos:** activar el adapter Node de Astro y correr como app Node en Hostinger; las
  páginas de contenido siguen estáticas, solo los endpoints de pago corren en servidor.

## 11. Estrategia de migración

- **Port fiel 1:1:** mismo diseño visual y mismas features; refactor, no rediseño.
- Trabajo **página por página**, con commits incrementales.
- `legacy/index.html` se conserva como referencia hasta verificar paridad visual/funcional, y se
  elimina al cerrar la migración.

## 12. Fuera de alcance (en esta etapa)

- Implementación real de pagos / checkout / pasarela.
- Páginas de detalle por producto.
- Cuentas de usuario / login.
- Redacción de artículos de blog (contenido a aportar por el cliente).
- Rediseño visual (se mantiene el diseño actual).

## 13. Criterios de éxito

- Las 6 secciones del navbar son páginas independientes navegables; existe `/catalogo`.
- Header/Footer/Topbar definidos una sola vez y compartidos.
- Datos centralizados en `src/data/`; cambiar un precio se hace en un solo lugar.
- El cotizador persiste entre páginas (localStorage) y mantiene el conteo en el badge.
- Paridad visual y funcional con la landing actual.
- `npm run build` genera `dist/` publicable en Hostinger.
- Estructura lista para sumar pagos de forma incremental.
