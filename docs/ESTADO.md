# Estado del proyecto — Ducha Segura® (sitio web)

> **Última actualización:** 2026-05-28
> **Propósito de este documento:** dejar registrado todo lo hecho para retomar mañana con contexto completo.

---

## 1. Resumen de una línea

Migración **completa** de la landing monolítica (`index.html`) a un sitio **Astro 5 modular, multipágina y estático**, ya integrado en `main`. Tests/checks/build en verde. Quedan tareas de **contenido** (imágenes reales y textos de blog), no de arquitectura.

## 2. Cómo correr el proyecto (IMPORTANTE)

El proyecto vive en la subcarpeta **`Sitio Web/`** (no en la raíz `Ducha segura/`). Hay que ejecutar todo desde ahí:

```powershell
cd "d:\Documentos\AgenciaDos\Ducha segura\Sitio Web"
npm install      # solo la primera vez
npm run dev      # http://localhost:4321/
```

- **Tip:** abrir VS Code directamente en `Sitio Web/` (File → Open Folder) para que la terminal arranque en el lugar correcto. Si se corre `npm run dev` desde la raíz `Ducha segura/` falla (no hay `package.json` ahí).
- Si el puerto 4321 aparece "in use", suele ser un `astro dev` huérfano de una sesión anterior; matar el proceso node o usar el puerto que Astro elija (4322, 4323…).
- Otros scripts: `npm test` (Vitest), `npm run build` (genera `dist/`), `npm run preview` (sirve el build).
- Node requerido: `18.20.8 || ^20.3.0 || >=22.0.0`.

## 3. Estado verificado (a la fecha)

- `npm test` → **12/12** tests OK (pricing + cart).
- `npx astro check` → **0 errores / 0 warnings / 0 hints**.
- `npm run build` → **81 páginas** generadas en `dist/`, sin warnings (catálogo WooCommerce + 16 fichas de producto + 50 posts de blog + páginas estáticas).
- Rama: **`main`**. Las ramas de trabajo `feat/migracion-astro`, `kits`, `blog`, `carrito`, `productos` ya se mergearon y eliminaron. No hay remoto configurado → todo vive en el `main` local (sin `git push`).

## 4. Qué se construyó (arquitectura)

Stack: **Astro 5** estático (`output: 'static'`) + TypeScript + Vitest + `@astrojs/sitemap`. Despliegue: subir `dist/` a **Hostinger** (estático).

```
Sitio Web/
├─ src/
│  ├─ data/        Fuente única de datos: products, accesorios, convenios, comunas, prensa, testimonios, hero, site
│  ├─ lib/         Lógica pura testeada: pricing.ts, cart.ts, format.ts  | payments/ (RESERVADO, sin implementar)
│  ├─ scripts/     JS de cliente: ui.ts, cart.ts, configurator.ts, calculator.ts, catalog-filter.ts, dom.ts
│  ├─ components/  Header, Footer, Topbar, Icons, Hero, ProductCard, AccessoryCard, QuoteDrawer, Toast, WhatsappFab,
│  │               Configurator, Calculator, ConveniosMarquee, ComoFunciona, Diferenciadores, Prensa, Testimonios,
│  │               BlogTeaser, BlogCard, PrefooterCta, CategoryTabs
│  ├─ layouts/     BaseLayout.astro (head/SEO, fuentes, ViewTransitions, Header/Footer/cotizador)
│  ├─ content/     blog/ (3 artículos Markdown) + content.config.ts (glob loader)
│  ├─ pages/       index, catalogo, rebajes, accesorios, convenios, blog/index, blog/[slug], 404 | api/ (RESERVADO)
│  └─ styles/      tokens.css (design tokens) + base.css (reset + utilidades globales)
├─ public/         images/ (logos + favicon + logo-convenios/) · videos/ (video + poster)
└─ docs/           ESTADO.md (este archivo) · PAYMENTS.md · superpowers/specs · superpowers/plans
```

**Rutas:** `/` · `/catalogo` (filtro: Todos/Rebajes/Kits/Accesorios) · `/rebaje-de-tina` · `/kits` · `/accesorios` · `/convenios` · `/blog` (listado) · `/terminos-y-condiciones-ducha-segura` · `/accion-social` · **`/producto/<slug>` (ficha de producto, 16)** · **`/<slug>` (posts del blog, en la RAÍZ)** · `404`.

> **Slugs alineados con WordPress** (para preservar indexación): `/rebaje-de-tina`, `/accesorios`, `/convenios`, `/blog`, `/terminos-y-condiciones-ducha-segura`, `/accion-social` y `/` coinciden con los slugs reales del WP. `/kits` y `/catalogo` son **nuevos** (no existían en WP).
>
> **Páginas WP portadas con contenido real** (vía `scripts/import-pages.mjs`, extrae el contenido de Elementor y lo limpia → `src/data/paginas/<slug>.{html,meta.json}`, renderizado con el componente `Prose`): `/terminos-y-condiciones-ducha-segura`, `/accion-social`.
> **Páginas WP aún pendientes:** `/cotizar/`, `/finalizar-cotizacion/`, `/gracias-por-contactarnos/`.

> **Blog — URLs:** los posts se sirven en la **raíz** `/<slug>/` (vía `src/pages/[slug].astro`), igual que en el WordPress original, para **preservar la indexación**. El listado vive en `/blog`. Las páginas estáticas (`/rebaje-de-tina`, `/accesorios`, etc.) tienen prioridad sobre la ruta dinámica.

**Menú (`NAV` en `src/data/site.ts`):** Inicio · Rebajes (`/rebaje-de-tina`) · **Catálogo ▾ (`/catalogo`) → Accesorios, Kits** · Blog · Convenios. El desplegable es CSS-only (hover/focus en desktop; subítems indentados en el drawer móvil). `/catalogo` también es accesible vía los CTA "Ver todo el catálogo" (home `ProductosTeaser`, `PrefooterCta`). **Catálogo desde WooCommerce (fuente única):** los 15 productos vienen de la API WC (`scripts/import-woo.mjs` → `src/data/productos.json`; wrapper `src/data/productos.ts` con tipos, agrupaciones `REBAJES`/`KITS`/`ACCESORIOS`, overrides de imagen de rebajes y el **Spa XL** curado, que no existe en WC). Grupo por producto: rebaje · kit · accesorio. Todas las tarjetas usan **`ProductoCard`** con **ícono de vista rápida → modal `QuickView`**. Cada producto tiene su **ficha** en `/producto/<slug>` (slug real de WC, indexación preservada). Re-sincronizar: `$env:WC_CK`/`$env:WC_CS` + `node scripts/import-woo.mjs`. *(Se retiraron `products.ts`/`accesorios.ts`/`kits.ts`/`ProductCard`/`AccessoryCard`.)*

**Decisiones clave:**
- **Datos centralizados** en `src/data/`: cambiar un precio/nombre = un solo archivo.
- **Lógica pura** (precios, descuentos, cuotas, carrito) en `src/lib/` con tests; el DOM/glue vive en `src/scripts/`.
- **Cotizador cross-page**: persiste en `localStorage` (clave `ds_cart`), badge en el header, deriva a WhatsApp. Modelo de item checkout-ready (`unitPrice`).
- **Cross-navigation (View Transitions):** los listeners a nivel `document`/`window` se guardan con banderas de módulo (NO `body.dataset`, porque Astro reemplaza el `<body>` en cada swap). Patrón en `src/scripts/ui.ts` y `cart.ts`.
- **Estilos:** tokens + utilidades globales en `src/styles/`; estilos específicos *scoped* por componente. Grillas de tarjetas (`.product-grid`, `.acc-grid`, `.blog-grid`) son utilidades globales.

## 5. Ajustes de UI posteriores a la migración (hechos hoy)

- **Logo** en navbar y footer a **85px** (el header creció a 110px / 92px en móvil para que respire). Sin texto al lado del logo (decisión del cliente).
- **H1 del hero** fijado en **45px** (34px en móvil).
- **Convenios:** se reemplazaron los placeholders por **8 logos reales** en `public/images/logo-convenios/` (Santander, Banco de Chile, SURA, Municipalidad de Las Condes, Ñuñoa, Providencia, La Reina, Estadio Español de Chiguayante). Render con `<img>` en el marquee de la home y en `/convenios`. Datos en `src/data/convenios.ts` (`{ name, logo }`).
- **Video** en la sección "Cuatro pasos. Un solo día." (`ComoFunciona.astro`):
  - Video real `public/videos/Tiposde-Tinas-Ducha-Segura-Rebaje-de-Tina.mp4` (vertical 720×1280, 9:16).
  - Tarjeta a `aspect-ratio:9/16` con `width:min(340px,100%)` + `justify-self:center` → se ve completo, sin recorte.
  - Botón de play central que se oculta al reproducir (evento `play`); controles nativos abajo al darle play.
  - **Poster**: `public/videos/…-poster.jpg` (frame del fundador) — se muestra antes de reproducir.
  - Caption: "Tipos de Tinas - Ducha Segura® - Rebaje de Tina".

## 5b. Trabajo posterior (catálogo WooCommerce, fichas y ajustes finos)

Bloque hecho tras la migración base (commits `8e34d98` → `e6d5b67`):

- **Navegación:** menú reorganizado a **Catálogo ▾ (Accesorios, Kits)** con Rebajes como enlace simple a `/rebaje-de-tina`. Navbar a **85px**, topbar a **35px**.
- **Catálogo desde WooCommerce (fuente única, fin de precios provisionales):** `scripts/import-woo.mjs` → `src/data/productos.json` (15 productos WC) + wrapper `src/data/productos.ts` (tipos, `REBAJES`/`KITS`/`ACCESORIOS`, overrides de imagen de rebajes y el **Spa XL** curado que no está en WC). Tarjeta única `ProductoCard`.
- **Fichas de producto:** `/producto/<slug>` (16, slug real de WC para preservar indexación) con descripción (`Prose`), garantías y "Productos relacionados". `src/pages/producto/[slug].astro`.
- **Vista rápida:** ícono en cada tarjeta → modal `QuickView` (`src/components/QuickView.astro` + `src/scripts/quickview.ts`). Imagen full-bleed al lado izquierdo, categoría, precio, extracto, garantías, "Agregar"/"Ver ficha". El "Agregar" reusa la delegación `[data-add-producto]` del carrito.
- **Carrito (drawer):** thumbnails con imagen real, tira **"Complementa tu rebaje"** para sumar accesorios desde el drawer, layout compacto. Estilos del drawer en `<style is:global>` (los ítems se inyectan por JS y el scoped no los alcanza).
- **Páginas WP portadas:** `/terminos-y-condiciones-ducha-segura` y `/accion-social` (esta última **rediseñada a mano** con el lineamiento del sitio). Footer "Términos y condiciones" enlaza con barra final.
- **Prensa real:** 5 logos en `public/images/prensa/` (LUN, Diario La Estrella, Radio Bío Bío, NexNews, Radio Festival de Valparaíso); datos en `src/data/prensa.ts`, render en `Prensa.astro`.
- **Tipografía/UI:** títulos de calculadora y prefooter a **55px**; precio de tarjeta en **azul/bold** (diferenciado del nombre); subtítulos de ficha a 26px.
- **Íconos:** logo de **WhatsApp relleno** (se veía roto porque el sistema `.ic` es de trazo; el glifo lleva `fill=currentColor` para anularlo) en todo el sitio; **redes del footer** con íconos reales (Instagram/Facebook/LinkedIn/X) en vez de texto. `src/components/Icons.astro` + `Footer.astro`.

## 6. Pendientes (para continuar)

1. **Imágenes reales de producto/secciones.**
   - ✅ **Hecho: tarjetas de producto** (`ProductCard`). Las 3 (Tradicional, Jacuzzi, Spa XL) usan fotos reales en `public/images/rebajes/` vía `<img>`; mapeo `id → { image, fit, alt }` en `src/data/products-media.ts` (con fallback al placeholder). *(Se retiró el pipeline `<Image>`/`src/assets/productos` anterior.)* Spec/plan inicial: `docs/superpowers/{specs,plans}/2026-05-28-imagenes-reales-productos*`.
   - ✅ **Hecho: hero** (`Hero.astro`). El comparador antes/después usa imágenes reales del mismo baño (`background-image`): **antes** = `Rebaje Tina Tradicional antes.webp` (tina intacta), **después** = `Rebaje Tina Tradicional.webp` (rebaje instalado). El "antes" se convirtió de PNG 5.7MB a webp 171KB (sharp) por rendimiento.
   - ✅ **Hecho: productos, accesorios y kits** — ahora vienen de **WooCommerce** (imágenes, nombres y **precios reales**) y se renderizan con `ProductoCard`. (Reemplaza `AccessoryCard`/`public/images/accesorios`.)
   - ✅ **Hecho: blog** — tarjetas y posts usan la **imagen destacada real** de WordPress (ver punto del blog abajo).
   - ✅ **Hecho: prensa** (`Prensa`) — 5 logos reales en `public/images/prensa/`, datos en `src/data/prensa.ts`.
   - ✅ **Imágenes reales completas.** No quedan secciones con placeholders de imagen.
2. **✅ Precios reales (resuelto).** Productos/accesorios/kits ahora usan los **precios de WooCommerce** (se acabaron los provisionales). El catálogo, las fichas y la vista rápida los usan. El **Spa XL** queda "a medida" (sin precio fijo, deriva a cotizar).
4. **✅ Blog migrado desde WordPress.** Se importaron **50 entradas reales** (reemplazando los 3 stubs) con la API REST de `duchasegura.cl`. Cada post es un `.md` en `src/content/blog/<slug>.md` (frontmatter + HTML del cuerpo, renderizado con `set:html`) e imágenes en `public/images/blog/<slug>/`.
   - **Re-sincronizar / traer nuevos posts:** `scripts/import-blog.mjs`. Requiere credenciales por entorno (NO en el repo): `$env:WP_USER` y `$env:WP_APP_PASSWORD` (contraseña de aplicación de WordPress). Reescribe los `.md` y baja imágenes nuevas.
   - **Imágenes de Google expiradas:** 4 posts traían imágenes de `lh*.googleusercontent.com` ya caídas en el origen; se removieron esos `<figure>`. Los embeds de YouTube se conservan.
   - **⚠️ Video testimonial pesado:** un post (`ducha-segura-en-medios…`) incluye `IMG_6508.mov` (**~40 MB**) descargado a `public/images/blog/.../`. Conviene **convertirlo a mp4 o subirlo a YouTube** y reemplazar el `<video>` (reduce el peso del repo y mejora compatibilidad).
   - **⚠️ Canonical www vs no-www:** `astro.config.mjs` usa `site: 'https://www.duchasegura.cl'` (**con www**) pero las URLs indexadas del WordPress son **sin www** (`https://duchasegura.cl/<slug>/`). Definir el host canónico y, si corresponde, cambiar `site` a no-www + configurar el redirect 301 en Hostinger para no dividir señales de SEO.
5. **✅ Página `/convenios` rediseñada.** Tarjetas (`ConvenioCard`) con los **12 convenios reales** del WP (logo, % de descuento, beneficiarios, precios/condiciones, zona y vigencia). Datos en `src/data/convenios.ts` (interfaz ampliada: `name, logo, beneficiarios, descuento, detalle[], zona?, vigencia?`). El marquee de la home (`ConveniosMarquee`) ahora muestra los 12 logos. Nota: `DISCOUNTS` en `lib/pricing` sigue usándose **solo** en la calculadora (no en /convenios).
6. **Pagos online (futuro).** Todo el andamiaje está reservado y documentado en [`docs/PAYMENTS.md`](PAYMENTS.md): pasar a `output` con adapter Node, implementar `src/lib/payments/<proveedor>.ts`, endpoints en `src/pages/api/`, página `/checkout`. Candidatos en Chile: Webpay/Transbank, Mercado Pago, Flow, Khipu.
7. **Poster del video (opcional):** si se cambia el video, regenerar el poster (hoy se extrajo con un script headless puntual; no quedó herramienta instalada).
8. **⏳ Reseñas de Google (DIFERIDO — retomar otro día).** Los 4 testimonios de `src/data/testimonios.ts` son **ficticios** (placeholders). El cliente quiere usar las reseñas **reales** de Google (perfil: link `https://share.google/Byq8WeqhhDqYszZIb`).
   - **Hallazgo:** no existe una API **gratuita y confiable** para esto. Google Places API exige cuenta con *billing* y solo devuelve **5** reseñas que elige Google; las APIs de terceros (SerpApi/Outscraper) son **de pago**; scrapear Maps está bloqueado y va contra ToS. Como el sitio es **estático** (sin backend), no hay llamada a API en runtime de todos modos.
   - **Plan acordado (gratis y robusto): captura manual.** El cliente envía **capturas o el texto** de las reseñas; se transcriben a `testimonios.ts`. Antes de cargarlas, **ampliar la interfaz `Testimonio`** para incluir `rating` (estrellas), `date` y `source: 'Google'`, y mostrar estrellas + badge "Reseña de Google" en `Testimonios.astro` para dar aspecto de reseña verificada.
   - Se creó y borró la rama vacía `review` (no llegó a haber cambios).

## 7. Documentos de referencia

- [`README.md`](../README.md) — cómo correr, estructura, despliegue.
- [`docs/PAYMENTS.md`](PAYMENTS.md) — guía para activar pagos a futuro.
- [`docs/superpowers/specs/2026-05-27-arquitectura-modular-astro-design.md`](superpowers/specs/2026-05-27-arquitectura-modular-astro-design.md) — diseño/spec aprobado.
- [`docs/superpowers/plans/2026-05-27-arquitectura-modular-astro.md`](superpowers/plans/2026-05-27-arquitectura-modular-astro.md) — plan de implementación (17 tareas).

## 8. Historial de commits (resumen)

Migración en 17 tareas + ajustes de UI + catálogo WooCommerce. Los últimos commits (más reciente arriba):

```
e6d5b67 fix(icons): logo de WhatsApp relleno + íconos de redes en el footer
1c8e192 style(ficha,card): subtítulos de ficha 26px + precio de tarjeta en azul
a34efd8 style: títulos calculadora y prefooter a 55px + imagen del modal full-left
1316b75 feat: ajustes — prensa real, productos relacionados, vista rápida ampliada
f3ccc65 feat(productos): catálogo desde WooCommerce + fichas /producto/<slug> + vista rápida
68ce92e fix(footer): "Términos y condiciones" → /terminos-y-condiciones-ducha-segura/
4f6ab07 feat(accion-social): rediseño completo con el lineamiento del sitio
ae40dec feat(convenios): rediseñar /convenios con los 12 convenios reales del WordPress
cc7ec03 feat(paginas): portar /terminos-y-condiciones y /accion-social desde WordPress
7a5c3c3 fix(seo): slug /rebaje → /rebaje-de-tina (URL indexada en WordPress)
a85b14f feat(carrito): thumbnails reales + agregar accesorios desde el drawer (+2 fix carrito)
467fa96 feat(catalogo,rebaje): layout destacado del Spa XL (2 arriba + featured full-width)
dc64247 feat(nav): reorganizar menú — Catálogo ▾ (Accesorios, Kits)
58583f8 style: navbar a 85px y topbar a 35px (desktop)
c1acbbb feat(home): poster del video  ·  (… ver `git log` para el detalle completo)
```
