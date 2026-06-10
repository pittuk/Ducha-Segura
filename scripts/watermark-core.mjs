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
