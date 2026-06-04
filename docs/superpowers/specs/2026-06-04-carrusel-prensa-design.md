# Diseño — Carrusel de prensa (home)

**Fecha:** 2026-06-04 · **Rama:** ajustes-varios-5
**Archivos:** `src/data/prensa.ts`, `src/components/Prensa.astro`

## Objetivo

Convertir la sección "¿Nos viste? Estamos en prensa." en un **carrusel (marquee) de
logos** de los medios que cubrieron a Ducha Segura. Cada logo, al hacer hover, muestra
un **tooltip** con un excerpt de la nota y un enlace **"Leer nota completa →"** que
lleva a la entrada del blog correspondiente (categoría "Ducha Segura en medios").

## Comportamiento

- Marquee horizontal infinito (mismo patrón que `ConveniosMarquee`), **pausa en hover**.
- Hover sobre un logo → tooltip-card encima con `excerpt` + CTA "Leer nota completa →".
- Todo el logo es un `<a href>` a la nota interna (click/tap).
- Móvil (sin hover): el tooltip se oculta; el tap navega directo a la nota.

## Datos (`src/data/prensa.ts`)

Nueva estructura: `{ name, logo, excerpt, href }`. 9 ítems, uno por nota interna.

- `href`: ruta interna del artículo (p. ej. `/prensa-diario-la-cronica`).
- `logo`: ruta en `public/images/prensa/`. Para los medios sin logo aún, el componente
  muestra un **placeholder tipográfico** con `name` (vía `onerror` de la `<img>`): cuando
  se suba el archivo con el nombre indicado, el logo real aparece solo, sin tocar código.
- `excerpt`: frase corta para el tooltip (versión breve del excerpt del post).

Logos a subir a `public/images/prensa/`: `logo-el-sur.png`, `logo-la-cronica.png`,
`logo-la-discusion.png`, `logo-tvu.png`, `logo-udd.png`, `logo-entrevistas.png`.
Ya existen: LUN, La Estrella, Radio Festival.

## Detalle técnico

- El tooltip aparece en una zona de `padding-top` reservada del contenedor del marquee,
  para que no lo recorte el `overflow:hidden` (necesario para no provocar scroll
  horizontal). Mask-gradient en los bordes (igual que convenios).
- Placeholder: `<img onerror>` oculta la imagen rota y muestra el `<span>` con el nombre.

## Fuera de alcance

- Logos de NexNews y Radio Bío Bío (existen pero no tienen nota interna asociada): quedan
  fuera hasta confirmar a qué nota corresponden.
