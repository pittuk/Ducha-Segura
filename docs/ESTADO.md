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
- `npm run build` → **10 páginas** generadas en `dist/`, sin warnings.
- Rama: **`main`** (la rama de trabajo `feat/migracion-astro` ya se mergeó y eliminó).

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

**Rutas:** `/` · `/catalogo` (filtro: Todos/Rebajes/Kits/Accesorios) · `/rebaje` · `/kits` · `/accesorios` · `/convenios` · `/blog` (listado) · **`/<slug>` (posts del blog, en la RAÍZ)** · `404`.

> **Blog — URLs:** los posts se sirven en la **raíz** `/<slug>/` (vía `src/pages/[slug].astro`), igual que en el WordPress original, para **preservar la indexación**. El listado vive en `/blog`. Las páginas estáticas (`/rebaje`, `/accesorios`, etc.) tienen prioridad sobre la ruta dinámica.

**Menú (`NAV` en `src/data/site.ts`):** Inicio · **Rebajes ▾ (→ Kits)** · Accesorios · Blog · Convenios. **`/catalogo` NO va en el menú** (decisión del cliente); se llega vía los CTA "Ver todo el catálogo" (home `ProductosTeaser`, `PrefooterCta`). El desplegable es CSS-only (hover/focus en desktop; subítems indentados en el drawer móvil). **Taxonomía:** Rebajes = `products.ts`; Accesorios = `accesorios.ts` (7 reales); Kits = `kits.ts` (4: kit rebaje+barra, kit cortina, set antideslizante, rebaje con puerta estanca). Kits y accesorios comparten `AccessoryCard`.

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

## 6. Pendientes (para continuar)

1. **Imágenes reales de producto/secciones.**
   - ✅ **Hecho: tarjetas de producto** (`ProductCard`). Las 3 (Tradicional, Jacuzzi, Spa XL) usan imágenes reales optimizadas con el componente `<Image>` de Astro. Fuentes en `src/assets/productos/`; mapeo `id → { src, fit, alt }` en `src/data/products-media.ts` (con fallback al placeholder para productos sin foto). Spec/plan: `docs/superpowers/{specs,plans}/2026-05-28-imagenes-reales-productos*`.
   - ✅ **Hecho: accesorios y kits** (`AccessoryCard`). Imágenes reales vía `<img>` desde `public/images/accesorios/<carpeta>/` (campo `image` + `fit` en los datos). Ver punto de **precios provisionales** abajo.
   - ✅ **Hecho: blog** — las tarjetas y los posts usan la **imagen destacada real** importada de WordPress (ver punto del blog abajo).
   - ⏳ **Pendiente:** hero (`[FOTO BAÑO ACCESIBLE]`) y prensa (`Prensa`) siguen con placeholders de texto. Fuente: `../Imagenes de la pagina vieja/imagenes_descargadas/`. Patrón: fotos pesadas → `src/assets/` + `<Image>`; logos/íconos chicos → `public/images/` + `<img>`.
2. **⚠️ Precios provisionales de accesorios y kits.** `src/data/accesorios.ts` y `src/data/kits.ts` traen precios **temporales** (marcados con `// TODO precio provisional`). **Confirmar/corregir antes de desplegar.**
3. **Nombres de archivo de imágenes de accesorios = frágiles.** Algunas imágenes están con nombres de exportación genéricos (`Mesa-de-trabajo-1-copia-N.png`); las rutas en los datos apuntan a esos nombres exactos. Si se vuelven a exportar/renombrar, las rutas se rompen. Recomendado: renombrar a nombres estables (kebab-case) por accesorio y actualizar los `image` una sola vez.
4. **✅ Blog migrado desde WordPress.** Se importaron **50 entradas reales** (reemplazando los 3 stubs) con la API REST de `duchasegura.cl`. Cada post es un `.md` en `src/content/blog/<slug>.md` (frontmatter + HTML del cuerpo, renderizado con `set:html`) e imágenes en `public/images/blog/<slug>/`.
   - **Re-sincronizar / traer nuevos posts:** `scripts/import-blog.mjs`. Requiere credenciales por entorno (NO en el repo): `$env:WP_USER` y `$env:WP_APP_PASSWORD` (contraseña de aplicación de WordPress). Reescribe los `.md` y baja imágenes nuevas.
   - **Imágenes de Google expiradas:** 4 posts traían imágenes de `lh*.googleusercontent.com` ya caídas en el origen; se removieron esos `<figure>`. Los embeds de YouTube se conservan.
   - **⚠️ Video testimonial pesado:** un post (`ducha-segura-en-medios…`) incluye `IMG_6508.mov` (**~40 MB**) descargado a `public/images/blog/.../`. Conviene **convertirlo a mp4 o subirlo a YouTube** y reemplazar el `<video>` (reduce el peso del repo y mejora compatibilidad).
   - **⚠️ Canonical www vs no-www:** `astro.config.mjs` usa `site: 'https://www.duchasegura.cl'` (**con www**) pero las URLs indexadas del WordPress son **sin www** (`https://duchasegura.cl/<slug>/`). Definir el host canónico y, si corresponde, cambiar `site` a no-www + configurar el redirect 301 en Hostinger para no dividir señales de SEO.
5. **Página `/convenios` — bloque de descuentos por banco.** Arriba lista "Santander 15% · BCI 8% · BancoEstado 5%" (viene de `DISCOUNTS` en `lib/pricing`, usado también por la calculadora). No está alineado 1:1 con los 8 logos reales. Revisar si se ajusta.
6. **Pagos online (futuro).** Todo el andamiaje está reservado y documentado en [`docs/PAYMENTS.md`](PAYMENTS.md): pasar a `output` con adapter Node, implementar `src/lib/payments/<proveedor>.ts`, endpoints en `src/pages/api/`, página `/checkout`. Candidatos en Chile: Webpay/Transbank, Mercado Pago, Flow, Khipu.
7. **Poster del video (opcional):** si se cambia el video, regenerar el poster (hoy se extrajo con un script headless puntual; no quedó herramienta instalada).

## 7. Documentos de referencia

- [`README.md`](../README.md) — cómo correr, estructura, despliegue.
- [`docs/PAYMENTS.md`](PAYMENTS.md) — guía para activar pagos a futuro.
- [`docs/superpowers/specs/2026-05-27-arquitectura-modular-astro-design.md`](superpowers/specs/2026-05-27-arquitectura-modular-astro-design.md) — diseño/spec aprobado.
- [`docs/superpowers/plans/2026-05-27-arquitectura-modular-astro.md`](superpowers/plans/2026-05-27-arquitectura-modular-astro.md) — plan de implementación (17 tareas).

## 8. Historial de commits (resumen)

Migración en 17 tareas + ajustes de UI. Los últimos commits (más reciente arriba):

```
c1acbbb feat(home): poster del video
3e1f754 fix(home): tarjeta de video con tamaño 0 (margin:auto en grid)
d7175bd fix(home): tarjeta de video a 9:16 sin recorte
0aa8aa4 fix(home): overlay del video se oculta al reproducir
9c38c06 feat(home): video real + assets de convenios versionados
ebf7c6a feat(ui): logo 85px, h1 hero 45px, logos reales de convenios
f9c67ac chore: retirar legacy/index.html
... (ver `git log` para el detalle completo de las 17 tareas de migración)
```
