import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Cache-busting / fingerprinting para imágenes en /public.
// Devuelve la misma URL con un sufijo ?v=<hash-del-contenido>. Cuando la imagen
// cambia (aunque conserve el nombre), su hash cambia → URL nueva → la CDN de
// Hostinger (hcdn, cachea estáticos 7 días) la sirve fresca en vez de la vieja.
//
// ⚠️ Usar SOLO en archivos .astro / módulos server-only: usa node:fs y NO debe
// terminar en un bundle de cliente (rompería el navegador). Por eso NO se aplica
// dentro de data/tinas.ts ni data/products-media.ts (los importan scripts de cliente).
const cache = new Map<string, string>();

export function asset(path: string | undefined | null): string {
  if (!path || !path.startsWith('/')) return path ?? '';
  const clean = path.split('?')[0];
  const hit = cache.get(clean);
  if (hit) return hit;
  let out = clean;
  try {
    const buf = readFileSync(join(process.cwd(), 'public', clean));
    const h = createHash('sha1').update(buf).digest('hex').slice(0, 8);
    out = `${clean}?v=${h}`;
  } catch {
    // archivo no encontrado en /public: devolver la ruta tal cual (sin romper).
  }
  cache.set(clean, out);
  return out;
}
