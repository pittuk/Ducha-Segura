# Diseño — Testimonios en video (home)

**Fecha:** 2026-06-04 · **Rama:** ajustes-varios-5
**Archivos:** `src/data/testimonios-video.ts` (nuevo), `src/components/TestimoniosVideo.astro`
(nuevo), `src/pages/index.astro` (insertar sección), `public/videos/testimonios/*` (rename).

## Objetivo

Sección moderna en el home con los testimonios en video de clientes, estilo
stories/shorts (vertical 9:16), que invite a verlos. Título "Lo dicen nuestros clientes"
(eyebrow "Testimonios"). Se ubica **arriba** de los testimonios de texto actuales (ambos
se mantienen).

## Diseño

- **Carrusel horizontal** de tarjetas verticales (9:16) con scroll-snap, flechas y
  arrastre. 14 videos (se excluye el de la Sra. Lidia: ya está en "¿Cómo lo hacemos?").
- **Tarjeta:** `<video preload="metadata">` (muestra el primer frame), nombre + ciudad
  del cliente sobre un degradado, botón de play (triángulo CSS). En **desktop, hover →
  autoplay silenciado en loop**; en móvil, frame fijo.
- **Click → modal inmersivo:** fondo oscuro, video vertical con sonido y controles,
  flechas para pasar al siguiente/anterior testimonio (como stories), nombre +
  descripción corta y botón "Ver más en Instagram". Cierra con la X, backdrop o ESC.
- **Instagram:** botón a nivel de sección "Síguenos en Instagram @duchasegura_" (al
  perfil). Sin links por-post (no tenemos las URLs); se pueden agregar luego.

## Datos (`src/data/testimonios-video.ts`)

`{ src, name, location?, blurb }` por video. Los archivos se renombran a slugs SEO
(`testimonio-<cliente>.mp4`).

## Detalle técnico

- `preload="metadata"` (no descarga los 14 videos completos); el preview y el modal
  cargan el video al usarse.
- Preview en hover: `video.play()` (muted) en mouseenter, `pause()`+reset en mouseleave.
- Modal usa un `<video controls>` separado; al cerrar se pausa.
- Listeners a nivel document con **banderas de módulo** (no `body.dataset`) por las View
  Transitions de Astro (`astro:page-load`).
- Íconos del sprite: `#i-instagram`, `#i-arrow`, `#i-close`. Play = triángulo CSS.

## Fuera de alcance

- Posters reales (no hay ffmpeg): se usa el primer frame del video.
- Links a cada publicación de Instagram (pendiente de URLs).
