# Imágenes reales en tarjetas de producto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los placeholders de texto de las 3 tarjetas de producto del catálogo por imágenes reales optimizadas.

**Architecture:** Las 3 imágenes fuente se copian a `src/assets/productos/` (para que el pipeline de Astro las optimice). Un módulo nuevo `src/data/products-media.ts` mapea `id → { src, fit, alt }` importando esas imágenes; `products.ts` queda intacto para no romper Vitest. `ProductCard.astro` renderiza `<Image>` cuando hay media para el producto y mantiene el placeholder (degradado + label) como fallback.

**Tech Stack:** Astro 5 (`astro:assets` / componente `<Image>`), TypeScript, CSS scoped. Verificación: `npx astro check`, `npm run build`, `npm test`, revisión visual en `npm run dev`.

**Spec:** [`docs/superpowers/specs/2026-05-28-imagenes-reales-productos-design.md`](../specs/2026-05-28-imagenes-reales-productos-design.md)

---

## File Structure

- **Create:** `src/assets/productos/rebaje-tradicional.png` — recorte sin fondo (producto Tradicional).
- **Create:** `src/assets/productos/rebaje-jacuzzi.webp` — antes/después de jacuzzi real (producto Jacuzzi).
- **Create:** `src/assets/productos/rebaje-spa.webp` — tina grande real (producto Spa XL).
- **Create:** `src/data/products-media.ts` — mapa `PRODUCT_MEDIA` (id → imagen optimizable + fit + alt).
- **Modify:** `src/components/ProductCard.astro` — render condicional de `<Image>` + estilos scoped.

> Nota de entorno: el shell es **PowerShell** en Windows. Los comandos de copia usan `Copy-Item`. La carpeta fuente está **fuera del repo**: `..\Imagenes de la pagina vieja\imagenes_descargadas\` (relativa a la raíz del proyecto `Sitio Web`).

---

## Task 1: Copiar las 3 imágenes fuente al repo

**Files:**
- Create: `src/assets/productos/rebaje-tradicional.png`
- Create: `src/assets/productos/rebaje-jacuzzi.webp`
- Create: `src/assets/productos/rebaje-spa.webp`

- [ ] **Step 1: Crear la carpeta de destino**

Run (PowerShell, desde la raíz `Sitio Web`):
```powershell
New-Item -ItemType Directory -Force src\assets\productos
```
Expected: crea (o confirma) el directorio `src\assets\productos`.

- [ ] **Step 2: Copiar y renombrar las 3 imágenes**

Run:
```powershell
$src = "..\Imagenes de la pagina vieja\imagenes_descargadas"
Copy-Item "$src\EDIT_sin-fondo_1.png"     "src\assets\productos\rebaje-tradicional.png"
Copy-Item "$src\ANTES-DESPUES-2.2.webp"   "src\assets\productos\rebaje-jacuzzi.webp"
Copy-Item "$src\DSC01313-scaled.webp"     "src\assets\productos\rebaje-spa.webp"
```
Expected: 3 archivos creados, sin errores.

- [ ] **Step 3: Verificar que existen los 3 archivos**

Run:
```powershell
Get-ChildItem src\assets\productos | Select-Object Name, Length
```
Expected: lista con `rebaje-tradicional.png`, `rebaje-jacuzzi.webp`, `rebaje-spa.webp`, cada uno con `Length` > 0.

- [ ] **Step 4: Commit**

```powershell
git add src/assets/productos
git commit -m "feat(catalogo): agregar imágenes fuente de productos (assets)"
```

---

## Task 2: Crear el módulo de media de productos

**Files:**
- Create: `src/data/products-media.ts`

- [ ] **Step 1: Escribir `src/data/products-media.ts`**

```ts
import type { ImageMetadata } from 'astro';
import tradicional from '../assets/productos/rebaje-tradicional.png';
import jacuzzi from '../assets/productos/rebaje-jacuzzi.webp';
import spa from '../assets/productos/rebaje-spa.webp';

export interface ProductMedia {
  src: ImageMetadata;
  fit: 'contain' | 'cover';
  alt: string;
}

// Mapa id de producto → imagen. Importa assets, por eso vive aparte de
// products.ts (que debe quedar libre de imports de imágenes para Vitest).
export const PRODUCT_MEDIA: Record<string, ProductMedia> = {
  tradicional: {
    src: tradicional,
    fit: 'contain',
    alt: 'Pieza de rebaje de tina Ducha Segura, vista de producto',
  },
  jacuzzi: {
    src: jacuzzi,
    fit: 'cover',
    alt: 'Antes y después: rebaje instalado en una tina jacuzzi',
  },
  spa: {
    src: spa,
    fit: 'cover',
    alt: 'Tina grande con rebaje de acceso instalado',
  },
};
```

- [ ] **Step 2: Verificar tipos con astro check**

Run:
```powershell
npx astro check
```
Expected: `0 errors, 0 warnings, 0 hints`. (Astro resuelve los imports de imágenes y `ImageMetadata`.)

- [ ] **Step 3: Confirmar que los tests siguen verdes (no se filtró el import de assets)**

Run:
```powershell
npm test
```
Expected: `12 passed` (12/12). Si fallara por resolver un `.webp`/`.png`, es señal de que `products-media.ts` se importó desde la cadena de tests; en ese caso revisar que nada en `src/lib` ni en los tests importe `products-media.ts`.

- [ ] **Step 4: Commit**

```powershell
git add src/data/products-media.ts
git commit -m "feat(catalogo): mapa de imágenes por producto (PRODUCT_MEDIA)"
```

---

## Task 3: Renderizar la imagen en ProductCard con fallback

**Files:**
- Modify: `src/components/ProductCard.astro` (frontmatter, bloque `.product-card__media`, y `<style>`)

- [ ] **Step 1: Ampliar el frontmatter**

Reemplazar el frontmatter actual:
```astro
---
import type { Product } from '../data/products';
import { clp } from '../lib/format';
interface Props { product: Product; }
const { product } = Astro.props;
---
```
por:
```astro
---
import type { Product } from '../data/products';
import { clp } from '../lib/format';
import { Image } from 'astro:assets';
import { PRODUCT_MEDIA } from '../data/products-media';
interface Props { product: Product; }
const { product } = Astro.props;
const media = PRODUCT_MEDIA[product.id];
---
```

- [ ] **Step 2: Render condicional en el bloque de media**

Reemplazar el bloque actual:
```astro
  <div class="product-card__media" style={`background:linear-gradient(180deg,${product.accent}33 0%,${product.accent}cc 100%)`}>
    <div class="product-card__media-inner"></div>
    <div class="product-card__media-label">[{product.label}]</div>
    <div class="product-card__badge"><span class={`badge badge--${product.badgeColor}`}>{product.badge}</span></div>
    <div class="product-card__chip-r">{product.medidas}</div>
  </div>
```
por:
```astro
  <div
    class:list={['product-card__media', { 'product-card__media--photo': media }]}
    style={media ? undefined : `background:linear-gradient(180deg,${product.accent}33 0%,${product.accent}cc 100%)`}
  >
    {media ? (
      <Image
        src={media.src}
        alt={media.alt}
        class:list={['product-card__img', `product-card__img--${media.fit}`]}
        widths={[400, 700, 1000]}
        sizes="(max-width:768px) 100vw, 420px"
      />
    ) : (
      <>
        <div class="product-card__media-inner"></div>
        <div class="product-card__media-label">[{product.label}]</div>
      </>
    )}
    <div class="product-card__badge"><span class={`badge badge--${product.badgeColor}`}>{product.badge}</span></div>
    <div class="product-card__chip-r">{product.medidas}</div>
  </div>
```

- [ ] **Step 3: Agregar estilos scoped para la imagen**

En el bloque `<style>`, justo después de la regla `.product-card__media-inner{...}`, agregar:
```css
.product-card__media--photo{background:#fff}
.product-card__img{position:absolute;inset:0;width:100%;height:100%;display:block}
.product-card__img--cover{object-fit:cover}
.product-card__img--contain{object-fit:contain;padding:18px}
```

- [ ] **Step 4: Verificar tipos con astro check**

Run:
```powershell
npx astro check
```
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step 5: Build de producción**

Run:
```powershell
npm run build
```
Expected: build OK, 10 páginas generadas, sin warnings. En `dist/_astro/` deben aparecer variantes optimizadas de las imágenes de producto.

- [ ] **Step 6: Commit**

```powershell
git add src/components/ProductCard.astro
git commit -m "feat(catalogo): tarjetas de producto con imagen real (Astro Image) + fallback"
```

---

## Task 4: Verificación visual y regresión

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Levantar el dev server**

Run:
```powershell
npm run dev
```
Expected: sirve en `http://localhost:4321/` (o el puerto que elija Astro).

- [ ] **Step 2: Revisar la home (`/`)**

Abrir `http://localhost:4321/` y confirmar en la sección de productos (teaser):
- Tradicional: recorte sobre fondo blanco, **completo** (sin recorte), centrado.
- Jacuzzi: foto del jacuzzi llenando la tarjeta (`cover`).
- Spa XL (featured): foto de tina grande en formato ancho 21:9, llenando sin deformar.
- En las 3: los chips de **badge** (arriba-izq.) y **medidas** (arriba-der.) siguen visibles y legibles sobre la imagen.

- [ ] **Step 3: Revisar el catálogo (`/catalogo`)**

Abrir `http://localhost:4321/catalogo` y confirmar lo mismo en la grilla; probar el filtro por categoría y ver que las imágenes se mantienen correctas. Revisar en viewport móvil (DevTools, ~375px) que el featured pasa a 4:3 y las imágenes siguen bien.

- [ ] **Step 4: Suite de tests (regresión)**

Run:
```powershell
npm test
```
Expected: `12 passed` (12/12).

- [ ] **Step 5: Actualizar el handoff (ESTADO.md)**

En [`docs/ESTADO.md`](../../ESTADO.md), en la sección **6. Pendientes**, marcar el avance del punto 1 (imágenes): las tarjetas de producto ya usan fotos reales; quedan pendientes accesorios, hero, prensa y blog. Ajustar el texto para reflejarlo.

- [ ] **Step 6: Commit**

```powershell
git add docs/ESTADO.md
git commit -m "docs: actualizar ESTADO.md (tarjetas de producto con imágenes reales)"
```

---

## Notas de implementación

- **Fallback:** productos sin entrada en `PRODUCT_MEDIA` conservan el placeholder (degradado + `label`). No borrar los campos `label`/`accent` de `products.ts`.
- **No re-declarar clases globales** de `base.css` en el `<style>` scoped (`.container .btn .product-grid`, etc.).
- **Jacuzzi:** `ANTES-DESPUES-2.2.webp` trae texto/marca de agua incrustados; en `cover` 4:3 puede verse parte de ese texto. Es un trade-off aceptado en el spec.
- Si `npx astro check` se queja de `widths`/`sizes`, recordar que en Astro 5 `<Image>` con `widths` requiere `sizes` (ya incluido).
