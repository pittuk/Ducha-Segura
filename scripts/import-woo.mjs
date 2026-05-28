// Importa el catálogo de WooCommerce (REST) → src/data/productos.json
// + descarga imágenes a public/images/productos/<slug>/. Clasifica grupo: rebaje | kit | accesorio.
//
// Uso (PowerShell), claves por entorno (NO se commitean):
//   $env:WC_CK="ck_..."; $env:WC_CS="cs_..."; node scripts/import-woo.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'src', 'data', 'productos.json');
const IMG_DIR = path.join(ROOT, 'public', 'images', 'productos');
const API = 'https://duchasegura.cl/wp-json/wc/v3';

const CK = process.env.WC_CK, CS = process.env.WC_CS;
if (!CK || !CS) { console.error('Falta WC_CK / WC_CS.'); process.exit(1); }
const HEADERS = { Authorization: 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64'), 'User-Agent': 'Mozilla/5.0 (woo-importer)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, { binary = false, tries = 5 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.json();
    } catch (e) {
      const wait = 2000 * (i + 1);
      console.warn(`  ! ${e.message}; reintento en ${wait}ms (${i + 1}/${tries})`);
      await sleep(wait);
    }
  }
  throw new Error(`No se pudo obtener: ${url}`);
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'", '#39': "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', iquest: '¿', iexcl: '¡', uuml: 'ü', reg: '®' };
const decode = (s = '') => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z0-9]+);/gi, (m, k) => (k in ENT ? ENT[k] : m));
const stripTags = (s = '') => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function cleanHtml(html) {
  html = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<\/?(div|section|span|header|footer|article|aside|main)\b[^>]*>/gi, '');
  html = html.replace(/<(h[1-6]|p|ul|ol|li|a|img|figure|figcaption|strong|em|b|i|blockquote|table|thead|tbody|tr|td|th|br)\b([^>]*)>/gi, (_m, tag, attrs) => {
    const t = tag.toLowerCase();
    let keep = '';
    if (t === 'a') { const h = attrs.match(/\shref="[^"]*"/i); if (h) keep += h[0]; }
    if (t === 'img') { const s = attrs.match(/\ssrc="[^"]*"/i); if (s) keep += s[0]; keep += ' alt=""'; }
    return `<${t}${keep}>`;
  });
  for (let i = 0; i < 3; i++) html = html.replace(/<(p|h[1-6]|li|ul|ol|a|strong|em|b|i)>\s*(?:&nbsp;|\s)*<\/\1>/gi, '');
  return html.replace(/[ \t]{2,}/g, ' ').replace(/(\s*\n\s*){3,}/g, '\n\n').trim();
}

function imgName(url, used) {
  let n = decodeURIComponent(url.split('?')[0].split('#')[0].split('/').pop() || 'img');
  n = n.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(n)) n += '.jpg';
  let f = n, k = 1;
  while (used.has(f.toLowerCase())) { const e = path.extname(n); f = n.slice(0, -e.length) + '-' + k++ + e; }
  used.add(f.toLowerCase());
  return f;
}

function grupoDe(p) {
  const cats = (p.categories || []).map((c) => c.name.toLowerCase());
  if (cats.some((c) => c.includes('rebaje'))) return 'rebaje';
  if (/\b(kit|juego|pack|set|combo)\b/i.test(p.name)) return 'kit';
  return 'accesorio';
}

async function run() {
  await mkdir(IMG_DIR, { recursive: true });
  const all = await fetchRetry(`${API}/products?per_page=100&status=publish&orderby=menu_order&order=asc`);
  console.log(`${all.length} productos.\n`);
  const out = [];

  for (const p of all) {
    const slug = p.slug;
    const destDir = path.join(IMG_DIR, slug);
    await mkdir(destDir, { recursive: true });
    const used = new Set();

    // Imágenes del producto
    const images = [];
    for (const im of p.images || []) {
      const bn = imgName(im.src, used);
      try {
        const dest = path.join(destDir, bn);
        if (!existsSync(dest)) { await writeFile(dest, await fetchRetry(im.src, { binary: true })); await sleep(300); }
        images.push(`/images/productos/${slug}/${bn}`);
      } catch (e) { console.warn(`  ! img ${slug}: ${e.message}`); }
    }

    // Imágenes dentro de la descripción
    let html = cleanHtml(p.description || '');
    const inSrcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
    for (const src of [...new Set(inSrcs)]) {
      if (!/duchasegura\.cl|^\/wp-content/i.test(src)) continue;
      const abs = src.startsWith('/') ? `https://duchasegura.cl${src}` : src;
      const bn = imgName(abs, used);
      try {
        const dest = path.join(destDir, bn);
        if (!existsSync(dest)) { await writeFile(dest, await fetchRetry(abs, { binary: true })); await sleep(300); }
        html = html.split(src).join(`/images/productos/${slug}/${bn}`);
      } catch (e) { console.warn(`  ! img desc ${slug}: ${e.message}`); }
    }

    out.push({
      id: `wc-${p.id}`,
      slug,
      name: decode(p.name),
      grupo: grupoDe(p),
      price: Number(p.price) || 0,
      regularPrice: Number(p.regular_price) || null,
      salePrice: p.sale_price ? Number(p.sale_price) : null,
      shortDescription: stripTags(p.short_description),
      descriptionHtml: html,
      image: images[0] || '',
      images,
    });
    console.log(`✓ ${slug}  [${grupoDe(p)}]  $${p.price}  (${images.length} img)`);
  }

  out.sort((a, b) => {
    const ord = { rebaje: 0, kit: 1, accesorio: 2 };
    return ord[a.grupo] - ord[b.grupo];
  });
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`\nListo → ${path.relative(ROOT, OUT_JSON)}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
