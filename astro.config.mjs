// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Modo estático por defecto. Para habilitar pagos a futuro:
//   1) npm i @astrojs/node
//   2) import node from '@astrojs/node'; añadir `adapter: node({ mode: 'standalone' })`
//   3) marcar las rutas de pago con `export const prerender = false`
// El contenido sigue estático; solo esas rutas pasan a server-rendered.
export default defineConfig({
  site: 'https://www.duchasegura.cl',
  output: 'static',
  // Inlinea todo el CSS en <style> → elimina los requests render-blocking (~480ms bajo 4G).
  // El CSS es chico y gzipea bien; el trade-off (no cachear CSS entre páginas) lo compensa
  // el foco en LCP de landing. Ver ronda 3 SEO móvil.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
