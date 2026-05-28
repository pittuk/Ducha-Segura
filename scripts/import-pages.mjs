// Importa páginas puntuales de WordPress (REST) → src/data/paginas/<slug>.{html,meta.json}
// + descarga imágenes a public/images/paginas/<slug>/. Reescribe src y quita imágenes muertas.
//
// Uso (PowerShell):
//   $env:WP_USER="luis"; $env:WP_APP_PASSWORD="xxxx ..."; node scripts/import-pages.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DATA = path.join(ROOT, 'src', 'data', 'paginas');
const OUT_IMG = path.join(ROOT, 'public', 'images', 'paginas');
const API = 'https://duchasegura.cl/wp-json/wp/v2';

const SLUGS = ['terminos-y-condiciones-ducha-segura', 'accion-social'];

const USER = process.env.WP_USER;
const PASS = (process.env.WP_APP_PASSWORD || '').replace(/\s+/g, '');
if (!USER || !PASS) { console.error('Falta WP_USER / WP_APP_PASSWORD.'); process.exit(1); }
const HEADERS = { Authorization: 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64'), 'User-Agent': 'Mozilla/5.0 (pages-importer)' };
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
const stripTags = (s = '') => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// Las páginas vienen de Elementor: extraemos el contenido semántico y descartamos
// los wrappers de layout (que dependen del CSS de Elementor que no tenemos).
// Elimina el subárbol completo del primer elemento cuya clase contenga `cls` (balanceado).
function removeSubtreesWithClass(html, cls) {
  const open = new RegExp(`<([a-z0-9]+)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'i');
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1];
    const tokens = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'ig');
    tokens.lastIndex = m.index + m[0].length;
    let depth = 1, t, end = -1;
    while ((t = tokens.exec(html))) {
      if (t[0][1] === '/') { if (--depth === 0) { end = t.index + t[0].length; break; } }
      else depth++;
    }
    if (end === -1) break;
    html = html.slice(0, m.index) + html.slice(end);
  }
  return html;
}

function cleanContent(html) {
  html = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  // Quitar variantes "solo móvil" de Elementor (duplican el contenido del desktop).
  html = removeSubtreesWithClass(html, 'elementor-hidden-desktop');
  // Quitar breadcrumbs/navegación heredada.
  html = html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
  // Desempaquetar contenedores de layout (conservar su contenido).
  html = html.replace(/<\/?(div|section|span|header|footer|article|aside|main)\b[^>]*>/gi, '');
  // Limpiar atributos de las etiquetas semánticas que conservamos (solo href/src/alt).
  html = html.replace(/<(h[1-6]|p|ul|ol|li|a|img|figure|figcaption|strong|em|b|i|blockquote|table|thead|tbody|tr|td|th)\b([^>]*)>/gi, (_m, tag, attrs) => {
    let keep = '';
    const t = tag.toLowerCase();
    if (t === 'a') { const h = attrs.match(/\shref="[^"]*"/i); if (h) keep += h[0]; }
    if (t === 'img') {
      const s = attrs.match(/\ssrc="[^"]*"/i); if (s) keep += s[0];
      const a = attrs.match(/\salt="[^"]*"/i); keep += a ? a[0] : ' alt=""';
    }
    return `<${t}${keep}>`;
  });
  // Quitar elementos vacíos (incluye iconos <i></i>) y espacios excesivos.
  for (let i = 0; i < 3; i++) {
    html = html.replace(/<(p|h[1-6]|i|b|em|strong|li|ul|ol|a|figure|figcaption)>\s*(?:&nbsp;|\s)*<\/\1>/gi, '');
  }
  html = html.replace(/[ \t]{2,}/g, ' ').replace(/(\s*\n\s*){3,}/g, '\n\n');
  return html.trim();
}

function basename(url, used) {
  let name = decodeURIComponent(url.split('?')[0].split('#')[0].split('/').pop() || 'img');
  name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(name)) name += '.jpg';
  let final = name, n = 1;
  while (used.has(final.toLowerCase())) { const e = path.extname(name); final = name.slice(0, -e.length) + '-' + n++ + e; }
  used.add(final.toLowerCase());
  return final;
}

async function run() {
  await mkdir(OUT_DATA, { recursive: true });
  await mkdir(OUT_IMG, { recursive: true });

  for (const slug of SLUGS) {
    console.log(`\n→ ${slug}`);
    const arr = await fetchRetry(`${API}/pages?slug=${slug}&_embed`);
    const page = Array.isArray(arr) ? arr[0] : arr;
    if (!page) { console.warn(`  ! no encontrada`); continue; }

    const title = decode(page.title?.rendered || slug);
    const yoast = page.yoast_head_json || {};
    let html = page.content?.rendered || '';

    const destDir = path.join(OUT_IMG, slug);
    await mkdir(destDir, { recursive: true });
    const used = new Set();

    // Descargar imágenes propias del WP y reescribir; quitar las externas muertas (googleusercontent).
    const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
    for (const src of [...new Set(srcs)]) {
      if (!/duchasegura\.cl|^\/wp-content/i.test(src)) continue;
      const abs = src.startsWith('/') ? `https://duchasegura.cl${src}` : src;
      const bn = basename(abs, used);
      const dest = path.join(destDir, bn);
      try {
        if (!existsSync(dest)) { await writeFile(dest, await fetchRetry(abs, { binary: true })); await sleep(300); }
        html = html.split(src).join(`/images/paginas/${slug}/${bn}`);
      } catch (e) { console.warn(`  ! img: ${e.message}`); }
    }
    html = html.replace(/\s+srcset="[^"]*"/gi, '').replace(/\s+sizes="[^"]*"/gi, '');
    html = html.replace(/<figure[^>]*>(?:(?!<\/figure>).)*?googleusercontent(?:(?!<\/figure>).)*?<\/figure>/gis, '');
    html = cleanContent(html);

    const description = (yoast.description || stripTags(html).slice(0, 160)).slice(0, 300);

    await writeFile(path.join(OUT_DATA, `${slug}.html`), html.trim() + '\n', 'utf-8');
    await writeFile(path.join(OUT_DATA, `${slug}.meta.json`), JSON.stringify({ title, description }, null, 2), 'utf-8');
    console.log(`  ✓ title: ${title}`);
    console.log(`  ✓ ${[...used].length} img · ${html.length} chars html`);
    await sleep(1000);
  }
  console.log('\nListo.');
}
run().catch((e) => { console.error(e); process.exit(1); });
