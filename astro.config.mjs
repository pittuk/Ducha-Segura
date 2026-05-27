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
  integrations: [sitemap()],
});
