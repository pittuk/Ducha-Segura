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
  opacity: 0.55,
  haloOpacityFactor: 0.45,
  padPctOfStamp: 0.08,
  blurPctOfStamp: 0.02,
  lumThreshold: 0.6,
};

// Carpetas que se espejan de originales/ a public/images/ (para mantener public completo).
const FOLDERS = ['productos', 'tinas', 'kits', 'rebajes'];
// Subconjunto que efectivamente lleva marca de agua; el resto se copia verbatim (sin sello).
const WATERMARK_FOLDERS = ['productos', 'kits'];
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
  if (!W || !H) throw new Error(`Imagen sin dimensiones legibles: ${src}`);

  const stampW = Math.min(Math.round(W * cfg.widthPct), Math.round(H * 0.5));
  const margin = Math.round(W * cfg.marginPct);

  // Sampleo de luminancia de la esquina inf-IZQUIERDA (aplana transparencias sobre blanco).
  const regionW = Math.min(stampW, W);
  const regionH = Math.min(stampW, H);
  const region = {
    left: Math.min(margin, Math.max(0, W - regionW)),
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
  // Esquina inferior-IZQUIERDA, con margen.
  const left = Math.min(margin, Math.max(0, W - sm.width));
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
  let failed = 0;
  for (const folder of FOLDERS) {
    const watermarkThisFolder = WATERMARK_FOLDERS.includes(folder);
    for await (const src of walk(join(ORIGINALS_ROOT, folder))) {
      const dest = publicTarget(src);
      const name = src.replace(/\\/g, '/').split('/').pop();
      try {
        if (watermarkThisFolder && shouldWatermark(name, EXTS, SKIP)) {
          await processImage(src, dest, wmBuffer, cfg);
          stamped++;
        } else {
          await copyVerbatim(src, dest);
          copied++;
        }
      } catch (err) {
        failed++;
        console.error(`✗ Falló: ${src}\n  ${err.message}`);
      }
    }
  }
  console.log(`Marca de agua: ${stamped} marcadas, ${copied} copiadas, ${failed} con error.`);
  return { stamped, copied, failed };
}

// Guard de CLI: ejecutar run() solo si se invoca directamente.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .then(({ failed }) => {
      if (failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
