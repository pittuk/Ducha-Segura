# Marca de agua anti-robo en fotos de producto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quemar un sello sutil y adaptativo del logo Ducha Segura en la esquina inferior-derecha de las fotos propias de producto, como protección anti-robo, generado en build desde una carpeta de originales.

**Architecture:** Las imágenes originales se mueven a `originales/` (fuente de verdad, fuera de `public/`). Un script Node+sharp (`scripts/watermark.mjs`) lee de `originales/` y escribe las versiones marcadas en `public/images/`, copiando verbatim los archivos no-raster. La lógica pura (luminancia, elección de color, rutas, filtros) vive en `scripts/watermark-core.mjs` y se testea con Vitest. El script corre como `prebuild`, así que `npm run build` siempre regenera. El cache-busting `?v=hash` de `asset.ts` invalida la CDN solo.

**Tech Stack:** Node ESM, `sharp` (transitiva vía Astro), Vitest, Astro 5.

**Spec:** [docs/superpowers/specs/2026-06-10-marca-de-agua-fotos-producto-design.md](../specs/2026-06-10-marca-de-agua-fotos-producto-design.md)

---

## Estructura de archivos

- **Crear** `scripts/watermark-core.mjs` — funciones puras: `relativeLuminance`, `pickLogoColor`, `isRasterImage`, `shouldWatermark`, `publicTarget`. Sin `sharp`, sin IO.
- **Crear** `scripts/watermark-core.test.ts` — tests Vitest de las funciones puras.
- **Crear** `scripts/watermark.mjs` — orquestador: walk de `originales/`, sampleo de luminancia, construcción del sello, composición y escritura. Exporta `processImage`, `copyVerbatim`, `run` para poder testear/integrar; tiene guard de CLI.
- **Crear** `scripts/watermark.test.ts` — test de integración con un fixture sintético en carpeta temporal (verifica salida, dimensiones e idempotencia).
- **Modificar** `vitest.config.ts` — ampliar `include` para cubrir `scripts/`.
- **Modificar** `package.json` — agregar scripts `watermark` y `prebuild`.
- **Mover (git mv)** `public/images/{productos,tinas,kits,rebajes}/**` → `originales/{...}/**`.
- **Regenerar** `public/images/{productos,tinas,kits,rebajes}/**` (salida del script).

Parámetros por defecto (en `scripts/watermark.mjs`): `widthPct=0.20`, `marginPct=0.02`, `opacity=0.72`, `haloOpacityFactor=0.45`, `padPctOfStamp=0.08`, `blurPctOfStamp=0.02`, `lumThreshold=0.6`.

---

### Task 1: Funciones puras del core (TDD)

**Files:**
- Modify: `vitest.config.ts`
- Create: `scripts/watermark-core.mjs`
- Test: `scripts/watermark-core.test.ts`

- [ ] **Step 1: Ampliar el include de Vitest para cubrir `scripts/`**

Modificar `vitest.config.ts` para que quede exactamente así:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Escribir el test que falla**

Crear `scripts/watermark-core.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  relativeLuminance,
  pickLogoColor,
  isRasterImage,
  shouldWatermark,
  publicTarget,
} from './watermark-core.mjs';

describe('relativeLuminance', () => {
  it('es 1 para blanco y 0 para negro', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
  });
  it('pondera el verde más que el azul (Rec.709)', () => {
    expect(relativeLuminance([0, 255, 0])).toBeGreaterThan(relativeLuminance([0, 0, 255]));
  });
});

describe('pickLogoColor', () => {
  it('usa logo carbón sobre fondo claro', () => {
    expect(pickLogoColor(0.9)).toBe('charcoal');
  });
  it('usa logo blanco sobre fondo oscuro', () => {
    expect(pickLogoColor(0.2)).toBe('white');
  });
  it('respeta el umbral: en el límite usa carbón', () => {
    expect(pickLogoColor(0.6, 0.6)).toBe('charcoal');
    expect(pickLogoColor(0.59, 0.6)).toBe('white');
  });
});

describe('isRasterImage', () => {
  const exts = ['.png', '.webp', '.jpg', '.jpeg'];
  it('reconoce extensiones raster sin importar mayúsculas', () => {
    expect(isRasterImage('Foto.WEBP', exts)).toBe(true);
    expect(isRasterImage('a.png', exts)).toBe(true);
  });
  it('rechaza svg y txt', () => {
    expect(isRasterImage('icono.svg', exts)).toBe(false);
    expect(isRasterImage('README.txt', exts)).toBe(false);
  });
});

describe('shouldWatermark', () => {
  const exts = ['.png', '.webp', '.jpg', '.jpeg'];
  it('marca raster que no está en la lista de exclusión', () => {
    expect(shouldWatermark('tina.webp', exts, [])).toBe(true);
  });
  it('no marca no-raster', () => {
    expect(shouldWatermark('mapa.svg', exts, [])).toBe(false);
  });
  it('no marca lo que matchea un patrón de skip', () => {
    expect(shouldWatermark('placeholder.png', exts, [/placeholder/i])).toBe(false);
  });
});

describe('publicTarget', () => {
  it('reemplaza el root originales por public/images', () => {
    expect(publicTarget('originales/tinas/a.webp')).toBe('public/images/tinas/a.webp');
    expect(publicTarget('originales/productos/sub/b.png')).toBe('public/images/productos/sub/b.png');
  });
  it('normaliza separadores de Windows', () => {
    expect(publicTarget('originales\\kits\\c.webp')).toBe('public/images/kits/c.webp');
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm test -- scripts/watermark-core.test.ts`
Expected: FAIL — no existe `scripts/watermark-core.mjs` (error de import).

- [ ] **Step 4: Implementar el core mínimo**

Crear `scripts/watermark-core.mjs`:

```js
// Funciones puras (sin sharp ni IO) para la marca de agua. Testeables con Vitest.

/** Luminancia relativa Rec.709, normalizada 0..1, desde [r,g,b] en 0..255. */
export function relativeLuminance([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Elige el color del logo según el brillo del fondo. lum >= threshold => fondo claro => carbón. */
export function pickLogoColor(lum, threshold = 0.6) {
  return lum >= threshold ? 'charcoal' : 'white';
}

/** ¿La extensión del archivo es una imagen raster soportada? */
export function isRasterImage(filename, exts) {
  const lower = filename.toLowerCase();
  return exts.some((e) => lower.endsWith(e.toLowerCase()));
}

/** ¿Hay que ponerle marca de agua? Raster y que no matchee ningún patrón de skip. */
export function shouldWatermark(filename, exts, skipPatterns) {
  if (!isRasterImage(filename, exts)) return false;
  return !skipPatterns.some((re) => re.test(filename));
}

/** Mapea una ruta de originales/ a su destino en public/images/. */
export function publicTarget(originalPath, fromRoot = 'originales', toRoot = 'public/images') {
  const norm = originalPath.replace(/\\/g, '/');
  const rest = norm.startsWith(fromRoot) ? norm.slice(fromRoot.length) : '/' + norm;
  return toRoot + rest;
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test -- scripts/watermark-core.test.ts`
Expected: PASS (todos los `describe`).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts scripts/watermark-core.mjs scripts/watermark-core.test.ts
git commit -m "feat(watermark): core puro de marca de agua (luminancia, color, rutas) + tests"
```

---

### Task 2: Orquestador con sharp + test de integración (TDD)

**Files:**
- Create: `scripts/watermark.mjs`
- Test: `scripts/watermark.test.ts`

- [ ] **Step 1: Escribir el test de integración que falla**

Crear `scripts/watermark.test.ts`. Genera un fixture sintético (no toca assets reales), corre `processImage` y verifica salida, dimensiones e idempotencia.

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processImage, DEFAULT_CFG } from './watermark.mjs';

let dir: string;
let wmBuffer: Buffer;

beforeAll(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'wm-'));
  // logo sintético: cuadrado blanco con alfa (un disco opaco al centro)
  const size = 400;
  const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="white"/></svg>`;
  wmBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  // dos fondos: uno claro (blanco) y uno oscuro (casi negro)
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#ffffff' } })
    .png().toFile(join(dir, 'claro.png'));
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#101010' } })
    .png().toFile(join(dir, 'oscuro.png'));
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('processImage', () => {
  it('genera salida con las mismas dimensiones que el original', async () => {
    const src = join(dir, 'claro.png');
    const out = join(dir, 'out-claro.png');
    await processImage(src, out, wmBuffer, DEFAULT_CFG);
    const m = await sharp(out).metadata();
    expect(m.width).toBe(800);
    expect(m.height).toBe(600);
  });

  it('modifica los píxeles de la esquina inferior-derecha (el sello existe)', async () => {
    const src = join(dir, 'claro.png');
    const out = join(dir, 'out-claro2.png');
    await processImage(src, out, wmBuffer, DEFAULT_CFG);
    // muestra un parche en la esquina inf-derecha; ya no debe ser blanco puro
    const patch = await sharp(out)
      .extract({ left: 720, top: 520, width: 60, height: 60 })
      .flatten({ background: '#ffffff' })
      .resize(1, 1)
      .raw()
      .toBuffer();
    expect(patch[0]).toBeLessThan(250); // dejó de ser 255 blanco
  });

  it('es idempotente: misma entrada => misma salida en bytes', async () => {
    const src = join(dir, 'oscuro.png');
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    await processImage(src, a, wmBuffer, DEFAULT_CFG);
    await processImage(src, b, wmBuffer, DEFAULT_CFG);
    const [ba, bb] = [await fs.readFile(a), await fs.readFile(b)];
    expect(Buffer.compare(ba, bb)).toBe(0);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- scripts/watermark.test.ts`
Expected: FAIL — no existe `scripts/watermark.mjs`.

- [ ] **Step 3: Implementar el orquestador**

Crear `scripts/watermark.mjs`:

```js
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  relativeLuminance,
  pickLogoColor,
  shouldWatermark,
  publicTarget,
} from './watermark-core.mjs';

export const DEFAULT_CFG = {
  widthPct: 0.20,
  marginPct: 0.02,
  opacity: 0.72,
  haloOpacityFactor: 0.45,
  padPctOfStamp: 0.08,
  blurPctOfStamp: 0.02,
  lumThreshold: 0.6,
};

const FOLDERS = ['productos', 'tinas', 'kits', 'rebajes'];
const EXTS = ['.png', '.webp', '.jpg', '.jpeg'];
const SKIP = []; // patrones RegExp de exclusión (vacío: se marca todo lo raster)
const WM_SRC = 'public/images/Ducha-segura-logo-blanco-marca-de-agua.webp';
const ORIGINALS_ROOT = 'originales';

// tile 1x1 cuyo alfa multiplica el alfa del destino (escala opacidad).
function alphaTile(opacity) {
  return {
    input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
    raw: { width: 1, height: 1, channels: 4 },
    tile: true,
    blend: 'dest-in',
  };
}

// Recolorea el logo (RGB plano) preservando su forma (alfa). blend:'in' recorta el bloque al alfa del logo.
async function recolored(wmBuffer, w, rgb) {
  return sharp(wmBuffer)
    .resize(w, w, { fit: 'fill' })
    .ensureAlpha()
    .composite([
      {
        input: { create: { width: w, height: w, channels: 4, background: { ...rgb, alpha: 1 } } },
        blend: 'in',
      },
    ])
    .png()
    .toBuffer();
}

// Construye el sello (halo + logo) con el color elegido.
async function buildStamp(wmBuffer, stampWidth, logoColor, cfg) {
  const w = Math.max(1, Math.round(stampWidth));
  const logoRGB = logoColor === 'charcoal' ? { r: 45, g: 45, b: 45 } : { r: 255, g: 255, b: 255 };
  const haloRGB = logoColor === 'charcoal' ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };

  const coloredLogo = await recolored(wmBuffer, w, logoRGB);
  const logo = await sharp(coloredLogo).composite([alphaTile(cfg.opacity)]).png().toBuffer();

  const coloredHalo = await recolored(wmBuffer, w, haloRGB);
  const halo = await sharp(coloredHalo)
    .blur(Math.max(0.3, w * cfg.blurPctOfStamp))
    .composite([alphaTile(cfg.opacity * cfg.haloOpacityFactor)])
    .png()
    .toBuffer();

  const pad = Math.round(w * cfg.padPctOfStamp);
  const side = w + pad * 2;
  return sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: halo, top: pad, left: pad },
      { input: logo, top: pad, left: pad },
    ])
    .png()
    .toBuffer();
}

/** Marca de agua sobre una imagen. Lee src, escribe dest (crea carpetas). */
export async function processImage(src, dest, wmBuffer, cfg = DEFAULT_CFG) {
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  const stampW = Math.min(Math.round(W * cfg.widthPct), Math.round(H * 0.5));
  const margin = Math.round(W * cfg.marginPct);

  // Sampleo de luminancia de la esquina inf-derecha (aplana transparencias sobre blanco).
  const regionW = Math.min(stampW, W);
  const regionH = Math.min(stampW, H);
  const region = {
    left: Math.max(0, W - regionW - margin),
    top: Math.max(0, H - regionH - margin),
    width: regionW,
    height: regionH,
  };
  const rgb = await sharp(src)
    .extract(region)
    .flatten({ background: '#ffffff' })
    .resize(1, 1)
    .raw()
    .toBuffer();
  const color = pickLogoColor(relativeLuminance([rgb[0], rgb[1], rgb[2]]), cfg.lumThreshold);

  const stamp = await buildStamp(wmBuffer, stampW, color, cfg);
  const sm = await sharp(stamp).metadata();
  const left = Math.max(0, W - sm.width - margin);
  const top = Math.max(0, H - sm.height - margin);

  await fs.mkdir(dirname(dest), { recursive: true });

  let pipe = sharp(src).composite([{ input: stamp, top, left }]);
  const ext = extname(dest).toLowerCase();
  if (ext === '.webp') pipe = pipe.webp({ quality: 90 });
  else if (ext === '.png') pipe = pipe.png();
  else pipe = pipe.jpeg({ quality: 88 });
  await pipe.toFile(dest);
}

/** Copia un archivo verbatim (no-raster: svg, txt, etc.). */
export async function copyVerbatim(src, dest) {
  await fs.mkdir(dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // carpeta inexistente: nada que hacer
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** Recorre originales/<folders>, marca raster y copia el resto a public/images. */
export async function run(cfg = DEFAULT_CFG) {
  const wmBuffer = await fs.readFile(WM_SRC);
  let stamped = 0;
  let copied = 0;
  for (const folder of FOLDERS) {
    for await (const src of walk(join(ORIGINALS_ROOT, folder))) {
      const dest = publicTarget(src);
      const name = src.replace(/\\/g, '/').split('/').pop();
      if (shouldWatermark(name, EXTS, SKIP)) {
        await processImage(src, dest, wmBuffer, cfg);
        stamped++;
      } else {
        await copyVerbatim(src, dest);
        copied++;
      }
    }
  }
  console.log(`Marca de agua: ${stamped} imágenes marcadas, ${copied} copiadas verbatim.`);
}

// Guard de CLI: ejecutar run() solo si se invoca directamente.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- scripts/watermark.test.ts`
Expected: PASS (3 casos: dimensiones, sello presente, idempotencia).

- [ ] **Step 5: Correr toda la suite (no romper tests existentes)**

Run: `npm test`
Expected: PASS — incluye pricing/cart + los nuevos de watermark.

- [ ] **Step 6: Commit**

```bash
git add scripts/watermark.mjs scripts/watermark.test.ts
git commit -m "feat(watermark): orquestador sharp (sello adaptativo en esquina) + test de integración"
```

---

### Task 3: Migrar assets reales a originales/ y cablear npm scripts

**Files:**
- Modify: `package.json`
- Move (git mv): `public/images/{productos,tinas,kits,rebajes}` → `originales/{...}`

- [ ] **Step 1: Agregar los scripts npm**

En `package.json`, dentro de `"scripts"`, agregar `watermark` y `prebuild` (dejar los demás intactos):

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "watermark": "node scripts/watermark.mjs",
  "prebuild": "node scripts/watermark.mjs"
}
```

- [ ] **Step 2: Mover los originales conservando historial**

Run (PowerShell, desde la raíz del proyecto):

```powershell
New-Item -ItemType Directory -Force originales | Out-Null
git mv "public/images/productos" "originales/productos"
git mv "public/images/tinas"     "originales/tinas"
git mv "public/images/kits"      "originales/kits"
git mv "public/images/rebajes"   "originales/rebajes"
```

Expected: las 4 carpetas pasan a `originales/`; `public/images/` ya no las contiene.

- [ ] **Step 3: Verificar que originales/ y public/images NO están en .gitignore**

Run: `git check-ignore originales public/images; echo "exit=$LASTEXITCODE"`
Expected: sin output y `exit=1` (no ignorados). Si aparecen, ajustar `.gitignore` para no excluirlos.

- [ ] **Step 4: Generar las versiones marcadas**

Run: `npm run watermark`
Expected: log tipo `Marca de agua: N imágenes marcadas, M copiadas verbatim.` y se recrean `public/images/{productos,tinas,kits,rebajes}/`.

- [ ] **Step 5: Verificar cobertura (cada original tiene su salida)**

Run (PowerShell):

```powershell
$orig = (Get-ChildItem -Recurse -File originales).Count
$pub  = (Get-ChildItem -Recurse -File public/images/productos, public/images/tinas, public/images/kits, public/images/rebajes).Count
"originales=$orig  public=$pub"
```

Expected: `originales` y `public` con el mismo número de archivos.

- [ ] **Step 6: Verificación visual (fondo claro + foto)**

Abrir y mirar dos salidas representativas:
- una sobre **fondo blanco**: `public/images/productos/barra-de-seguridad-40cm/Mesa-de-trabajo-1-copia-6.png` → el sello debe verse en **carbón** en la esquina inf-derecha.
- una sobre **foto**: `public/images/rebajes/Rebaje Tina Jacuzzi.webp` → sello **blanco**, discreto.

Usar la herramienta de lectura de imagen (o Edge headless según `reference_ui-screenshots.md`). Si el sello se ve demasiado fuerte o demasiado tenue, ajustar `opacity`/`widthPct` en `DEFAULT_CFG` de `scripts/watermark.mjs`, re-correr `npm run watermark` y volver a mirar.

- [ ] **Step 7: Verificar idempotencia sobre assets reales**

Run (PowerShell): guardar hashes, re-correr, comparar.

```powershell
$before = Get-FileHash -Algorithm SHA1 (Get-ChildItem -Recurse -File public/images/tinas) | Select-Object Hash
npm run watermark
$after  = Get-FileHash -Algorithm SHA1 (Get-ChildItem -Recurse -File public/images/tinas) | Select-Object Hash
if (Compare-Object $before $after) { "CAMBIÓ (no idempotente)" } else { "idempotente OK" }
```

Expected: `idempotente OK`.

- [ ] **Step 8: Commit**

```bash
git add package.json originales public/images
git commit -m "feat(watermark): mover originales a originales/, generar fotos marcadas y cablear prebuild"
```

---

### Task 4: Verificación de build end-to-end

**Files:** (ninguno nuevo)

- [ ] **Step 1: Build completo (debe correr prebuild → watermark)**

Run: `npm run build`
Expected: el log muestra primero el mensaje de `Marca de agua: ...` (por `prebuild`) y luego el build de Astro termina sin error.

- [ ] **Step 2: Confirmar que el dist contiene imágenes marcadas**

Run (PowerShell):

```powershell
Test-Path "dist/images/rebajes/Rebaje Tina Jacuzzi.webp"
```

Expected: `True`. (Opcional: abrir esa imagen del `dist/` y confirmar el sello.)

- [ ] **Step 3: Suite verde final**

Run: `npm test`
Expected: PASS — todos los tests (pricing, cart, watermark-core, watermark).

- [ ] **Step 4: Commit (si quedó algo sin commitear)**

```bash
git status
# si hay cambios pendientes relevantes:
git add -A && git commit -m "chore(watermark): verificación de build end-to-end"
```

---

## Notas de implementación

- **No re-correr el script sobre `public/` como entrada.** La fuente siempre es `originales/`. Esto garantiza idempotencia (nunca se apilan marcas).
- **Logo fuente del sello:** `public/images/Ducha-segura-logo-blanco-marca-de-agua.webp` permanece en `public/images/` (no se mueve; no está dentro de las 4 carpetas migradas).
- **Recoloreo del logo:** se hace con `composite blend:'in'` (recorta un bloque de color plano a la forma del alfa del logo) — método fiable, no depende del comportamiento de `tint`/luminancia.
- **Afinado visual:** los parámetros viven en `DEFAULT_CFG`; cambiar y re-correr `npm run watermark` para iterar.
- **Cache-busting:** sin cambios; `src/lib/asset.ts` hashea el contenido nuevo de `public/` automáticamente.
