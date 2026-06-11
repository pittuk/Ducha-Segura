// og-image.mjs — Genera la imagen social por defecto (Open Graph / Twitter) en
// 1200×630 px: fondo de marca + logo blanco + claim. Se usa como `og:image`
// fallback en BaseLayout para una previsualización correcta al compartir el sitio.
//
// Ejecutar manualmente cuando cambie el branding:  node scripts/og-image.mjs
// Genera: public/images/og-default.png
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200;
const H = 630;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#012E4D"/>
      <stop offset="1" stop-color="#0072C0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#0072C0"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#ffffff">
    <text x="470" y="250" font-size="64" font-weight="700">Rebajes de tina</text>
    <text x="470" y="324" font-size="64" font-weight="700">para un baño seguro</text>
    <text x="470" y="392" font-size="30" font-weight="400" fill="#CFE6F7">Producto nacional patentado · Garantía 3 años</text>
    <text x="470" y="452" font-size="28" font-weight="700" fill="#ffffff">duchasegura.cl</text>
  </g>
</svg>`;

const logo = await sharp(join(root, 'public/images/Ducha segura logo blanco.png'))
  .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: 90, top: 155 }])
  .png()
  .toFile(join(root, 'public/images/og-default.png'));

console.log('✓ public/images/og-default.png (1200×630) generado');
