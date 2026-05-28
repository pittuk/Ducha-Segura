// Importador de blog: WordPress REST API → colección `blog` de Astro.
// Descarga posts e imágenes (a public/images/blog/<slug>/) y genera src/content/blog/<slug>.md.
//
// Uso (PowerShell), con la contraseña de aplicación en variables de entorno (NO se commitea):
//   $env:WP_USER="luis"; $env:WP_APP_PASSWORD="xxxx xxxx ..."; node scripts/import-blog.mjs
//
// Idempotente: reescribe los .md y salta imágenes ya descargadas.

import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'blog');
const IMG_DIR = path.join(ROOT, 'public', 'images', 'blog');
const API = 'https://duchasegura.cl/wp-json/wp/v2';

const USER = process.env.WP_USER;
const PASS = (process.env.WP_APP_PASSWORD || '').replace(/\s+/g, ''); // WP acepta sin espacios
if (!USER || !PASS) {
  console.error('Falta WP_USER / WP_APP_PASSWORD en el entorno.');
  process.exit(1);
}
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');
const HEADERS = { Authorization: AUTH, 'User-Agent': 'Mozilla/5.0 (blog-importer)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, { binary = false, tries = 5 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.json();
    } catch (e) {
      const wait = 2000 * (i + 1);
      console.warn(`  ! ${url} → ${e.message}; reintento en ${wait}ms (${i + 1}/${tries})`);
      await sleep(wait);
    }
  }
  throw new Error(`No se pudo obtener: ${url}`);
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'", '#39': "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', laquo: '«', raquo: '»', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', iquest: '¿', iexcl: '¡', uuml: 'ü', ordf: 'ª', ordm: 'º', deg: '°', reg: '®' };
function decodeEntities(s = '') {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, k) => (k in ENT ? ENT[k] : m));
}
const stripTags = (s = '') => decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function displayDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const yaml = (v) => JSON.stringify(v ?? ''); // string YAML-safe

function imgBasename(url, used) {
  let name = decodeURIComponent(url.split('?')[0].split('#')[0].split('/').pop() || 'img');
  name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(name)) name += '.jpg';
  let final = name, n = 1;
  while (used.has(final.toLowerCase())) { const ext = path.extname(name); final = name.slice(0, -ext.length) + '-' + n++ + ext; }
  used.add(final.toLowerCase());
  return final;
}

async function downloadImage(url, destDir, basename) {
  const dest = path.join(destDir, basename);
  if (existsSync(dest)) return; // ya está
  const buf = await fetchRetry(url, { binary: true });
  await writeFile(dest, buf);
  await sleep(400);
}

async function getAllPosts() {
  const posts = [];
  let page = 1, totalPages = 1;
  do {
    const url = `${API}/posts?per_page=20&page=${page}&_embed&orderby=date&order=desc`;
    console.log(`Listado posts página ${page}…`);
    const batch = await fetchRetry(url);
    posts.push(...batch);
    // X-WP-TotalPages no viene en el JSON; paginamos hasta recibir <20.
    totalPages = batch.length === 20 ? page + 1 : page;
    page++;
    await sleep(1500);
  } while (page <= totalPages);
  return posts;
}

async function run() {
  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(IMG_DIR, { recursive: true });

  // Limpiar .md previos (stubs) para dejar solo lo importado.
  for (const f of await readdir(CONTENT_DIR)) {
    if (f.endsWith('.md')) await unlink(path.join(CONTENT_DIR, f));
  }

  const posts = (await getAllPosts()).filter((p) => p.status === 'publish');
  console.log(`\n${posts.length} posts publicados.\n`);

  for (const p of posts) {
    const slug = p.slug;
    const title = decodeEntities(p.title?.rendered || slug);
    const excerpt = stripTags(p.excerpt?.rendered || '').slice(0, 200);
    const terms = (p._embedded?.['wp:term'] || []).flat().filter((t) => t?.taxonomy === 'category');
    const cat = terms[0] ? decodeEntities(terms[0].name) : 'Blog';
    const fm = p._embedded?.['wp:featuredmedia']?.[0];
    const yoast = p.yoast_head_json || {};
    const seoDescription = yoast.description || excerpt;

    const destDir = path.join(IMG_DIR, slug);
    await mkdir(destDir, { recursive: true });
    const used = new Set();

    // Imagen destacada
    let image = '';
    if (fm?.source_url) {
      const bn = imgBasename(fm.source_url, used);
      try { await downloadImage(fm.source_url, destDir, bn); image = `/images/blog/${slug}/${bn}`; }
      catch (e) { console.warn(`  ! destacada ${slug}: ${e.message}`); }
    }

    // Imágenes dentro del contenido
    let html = p.content?.rendered || '';
    const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
    for (const src of [...new Set(srcs)]) {
      if (!/duchasegura\.cl|^\/wp-content/i.test(src)) continue; // solo del propio WP
      const abs = src.startsWith('/') ? `https://duchasegura.cl${src}` : src;
      const bn = imgBasename(abs, used);
      try {
        await downloadImage(abs, destDir, bn);
        const local = `/images/blog/${slug}/${bn}`;
        html = html.split(src).join(local);
      } catch (e) { console.warn(`  ! img ${slug}: ${e.message}`); }
    }
    // Quitar srcset/sizes (apuntan a variantes no descargadas) y lazy data-src
    html = html.replace(/\s+srcset="[^"]*"/gi, '').replace(/\s+sizes="[^"]*"/gi, '');

    const frontmatter = [
      '---',
      `title: ${yaml(title)}`,
      `cat: ${yaml(cat)}`,
      `date: ${yaml(displayDate(p.date))}`,
      `pubdate: ${yaml(p.date)}`,
      `excerpt: ${yaml(excerpt)}`,
      `seoDescription: ${yaml(seoDescription.slice(0, 300))}`,
      `image: ${yaml(image)}`,
      `label: ${yaml(cat.toUpperCase())}`,
      'draft: false',
      '---',
      '',
    ].join('\n');

    await writeFile(path.join(CONTENT_DIR, `${slug}.md`), frontmatter + html.trim() + '\n', 'utf-8');
    console.log(`✓ ${slug}  (${[...used].length} img)`);
  }
  console.log('\nListo.');
}

run().catch((e) => { console.error(e); process.exit(1); });
