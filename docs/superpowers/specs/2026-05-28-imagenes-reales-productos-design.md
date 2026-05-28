# Diseño — Imágenes reales en tarjetas de producto

**Fecha:** 2026-05-28
**Proyecto:** Ducha Segura® — sitio web
**Estado:** Aprobado por el cliente. Pendiente de revisión del documento.

---

## 1. Contexto y objetivo

Tras la migración a Astro (ver [`2026-05-27-arquitectura-modular-astro-design.md`](2026-05-27-arquitectura-modular-astro-design.md)),
las tarjetas de producto del catálogo siguen mostrando **placeholders de texto**: un degradado de
color (`accent`) con una etiqueta centrada (campo `label`, ej. `[PRODUCTO REBAJE TRADICIONAL]`).
Ver [`src/components/ProductCard.astro`](../../../src/components/ProductCard.astro) líneas 8–13 y
los datos en [`src/data/products.ts`](../../../src/data/products.ts).

**Objetivo:** reemplazar esos placeholders por **imágenes reales** en las 3 tarjetas de producto
(Rebaje Tradicional, Jacuzzi, Spa XL). Es una tarea de **contenido**, acotada: no toca accesorios,
hero, prensa ni blog (cada uno es una tarea futura).

**Hallazgo relevante del material disponible:** la carpeta hermana
`../Imagenes de la pagina vieja/imagenes_descargadas/` (203 imágenes, fuera del repo) contiene un
solo producto físico —el **rebaje de tina**— retratado de muchas formas (recortes sin fondo,
renders CG, fotos de instalación real, antes/después, taller, furgón). Los tres "productos" del
catálogo son el mismo rebaje aplicado a tinas distintas y a distintos tramos de precio; **no existen
recortes ni fotos separadas por tipo**, salvo un caso: hay un antes/después de un **jacuzzi real**
(con chorros de hidromasaje visibles).

## 2. Decisiones tomadas (resumen de brainstorming)

| Decisión | Elección |
|---|---|
| Estilo base de la imagen en la tarjeta | Recorte del producto sin fondo (catálogo limpio). |
| Cómo diferenciar las 3 tarjetas | Mezcla: recorte para Tradicional; fotos reales por tipo para Jacuzzi y Spa XL. |
| Jacuzzi / Spa XL | **Fotos reales por tipo** (se acepta que la del jacuzzi trae texto ANTES/DESPUÉS y marca de agua incrustados). |
| Alcance | Solo las 3 tarjetas de producto. No se migran las 203 imágenes ni otras secciones. |
| Render de imágenes | Componente `<Image>` de Astro 5 (optimización automática), no `<img>` crudo. |

## 3. Mapeo imagen → producto

| Producto (`id`) | Imagen fuente (carpeta hermana) | Ajuste (`object-fit`) | Por qué |
|---|---|---|---|
| `tradicional` | `EDIT_sin-fondo_1.png` | `contain` (fondo blanco) | Recorte limpio del producto, look catálogo. |
| `jacuzzi` | `ANTES-DESPUES-2.2.webp` | `cover` | Es un jacuzzi real con chorros; calza con el tipo. |
| `spa` *(featured, 21:9)* | `DSC01313-scaled.webp` | `cover` | Tina grande/redondeada real; lo más cercano a "spa/XL". |

> No existe una foto de "spa/ofuro" como tal; `DSC01313` (tina grande) es la mejor aproximación real disponible.

## 4. Enfoque técnico

### 4.1 Archivos de imagen
- Copiar **solo estas 3** fuentes al repo, en `src/assets/productos/`, con nombres claros:
  - `rebaje-tradicional.png`
  - `rebaje-jacuzzi.webp`
  - `rebaje-spa.webp`
- Van en `src/assets/` (no `public/`) para que el pipeline de Astro las optimice (redimensiona,
  re-codifica, genera `width/height`). Difiere a propósito del patrón de convenios
  (`public/images/...` con `<img>`), porque esos son logos chicos y estas fotos pesan más.

### 4.2 Modelo de datos
- **`src/data/products.ts` queda intacto** (sin imports de assets). Esto evita que Vitest tenga que
  resolver imports de imágenes y mantiene los 12 tests en verde.
- Nuevo módulo **`src/data/products-media.ts`**: mapa `id → { src: ImageMetadata; fit: 'contain' | 'cover'; alt: string }`.
  Importa las 3 imágenes y expone, por ejemplo, `PRODUCT_MEDIA`. Co-localiza la preocupación visual
  fuera de los datos puros.

  ```ts
  import type { ImageMetadata } from 'astro';
  import tradicional from '../assets/productos/rebaje-tradicional.png';
  import jacuzzi from '../assets/productos/rebaje-jacuzzi.webp';
  import spa from '../assets/productos/rebaje-spa.webp';

  export interface ProductMedia { src: ImageMetadata; fit: 'contain' | 'cover'; alt: string; }

  export const PRODUCT_MEDIA: Record<string, ProductMedia> = {
    tradicional: { src: tradicional, fit: 'contain', alt: 'Pieza de rebaje de tina Ducha Segura, vista de producto' },
    jacuzzi:     { src: jacuzzi,     fit: 'cover',   alt: 'Antes y después: rebaje instalado en una tina jacuzzi' },
    spa:         { src: spa,         fit: 'cover',   alt: 'Tina grande con rebaje de acceso instalado' },
  };
  ```

### 4.3 Componente
- `src/components/ProductCard.astro`:
  - Importa `Image` desde `astro:assets` y `PRODUCT_MEDIA` desde `../data/products-media`.
  - `const media = PRODUCT_MEDIA[product.id];`
  - Si `media` existe: renderiza `<Image>` llenando `.product-card__media`, con `object-fit` según
    `media.fit`, y **oculta** el degradado (`accent`) y el `label`.
  - Si `media` **no** existe (productos futuros sin foto): mantiene el placeholder actual (degradado + label) como **fallback**.
  - Los chips superpuestos (badge, medidas) se mantienen encima de la imagen; ya tienen fondo
    translúcido legible.

### 4.4 Estilos
- Se respetan los aspect ratios actuales: `.product-card__media` 4:3; `--featured` 21:9 (4:3 en móvil).
- `fit: 'cover'` → la imagen llena la caja (`width/height:100%`, `object-fit:cover`, `position:absolute; inset:0`).
- `fit: 'contain'` → fondo **blanco** detrás, `object-fit:contain` con un padding pequeño para que el recorte respire.
- No re-declarar clases globales de `base.css`; estilos nuevos van *scoped* en el componente.

## 5. Accesibilidad
- Cada imagen lleva `alt` descriptivo (definido en `PRODUCT_MEDIA`), no decorativo.

## 6. Alcance / fuera de alcance
- **Dentro:** las 3 tarjetas de producto, dondequiera que se renderice `ProductCard` (home teaser y `/catalogo`).
- **Fuera:** accesorios, hero, prensa, blog, y la migración masiva de las 203 imágenes (tareas futuras).

## 7. Verificación
- `npm run dev` → revisar visualmente **home** y **/catalogo**: las 3 tarjetas con imagen, incluido
  el Spa XL en formato 21:9; ver que el recorte del Tradicional se vea completo sobre blanco y que
  los chips de badge/medidas sigan legibles.
- `npx astro check` → 0 errores / 0 warnings.
- `npm test` → 12/12 (confirmar que `products-media.ts` no se filtró a los tests).
- `npm run build` → build OK; imágenes optimizadas presentes en `dist/`.

## 8. Riesgos / notas
- La imagen del jacuzzi (`ANTES-DESPUES-2.2`) trae texto y marca de agua incrustados; en recorte
  `cover` 4:3 puede verse parte de ese texto. Es un trade-off **aceptado** por el cliente. A futuro
  podría reemplazarse por una foto de jacuzzi sin texto si aparece.
- Si más adelante se quiere homogeneizar el look, se puede mover la foto del jacuzzi a una sección
  "casos reales / antes-después" y dejar la tarjeta con un render limpio.
