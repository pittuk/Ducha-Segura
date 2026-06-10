# Diseño — Marca de agua anti-robo en fotos de producto

Fecha: 2026-06-10
Rama: `ajustes-varios-10`

## Objetivo

Quemar un sello sutil del logo Ducha Segura en las fotos **propias** de producto, de
modo que si alguien descarga o roba una imagen, el logo quede dentro del archivo
(protección anti-robo real). Debe ser **discreto, no invasivo** y no dañar el diseño
del sitio.

## Alcance

Solo imágenes raster (`.png`, `.webp`, `.jpg`/`.jpeg`) de las carpetas:

- `public/images/productos/`
- `public/images/tinas/`
- `public/images/kits/`
- `public/images/rebajes/` (incluye el banner "Compra por pallet" — se marca igual)

**Fuera de alcance:** blog, paginas, logos de terceros (convenios, distribuidores,
prensa), favicons, logos de la propia marca, archivos `.svg` y `README.txt`.

## Decisiones tomadas (brainstorming)

- **Estilo:** logo en **esquina inferior-derecha** (variante "A"), discreta. No mosaico,
  no centrado.
- **Color adaptativo:** se muestrea el brillo de la región de la esquina donde va el
  sello; sobre fondo **claro** se usa logo **oscuro (carbón)**, sobre fondo **oscuro**
  logo **blanco**. Resuelve el caso de los productos recortados sobre blanco (un logo
  blanco ahí es invisible).
- **Ejecución:** **automática en build** vía script `prebuild` (cada `npm run build`
  regenera las marcas desde los originales). También disponible manual: `npm run watermark`.
- **Banner promo "Compra por pallet":** se marca igual que el resto.

## Arquitectura

### 1. Originales preservados (idempotencia)

Hoy las imágenes en `public/images/` *son* los originales. Se mueven a una carpeta
nueva **`originales/`** en la raíz del proyecto (versionada en git, fuera de `public/`
→ no se sirve ni entra al `dist`), espejando la estructura:

```
originales/
  productos/<subcarpetas>/<archivo>
  tinas/<archivo>
  kits/<archivo>
  rebajes/<archivo>
```

El script **lee de `originales/` y escribe en `public/images/`**. Nunca lee su propia
salida → es **idempotente**: re-ejecutar nunca apila marcas ni degrada calidad.

### 2. Script `scripts/watermark.mjs`

Node ESM + `sharp` (ya es dependencia del proyecto vía Astro). Pseudoflujo:

```
config = { folders: ['productos','tinas','kits','rebajes'],
           exts: ['.png','.webp','.jpg','.jpeg'],
           skip: [/README/i],          // lista de exclusión configurable
           widthPct: 0.22, marginPct: 0.02, opacity: 0.80 }

para cada folder en config.folders:
  recorrer originales/<folder> recursivamente
  para cada archivo con extensión válida y que no matchee skip:
    1. leer original con sharp; obtener {W,H}
    2. calcular caja del sello (ancho = W*widthPct) en la esquina inf-derecha
    3. muestrear brillo medio de esa región del original
       → si claro: variante logo OSCURO; si oscuro: variante logo BLANCO
    4. construir el sello: logo redimensionado + halo suave de contraste,
       a opacidad config.opacity
    5. componer el sello sobre el original (esquina inf-derecha, con margen)
    6. escribir en public/images/<folder>/<misma ruta relativa>,
       mismo formato y calidad equivalente al original
  reportar: N procesadas, N saltadas
```

El logo fuente es `public/images/Ducha-segura-logo-blanco-marca-de-agua.webp`
(2242×2242, con alfa). La variante "oscura" se obtiene tiñendo ese mismo logo a
carbón (`tint`), evitando depender de un segundo archivo.

### 3. Integración npm (`package.json`)

```json
"scripts": {
  "watermark": "node scripts/watermark.mjs",
  "prebuild": "node scripts/watermark.mjs"
}
```

`npm run build` ejecuta `prebuild` automáticamente antes de `astro build`.

### 4. Cache-busting (sin cambios de referencias)

El helper `src/lib/asset.ts` hashea el **contenido** del archivo en `public/` y agrega
`?v=<hash>`. Al sobrescribir las fotos con la versión marcada, el hash cambia solo →
la CDN de Hostinger sirve la versión nueva. No hay que tocar componentes ni rutas.
(Las imágenes que no pasan por `asset()` igual se sirven marcadas, solo sin `?v`.)

## Parámetros visuales (afinables en implementación)

| Parámetro | Valor inicial | Notas |
|---|---|---|
| Ancho del sello | 22% del ancho de la imagen | sube/baja para más/menos presencia |
| Margen | 2% del ancho | separación del borde |
| Opacidad | 0.80 | sutil pero legible |
| Halo | desenfoque ~2% del ancho del sello | separación del fondo |
| Umbral claro/oscuro | luminancia media ~0.6 | decide variante de color |

## Datos / archivos afectados

- **Nuevo:** `originales/**` (originales movidos), `scripts/watermark.mjs`.
- **Modificado:** `public/images/{productos,tinas,kits,rebajes}/**` (versiones marcadas),
  `package.json` (scripts).
- **Sin cambios:** componentes, datos, rutas, `asset.ts`.

## Verificación

1. Tras correr `npm run watermark`, leer/inspeccionar al menos:
   - una salida sobre **fondo blanco** (ej. `productos/barra-de-seguridad-40cm/...`) →
     el sello debe verse (variante oscura).
   - una salida sobre **foto** (ej. `rebajes/Rebaje Tina Jacuzzi.webp`) → sello blanco
     visible y discreto.
2. Chequear que **cada** original tenga su correspondiente salida en `public/images/`
   (mismo nombre y dimensiones).
3. Re-ejecutar el script y confirmar que la salida es **byte-estable** (idempotencia):
   no debe aparecer una segunda marca ni cambiar el hash.
4. `npm run build` corre `prebuild` sin error y el `dist/` contiene las imágenes marcadas.

## Riesgos / mitigaciones

- **Doble marca al re-ejecutar:** mitigado por el patrón originales→public (nunca se lee
  la salida).
- **Logo invisible sobre blanco:** mitigado por el color adaptativo.
- **Build más lento:** ~30 imágenes, costo trivial; aceptado.
- **Sello tapa detalle del producto:** esquina inf-derecha con margen; tamaño/opacidad
  afinables; verificación visual obligatoria antes de cerrar.

## Fuera de alcance (YAGNI)

- Marca de agua en blog/páginas/logos de terceros.
- Mosaico/diagonal o sello centrado.
- Overlay por CSS en el sitio (se decidió quemar en el archivo).
- Variante de logo en un segundo archivo (se tiñe el existente).
