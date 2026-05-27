# Migración a arquitectura modular (Astro) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la landing monolítica `index.html` en un sitio Astro multipágina, modular y escalable (Inicio, Catálogo, Rebajes, Accesorios, Blog, Convenios), con datos centralizados, carrito de cotización cross-page y bases listas para pagos online a futuro — manteniendo paridad visual y funcional 1:1 con el sitio actual.

**Architecture:** Astro en modo estático por defecto (`output: 'static'`); las rutas server (pagos) se habilitan a futuro agregando el adapter Node + `export const prerender = false` por ruta, sin re-arquitectura. Componentes únicos compartidos vía `BaseLayout`. Datos en `src/data/*.ts`; lógica pura testeable en `src/lib/*.ts`; pegado al DOM en `src/scripts/*.ts`; estilos globales en `src/styles/` y específicos *scoped* por componente. El sitio actual se conserva en `legacy/index.html` como referencia hasta verificar paridad.

**Tech Stack:** Astro 5, TypeScript, Vitest (tests de lógica pura), CSS plano (design tokens + scoped), `@astrojs/sitemap`. Despliegue: build estático a `dist/` → Hostinger.

**Referencia de origen:** Todo "extraer de legacy" apunta a `legacy/index.html` (el `index.html` actual movido en la Tarea 1). Los rangos de línea citados corresponden a ese archivo. Mapa de anclas:

- **CSS** (dentro de `<style>`): Design System/`:root` 18–44; reset+utilidades 46–62; TopBar 63–75; Header 76–120; Buttons 121–146; Hero 147–186; Convenios 187–200; Sections+tipografía 201–247; Productos 248–304; Configurador 305–340; Calculadora 341–384; Diferenciadores 385–400; Prensa 401–412; Testimonios 413–432; Blog 433–451; Pre-footer 452–465; Footer 466–495; WhatsApp flotante 496–503; Cart drawer 504–553; Mobile menu 554–566; Toast 567–573; Scroll reveal 574–585.
- **HTML**: sprite SVG 586–616; topbar 618–634; header 636–672; `<main>` 674; hero 679–727; convenios 732–739; cómo-funciona 744–786; productos 791–810; configurador 815–923; calculadora 928–1018; diferenciadores 1023–1038; banda 1043–1050; testimonios 1055–1069; blog 1074–1087; prefooter 1092–1110; footer 1115–1189; WhatsApp flotante + toast 1192–1199; cart drawer 1200–1236; menu drawer 1241–1271.
- **JS**: helpers 1279–1282; data 1285–1370; topbar carousel 1371–1398; render convenios 1400–1406; render productos 1408–1442; render accesorios 1443–1461; render prensa 1462–1468; render testimonios 1470–1489; render blog 1490–1506; mode toggle 1507–1525; slider 1527–1562; configurador 1564–1637; calculadora 1639–1720; cart 1722–1805; drawer 1807–1814; menú móvil 1816–1828; add-buttons (delegación) 1830–1852; footer accordion 1854–1865; quote form WhatsApp 1867–1896; toast 1898–1907; scroll reveal 1909–1917.

---

## Task 1: Scaffold del proyecto Astro + tooling

**Files:**
- Move: `index.html` → `legacy/index.html`
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `src/env.d.ts`, `.vscode/extensions.json`
- Create dirs: `src/{data,lib,lib/payments,scripts,styles,components,layouts,content,content/blog,pages,pages/api}`, `public/images`
- Move: `images/*` → `public/images/`, `favicon.png` ya queda en `public/images/`

- [ ] **Step 1: Mover el sitio actual a `legacy/` y los assets a `public/`**

```bash
cd "Sitio Web"
mkdir -p legacy public/images src/data src/lib/payments src/scripts src/styles src/components src/layouts src/content/blog src/pages/api .vscode
git mv index.html legacy/index.html
git mv "images/Ducha segura logo azul.png" public/images/
git mv "images/Ducha segura logo blanco.png" public/images/
git mv images/favicon.png public/images/
rmdir images 2>/dev/null || true
```

- [ ] **Step 2: Crear `package.json`**

```json
{
  "name": "ducha-segura",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/sitemap": "^3.2.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Crear `astro.config.mjs`**

```js
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
```

- [ ] **Step 4: Crear `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "legacy"]
}
```

- [ ] **Step 5: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Crear `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 7: Crear `.env.example` (variables reservadas para pagos; sin valores reales)**

```bash
# Pasarela de pago — se completa cuando se activen pagos online.
# NO commitear el .env real (está en .gitignore).
# Ejemplo Webpay / Transbank:
# PAYMENTS_PROVIDER=transbank
# TBK_COMMERCE_CODE=
# TBK_API_KEY=
# TBK_ENVIRONMENT=integration
```

- [ ] **Step 8: Crear `.vscode/extensions.json`**

```json
{ "recommendations": ["astro-build.astro-vscode"] }
```

- [ ] **Step 9: Instalar dependencias y verificar build**

Run:
```bash
npm install
npm run build
```
Expected: instala sin errores; `npm run build` termina con "Complete!" generando `dist/` (vacío de páginas todavía, pero sin errores de config). Si aparece "no pages", está OK en este punto — añadiremos una página de prueba en el siguiente paso.

- [ ] **Step 10: Crear página de humo `src/pages/index.astro` temporal**

```astro
---
---
<html lang="es">
  <head><meta charset="utf-8" /><title>Ducha Segura</title></head>
  <body><h1>OK</h1></body>
</html>
```

Run: `npm run build`
Expected: PASS, genera `dist/index.html`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold proyecto Astro + tooling (vitest, sitemap, estructura de carpetas)"
```

---

## Task 2: Estilos globales — design tokens y base

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`

- [ ] **Step 1: Crear `src/styles/tokens.css` con las variables del design system**

Extraer el bloque `:root{ ... }` y su media query de `legacy/index.html` (líneas 18–45, sección "Design System"). Copiar **textualmente** las variables. Resultado:

```css
/* Design system — variables. Extraído de legacy/index.html :root (líneas 18–45) */
:root{
  --ds-blue:#0072C0;
  --ds-blue-dark:#012E4D;
  --ds-blue-mid:#1e73be;
  --ds-blue-hover:#044a80;
  --ds-blue-soft:#e6f4fd;
  --ds-red:#CC2B2B;
  --ds-green-wa:#25D366;
  --ds-text:#434343;
  --ds-text-strong:#12141c;
  --ds-bg:#ffffff;
  --ds-bg-alt:#f7f7f7;
  --ds-border:#ebebeb;
  --ds-sans:'Inter','Manrope',system-ui,-apple-system,sans-serif;
  --ds-display:'Poppins',system-ui,sans-serif;
  --ds-kicker:'PT Serif',Georgia,serif;
  --ds-tnum:'Inter Tight','Inter',sans-serif;
  --ds-radius:8px;
  --ds-radius-lg:14px;
  --ds-shadow:0 4px 14px rgba(0,114,192,.08);
  --ds-shadow-lg:0 12px 32px rgba(0,114,192,.14);
  --ds-container:1280px;
  --ds-pad:64px;
}
@media (max-width:768px){:root{--ds-pad:20px}}
```

- [ ] **Step 2: Crear `src/styles/base.css` con reset + utilidades globales**

Extraer de `legacy/index.html`, en este orden, copiando textualmente:
1. Reset/utilidades globales: líneas 46–62 (`*,*::before`, `html,body`, `body`, `img,svg`, `button`, `a`, `:focus-visible`, `.sr-only`, `.skip-link`, `.container`).
2. Sección "Buttons" (líneas 121–146).
3. Sección "Sections + tipografía" (líneas 201–247): `.section`, `.section--*`, `.section-head*`, `.h2`, `.lead`, `.kicker`, etc.
4. Sección "Scroll reveal" (líneas 574–585): `.reveal` y `.reveal.in`.

Encabezar el archivo con un comentario indicando el origen de cada bloque.

- [ ] **Step 3: Verificar que ambos archivos son CSS válido**

Run: `npx --yes csstree-validator src/styles/tokens.css src/styles/base.css` (si falla por no encontrar el paquete, omitir; la validación real ocurre en el build de la Tarea 5 al importarlos).
Expected: sin errores de sintaxis.

- [ ] **Step 4: Commit**

```bash
git add src/styles/
git commit -m "feat(styles): tokens del design system y estilos base globales"
```

---

## Task 3: Capa de datos (`src/data/`)

**Files:**
- Create: `src/data/site.ts`, `src/data/products.ts`, `src/data/accesorios.ts`, `src/data/convenios.ts`, `src/data/comunas.ts`, `src/data/prensa.ts`, `src/data/testimonios.ts`, `src/data/hero.ts`

- [ ] **Step 1: Crear `src/data/site.ts` (navegación, contacto, topbar)**

```ts
export interface NavItem { label: string; href: string; }

export const NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Rebajes', href: '/rebajes' },
  { label: 'Accesorios', href: '/accesorios' },
  { label: 'Blog', href: '/blog' },
  { label: 'Convenios', href: '/convenios' },
];

export const SITE = {
  name: 'Ducha Segura®',
  whatsappNumber: '56934044939',
  whatsappUrl: 'https://wa.me/56934044939',
};

// Mensajes rotativos del topbar. Copiar textualmente de legacy/index.html, const topbarMessages (líneas 1372–1376).
export const TOPBAR_MESSAGES: string[] = [
  // <-- pegar aquí los strings de topbarMessages desde legacy
];
```
Abrir `legacy/index.html` líneas 1372–1376 y pegar el contenido del array `topbarMessages` en `TOPBAR_MESSAGES`.

- [ ] **Step 2: Crear `src/data/products.ts`**

```ts
export interface Product {
  id: string;
  name: string;
  sub: string;
  badge: string;
  badgeColor: 'red' | 'blue' | 'soft';
  priceFrom: number;
  cuotas: string;
  medidas: string;
  bullets: string[];
  label: string;
  accent: string;
  featured?: boolean;
}

export const PRODUCTS: Product[] = [
  { id:'tradicional', name:'Rebaje Tina Tradicional', sub:'Lata, latón, fierro o fibra de vidrio',
    badge:'Más vendido', badgeColor:'red', priceFrom:199000,
    cuotas:'12 cuotas de $16.583 sin interés', medidas:'30 · 40 · 50 cm',
    bullets:['Instalación incluida','Garantía 3 años','7–10 días hábiles'],
    label:'PRODUCTO REBAJE TRADICIONAL', accent:'#7a96a8' },
  { id:'jacuzzi', name:'Rebaje Tina Jacuzzi', sub:'Hidromasaje · caso especializado',
    badge:'Con hidromasaje', badgeColor:'blue', priceFrom:399000,
    cuotas:'24 cuotas de $16.625 sin interés', medidas:'40 · 50 cm',
    bullets:['Cañerías intactas','Instalación incluida','Garantía 3 años'],
    label:'PRODUCTO REBAJE JACUZZI', accent:'#5a7990' },
  { id:'spa', name:'Rebaje Tina Spa XL', sub:'Tinas grandes · ofuro · spa doméstico',
    badge:'Caso especial', badgeColor:'soft', priceFrom:799000,
    cuotas:'Hasta 36 cuotas · consultar', medidas:'A medida',
    bullets:['Visita técnica previa','Diseño a medida','Garantía 3 años'],
    label:'PRODUCTO REBAJE SPA XL', accent:'#3f5e72', featured:true },
];
```

- [ ] **Step 3: Crear `src/data/accesorios.ts`**

```ts
export interface Accesorio {
  id: string;
  name: string;
  sub: string;
  price: number;
  label: string;
}

export const ACCESORIOS: Accesorio[] = [
  { id:'barra60', name:'Barra de apoyo recta', sub:'60 cm · acero inox.', price:34990, label:'BARRA APOYO 60CM' },
  { id:'asiento', name:'Asiento abatible de ducha', sub:'Carga hasta 130 kg', price:89990, label:'ASIENTO ABATIBLE' },
  { id:'piso', name:'Set antideslizante de piso', sub:'8 piezas · doble adhesivo', price:19990, label:'SET ANTIDESLIZANTE' },
  { id:'mampara', name:'Mampara baño asistido', sub:'Apertura amplia · vidrio', price:249990, label:'MAMPARA APERTURA' },
];
```

- [ ] **Step 4: Crear `src/data/convenios.ts`**

```ts
export const CONVENIOS: string[] = ['BANCO SANTANDER','BANCO BCI','BANCO ESTADO','AFP HABITAT','ISAPRE COLMENA','MUNICIPALIDAD PROVIDENCIA','AFP CUPRUM','ISAPRE BANMÉDICA','CCAF LOS ANDES','MUTUAL DE SEGURIDAD'];
```

- [ ] **Step 5: Crear `src/data/comunas.ts`**

```ts
export type Region = 'RM' | 'Valparaíso' | 'Bío Bío';

export const COMUNAS: Record<Region, string[]> = {
  'RM':['Las Condes','Providencia','Ñuñoa','Vitacura','La Reina','Lo Barnechea','Maipú','San Miguel','La Florida','Macul','Santiago Centro','Independencia'],
  'Valparaíso':['Viña del Mar','Valparaíso','Concón','Quilpué','Villa Alemana'],
  'Bío Bío':['Concepción','Talcahuano','San Pedro de la Paz','Chiguayante','Hualpén'],
};
```

- [ ] **Step 6: Crear `src/data/prensa.ts` y `src/data/testimonios.ts`**

`src/data/prensa.ts`:
```ts
export interface PrensaItem { name: string; quote: string; }
export const PRENSA: PrensaItem[] = [
  { name:'EL MERCURIO', quote:'"Una solución chilena para envejecer en casa con seguridad."' },
  { name:'LA TERCERA', quote:'"Sin obra, en un día: el rebaje que transforma el baño."' },
  { name:'COOPERATIVA', quote:'"Ducha Segura lleva diez años cuidando a los adultos mayores."' },
  { name:'BIOBIO CHILE', quote:'"Producto patentado, fabricado en Chile, instalado en horas."' },
  { name:'CANAL 13', quote:'"La autonomía no es un lujo. Es un derecho."' },
  { name:'EMOL', quote:'"Una alternativa real al cambio completo de tina."' },
];
```

`src/data/testimonios.ts`:
```ts
export interface Testimonio { name: string; city: string; text: string; }
export const TESTIMONIOS: Testimonio[] = [
  { name:'Carmen R., 78', city:'Las Condes', text:'Pensé que iba a ser una obra. Vinieron en la mañana, al mediodía ya me bañé.' },
  { name:'Andrés P.', city:'Hijo cuidador, Viña', text:'Lo elegí para mi mamá. La diferencia con productos importados se nota a los 5 minutos.' },
  { name:'Sandra V., 71', city:'Providencia', text:'Lo recomendé en mi club de adulto mayor. Tres compañeras lo instalaron después.' },
  { name:'Familia Ortiz', city:'Concepción', text:'Llamamos un sábado, instalaron el viernes siguiente. Cumplen.' },
];
```

- [ ] **Step 7: Crear `src/data/hero.ts`**

```ts
export interface HeroCopy {
  kicker: string; h1A: string; h1B: string; sub: string;
  primary: string; secondary: string;
  pfKicker: string; pfH2: string; pfSub: string;
}
export type Mode = 'user' | 'caregiver';

// Copiar textualmente el objeto HERO_COPY de legacy/index.html (líneas 1354–1370),
// que tiene las claves `user` y `caregiver` con la forma de HeroCopy.
export const HERO_COPY: Record<Mode, HeroCopy> = {
  // <-- pegar aquí el contenido de HERO_COPY desde legacy
};
```
Abrir `legacy/index.html` líneas 1354–1370 y pegar el objeto `HERO_COPY` (claves `user` y `caregiver`).

- [ ] **Step 8: Verificar tipado**

Run: `npx astro check`
Expected: 0 errors (si `astro check` pide instalar `@astrojs/check` + `typescript`, instalarlos: `npm i -D @astrojs/check typescript` y reintentar).

- [ ] **Step 9: Commit**

```bash
git add src/data/
git commit -m "feat(data): centralizar productos, accesorios, convenios, comunas, prensa, testimonios, hero y site"
```

---

## Task 4: Lógica pura testeable — `format`, `pricing`, `cart` (TDD)

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/pricing.ts`, `src/lib/pricing.test.ts`
- Create: `src/lib/cart.ts`, `src/lib/cart.test.ts`

- [ ] **Step 1: Crear `src/lib/format.ts`**

```ts
/** Formatea un número como entero con separador de miles es-CL (ej. 229000 -> "229.000"). */
export const clp = (n: number): string => Number(n).toLocaleString('es-CL');
```

- [ ] **Step 2: Escribir el test de `pricing` (debe fallar)**

`src/lib/pricing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { basePrice, discountAmount, finalPrice, installment } from './pricing';

describe('pricing', () => {
  it('precio base por tipo y ancho', () => {
    expect(basePrice('tradicional', 40)).toBe(229000);
    expect(basePrice('tradicional', 30)).toBe(199000);
    expect(basePrice('jacuzzi', 40)).toBe(429000);
  });

  it('descuento Santander 15% sobre 229.000 = 34.350', () => {
    expect(discountAmount(229000, 'santander')).toBe(34350);
  });

  it('precio final con Santander = 194.650', () => {
    expect(finalPrice(229000, 'santander')).toBe(194650);
  });

  it('sin descuento cuando banco = otro', () => {
    expect(discountAmount(229000, 'otro')).toBe(0);
    expect(finalPrice(229000, 'otro')).toBe(229000);
  });

  it('valor de cuota = final / nº cuotas redondeado (194.650 / 12 = 16.221)', () => {
    expect(installment(194650, 12)).toBe(16221);
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `npm test -- pricing`
Expected: FAIL — "Cannot find module './pricing'".

- [ ] **Step 4: Implementar `src/lib/pricing.ts`**

Valores y fórmulas extraídos de `legacy/index.html` (BASE_PRICES líneas 1349–1352; discMap y cálculo en la calculadora líneas 1666–1671).

```ts
export type Tipo = 'tradicional' | 'jacuzzi';
export type Ancho = 30 | 40 | 50;
export type Banco = 'santander' | 'bci' | 'estado' | 'otro';

export const BASE_PRICES: Record<Tipo, Record<Ancho, number>> = {
  tradicional: { 30: 199000, 40: 229000, 50: 259000 },
  jacuzzi:     { 30: 399000, 40: 429000, 50: 469000 },
};

/** Descuento porcentual por banco asociado a convenios. */
export const DISCOUNTS: Record<Banco, number> = { santander: 15, bci: 8, estado: 5, otro: 0 };

export const BANCO_LABELS: Record<Banco, string> = { santander: 'Santander', bci: 'BCI', estado: 'BancoEstado', otro: '' };

export function basePrice(tipo: Tipo, ancho: Ancho): number {
  return BASE_PRICES[tipo][ancho];
}
export function discountAmount(base: number, banco: Banco): number {
  return Math.round(base * DISCOUNTS[banco] / 100);
}
export function finalPrice(base: number, banco: Banco): number {
  return base - discountAmount(base, banco);
}
export function installment(final: number, cuotas: number): number {
  return Math.round(final / cuotas);
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test -- pricing`
Expected: PASS (5 tests).

- [ ] **Step 6: Escribir el test de `cart` (debe fallar)**

`src/lib/cart.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { addItem, removeItem, changeQty, subtotal, count, type CartItem } from './cart';

const base = { id: 'p1', name: 'Rebaje', variant: '40 cm', label: 'REBAJE 40', unitPrice: 229000 };

describe('cart', () => {
  it('agrega un item nuevo con qty 1', () => {
    const c = addItem([], base);
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(1);
  });

  it('agregar un id existente incrementa qty sin duplicar', () => {
    const c = addItem(addItem([], base), base);
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(2);
  });

  it('no muta el array original (inmutable)', () => {
    const original: CartItem[] = [];
    addItem(original, base);
    expect(original).toHaveLength(0);
  });

  it('changeQty respeta mínimo de 1', () => {
    const c = changeQty(addItem([], base), 'p1', -5);
    expect(c[0].qty).toBe(1);
  });

  it('removeItem elimina por id', () => {
    expect(removeItem(addItem([], base), 'p1')).toHaveLength(0);
  });

  it('subtotal y count suman precio*qty y cantidades', () => {
    let c = addItem([], base);          // qty 1
    c = changeQty(c, 'p1', 2);          // qty 3
    expect(subtotal(c)).toBe(687000);   // 229000 * 3
    expect(count(c)).toBe(3);
  });
});
```

- [ ] **Step 7: Correr el test para verificar que falla**

Run: `npm test -- cart`
Expected: FAIL — "Cannot find module './cart'".

- [ ] **Step 8: Implementar `src/lib/cart.ts`** (operaciones puras e inmutables; equivalentes a legacy 1728–1744 pero sin DOM ni localStorage)

```ts
export interface CartItem {
  id: string;
  name: string;
  variant: string;
  label: string;
  unitPrice: number;   // precio unitario (checkout-ready)
  qty: number;
}
export type NewItem = Omit<CartItem, 'qty'>;

export function addItem(cart: CartItem[], item: NewItem): CartItem[] {
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    return cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
  }
  return [...cart, { ...item, qty: 1 }];
}

export function removeItem(cart: CartItem[], id: string): CartItem[] {
  return cart.filter(i => i.id !== id);
}

export function changeQty(cart: CartItem[], id: string, delta: number): CartItem[] {
  return cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
}

export function subtotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
}

export function count(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}
```

- [ ] **Step 9: Correr toda la suite**

Run: `npm test`
Expected: PASS (todos los tests de pricing y cart).

- [ ] **Step 10: Commit**

```bash
git add src/lib/format.ts src/lib/pricing.ts src/lib/pricing.test.ts src/lib/cart.ts src/lib/cart.test.ts
git commit -m "feat(lib): pricing y cart como lógica pura con tests (vitest) + helper clp"
```

---

## Task 5: BaseLayout + Header + Footer + Topbar + sprite de íconos + UI base

**Files:**
- Create: `src/components/Icons.astro`, `src/components/Topbar.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/PrefooterCta.astro`
- Create: `src/scripts/dom.ts`, `src/scripts/ui.ts`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (usar el layout, temporal)

- [ ] **Step 1: Crear `src/scripts/dom.ts` (helpers, equivalentes a legacy 1279–1282)**

```ts
export const $ = <T extends Element = Element>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
export const $$ = <T extends Element = Element>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
export const escapeHtml = (s: string): string =>
  String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c] as string));
```

- [ ] **Step 2: Crear `src/components/Icons.astro` (sprite SVG global)**

Extraer textualmente el bloque `<svg ...>...símbolos...</svg>` del sprite de `legacy/index.html` (líneas 586–616, todos los `<symbol id="i-*">`). Pegar dentro de este componente:

```astro
---
// Sprite de íconos SVG. Se incluye una vez en BaseLayout; los componentes usan <use href="#i-..."/>.
---
<!-- pegar aquí el <svg aria-hidden ...> con todos los <symbol> de legacy líneas 586–616 -->
```

- [ ] **Step 3: Crear `src/components/Topbar.astro`**

Estructura desde `legacy/index.html` topbar (líneas 618–634). CSS: copiar la sección "TopBar" (líneas 63–75) dentro de un bloque `<style>` *scoped* del componente. El carrusel de mensajes se inicializa en `ui.ts` (paso 7).

```astro
---
import { TOPBAR_MESSAGES } from '../data/site';
---
<!-- pegar/adaptar el markup del topbar (legacy 618–634); el texto inicial = TOPBAR_MESSAGES[0] -->
<style>
  /* pegar la sección CSS "TopBar" de legacy líneas 63–75 */
</style>
```

- [ ] **Step 4: Crear `src/components/Header.astro`** (navbar con los nuevos ítems, logo imagen, trigger de cotización, botón menú)

Markup base desde `legacy/index.html` header (líneas 636–672), con estos cambios respecto al original: el `<nav>` se genera desde `NAV`; el logo usa la imagen azul (ya migrada); marca `active` el ítem cuya ruta coincide con la actual.

```astro
---
import { NAV, SITE } from '../data/site';
const path = Astro.url.pathname;
const isActive = (href: string) => href === '/' ? path === '/' : path.startsWith(href);
---
<header class="header">
  <a href="/" class="logo" aria-label="Ducha Segura — Inicio">
    <img class="logo__circle" src="/images/Ducha segura logo azul.png" alt="" width="44" height="44" />
  </a>

  <nav class="nav" aria-label="Navegación principal">
    {NAV.map(item => (
      <a href={item.href} class:list={["nav__link", { active: isActive(item.href) }]}>{item.label}</a>
    ))}
  </nav>

  <div class="header__actions">
    <!-- conservar de legacy 652–671: mode-toggle (Para mí mismo / Para un familiar),
         cart-trigger (#cartTrigger con #cartBadge) y menu-btn (#menuBtn). Pegar ese markup aquí. -->
  </div>
</header>

<style>
  /* pegar la sección CSS "Header" de legacy líneas 76–120 */
  img.logo__circle{background:#fff;object-fit:contain}
</style>
```

- [ ] **Step 5: Crear `src/components/Footer.astro`**

Markup desde `legacy/index.html` footer (líneas 1115–1189): conservar columnas, datos de contacto y el logo (usar imagen azul como en Header). El acordeón móvil se conecta en `ui.ts`. CSS: pegar las secciones "Footer" (466–495) en `<style>` scoped.

```astro
---
---
<!-- pegar/adaptar el markup del footer (legacy 1115–1189). Reemplazar el <div class="logo__circle">DS</div>
     por <img class="logo__circle" src="/images/Ducha segura logo azul.png" alt="Ducha Segura®" width="44" height="44" />.
     Conservar atributos data-accordion en las columnas. -->
<style>
  /* pegar la sección CSS "Footer" de legacy líneas 466–495 */
  img.logo__circle{background:#fff;object-fit:contain}
</style>
```

- [ ] **Step 6: Crear `src/components/PrefooterCta.astro`**

Markup desde `legacy/index.html` prefooter (líneas 1092–1110). CSS: sección "Pre-footer" (452–465). El copy del prefooter cambia según el modo usuario/cuidador (campos `pfKicker`, `pfH2`, `pfSub` de `HERO_COPY`); render inicial con el modo `user` y elementos con `id`/`data-pf-*` para que `ui.ts` los actualice al cambiar de modo.

```astro
---
import { HERO_COPY } from '../data/hero';
const pf = HERO_COPY.user;
---
<!-- pegar markup prefooter (legacy 1092–1110), insertando pf.pfKicker/pf.pfH2/pf.pfSub en los nodos
     correspondientes y marcándolos con data-pf="kicker|h2|sub" -->
<style>
  /* pegar la sección CSS "Pre-footer" de legacy líneas 452–465 */
</style>
```

- [ ] **Step 7: Crear `src/scripts/ui.ts`** (comportamientos globales)

Portar desde `legacy/index.html`, adaptando a módulo con función `initUI()` que se llama tras cada carga/transición:
- Topbar carousel + cierre (1371–1398).
- Mode toggle usuario/cuidador (1507–1525): actualiza hero y prefooter (campos `data-pf-*`), persiste en `localStorage('ds_mode')`. Usar `HERO_COPY` importado.
- Before/after slider (1527–1562).
- Mobile menu open/close (1816–1828) + cierre con Escape.
- Footer accordion móvil (1854–1865).
- Scroll reveal (1909–1917).

```ts
import { $, $$ } from './dom';
import { HERO_COPY, type Mode } from '../data/hero';
import { TOPBAR_MESSAGES } from '../data/site';

export function initUI(): void {
  initTopbar();
  initModeToggle();
  initSlider();
  initMobileMenu();
  initFooterAccordion();
  initReveal();
}

// Implementar cada init* portando la lógica de las líneas citadas arriba.
// Cada init* debe ser idempotente (chequear que el nodo existe; no duplicar listeners
// si se vuelve a llamar tras una View Transition). Patrón sugerido: marcar el nodo con
// dataset.bound = '1' la primera vez y salir si ya está marcado.
function initTopbar(): void { /* legacy 1371–1398 */ }
function initModeToggle(): void { /* legacy 1507–1525 */ }
function initSlider(): void { /* legacy 1527–1562 */ }
function initMobileMenu(): void { /* legacy 1816–1828 */ }
function initFooterAccordion(): void { /* legacy 1854–1865 */ }
function initReveal(): void { /* legacy 1909–1917 */ }
```

> Nota de implementación: el slider y el toggle solo existen en la home; los `init*` deben no hacer nada si su nodo raíz no está presente (otras páginas).

- [ ] **Step 8: Crear `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/tokens.css';
import '../styles/base.css';
import Icons from '../components/Icons.astro';
import Topbar from '../components/Topbar.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { ClientRouter } from 'astro:transitions';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}
const { title, description = 'Ducha Segura® — Rebajes de tina para acceso seguro. Producto nacional patentado. Instalación en 1 día. Garantía 3 años.', ogImage = '/images/Ducha segura logo azul.png' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <meta name="theme-color" content="#0072C0" />
  <title>{title}</title>
  <link rel="canonical" href={canonical} />
  <link rel="icon" type="image/png" href="/images/favicon.png" />
  <link rel="apple-touch-icon" href="/images/Ducha segura logo azul.png" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&family=PT+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&display=swap" rel="stylesheet" />
  <ClientRouter />
</head>
<body>
  <a href="#main" class="skip-link">Saltar al contenido</a>
  <Icons />
  <Topbar />
  <Header />
  <main id="main">
    <slot />
  </main>
  <Footer />
  <script>
    import { initUI } from '../scripts/ui';
    const run = () => initUI();
    document.addEventListener('astro:page-load', run);
  </script>
</body>
</html>
```

- [ ] **Step 9: Actualizar `src/pages/index.astro` (temporal) para usar el layout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Ducha Segura® — Inicio">
  <h1 class="container" style="padding:40px 0">Home en construcción</h1>
</BaseLayout>
```

- [ ] **Step 10: Verificar render de Header/Footer/Topbar**

Run: `npm run build && npm run preview`
Expected: build PASS; en `http://localhost:4321/` se ve topbar, header con logo + nav (Inicio activo) + footer. El menú móvil abre/cierra (probar en viewport angosto).

- [ ] **Step 11: Commit**

```bash
git add src/components/ src/layouts/ src/scripts/ src/pages/index.astro
git commit -m "feat(layout): BaseLayout + Header/Footer/Topbar/Prefooter compartidos + UI global (ui.ts)"
```

---

## Task 6: Cotizador cross-page — QuoteDrawer + store de carrito

**Files:**
- Create: `src/components/QuoteDrawer.astro`, `src/components/Toast.astro`, `src/components/WhatsappFab.astro`
- Create: `src/scripts/cart.ts`
- Modify: `src/layouts/BaseLayout.astro` (incluir QuoteDrawer, Toast, WhatsappFab y arrancar el store)

- [ ] **Step 1: Crear `src/components/QuoteDrawer.astro`**

Markup desde `legacy/index.html` cart drawer (líneas 1200–1236): backdrop `#drawerBackdrop`, aside `#drawer`, head con `#drawerCount`, body `#drawerBody`/`#drawerEmpty`, foot `#drawerFoot` con `#drawerSubtotal`/`#drawerTotal`, y el `#quoteForm` con botón `#sendQuote`. CSS: sección "Cart drawer" (504–553).

```astro
---
---
<!-- pegar markup del cart drawer (legacy 1200–1236) -->
<style>
  /* pegar la sección CSS "Cart drawer" de legacy líneas 504–553 */
</style>
```

- [ ] **Step 2: Crear `src/components/Toast.astro`**

Markup del toast `#toast`/`#toastMsg` (en `legacy` cerca de 1192–1199). CSS: sección "Toast" (567–573).

```astro
---
---
<div class="toast" id="toast" role="status" aria-live="polite"><span id="toastMsg"></span></div>
<style>
  /* pegar la sección CSS "Toast" de legacy líneas 567–573 */
</style>
```

- [ ] **Step 3: Crear `src/components/WhatsappFab.astro`**

Markup del botón flotante de WhatsApp (legacy 1192–1196). CSS: sección "WhatsApp floating" (496–503).

```astro
---
import { SITE } from '../data/site';
---
<!-- pegar markup del botón flotante (legacy 1192–1196), usando SITE.whatsappUrl en el href -->
<style>
  /* pegar la sección CSS "WhatsApp floating" de legacy líneas 496–503 */
</style>
```

- [ ] **Step 4: Crear `src/scripts/cart.ts`** (store con persistencia + render del drawer + delegación de botones; usa `src/lib/cart.ts`)

Porta la lógica de legacy 1722–1852 y 1867–1907, pero apoyándose en las funciones puras de `lib/cart.ts` y `lib/format.ts`. Diferencias respecto al original: el modelo usa `unitPrice` en vez de `price`; el render lee de la API pura; se expone `window.dsCart.add(item)` para que configurador/calculadora/tarjetas agreguen items.

```ts
import { $, $$, escapeHtml } from './dom';
import { clp } from '../lib/format';
import * as Cart from '../lib/cart';
import { ACCESORIOS } from '../data/accesorios';

const KEY = 'ds_cart';
let items: Cart.CartItem[] = load();

function load(): Cart.CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(): void {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

function showToast(msg: string): void {
  const toast = $('#toast'); const toastMsg = $('#toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  window.clearTimeout((showToast as any)._t);
  (showToast as any)._t = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

const openDrawer = () => { $('#drawer')?.classList.add('open'); $('#drawerBackdrop')?.classList.add('open'); document.body.style.overflow = 'hidden'; };
const closeDrawer = () => { $('#drawer')?.classList.remove('open'); $('#drawerBackdrop')?.classList.remove('open'); document.body.style.overflow = ''; };

export function add(item: Cart.NewItem): void {
  items = Cart.addItem(items, item);
  save(); renderCart();
  showToast(`${item.name} agregado a tu cotización`);
  openDrawer();
}

function renderCart(): void {
  // Portar el render de legacy 1754–1804: badge (#cartBadge), #drawerCount, estado vacío,
  // template de cart-item (usar i.unitPrice), upsell de barra de apoyo, subtotal/total.
  // Usar Cart.count(items), Cart.subtotal(items), clp(...), escapeHtml(...).
}

function bindOnce(): void {
  // Idempotente entre View Transitions (marcar document.body.dataset.cartBound).
  if (document.body.dataset.cartBound) { renderCart(); return; }
  document.body.dataset.cartBound = '1';

  $('#cartTrigger')?.addEventListener('click', openDrawer);
  $('#drawerClose')?.addEventListener('click', closeDrawer);
  $('#drawerBackdrop')?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Escape') closeDrawer(); });

  // Delegación de clicks (portar legacy 1830–1852): data-add-product, data-add-acc,
  // data-qty, data-remove, data-upsell. Para add-product/add-acc construir el item con unitPrice.
  // qty/remove: items = Cart.changeQty/removeItem(...); save(); renderCart();

  // Quote form -> WhatsApp (portar legacy 1867–1896, usando SITE.whatsappNumber y items/unitPrice).
}

export function initCart(): void { bindOnce(); }

// Exponer para otros scripts (configurador/calculadora)
declare global { interface Window { dsCart: { add: typeof add } } }
window.dsCart = { add };
```

- [ ] **Step 5: Incluir en `BaseLayout.astro`**

Modificar `src/layouts/BaseLayout.astro`: importar y renderizar `<Toast />`, `<WhatsappFab />` y `<QuoteDrawer />` justo antes de `</body>` (después de `<Footer />`), y arrancar el carrito en el script de `astro:page-load`:

```astro
---
// ...imports previos...
import QuoteDrawer from '../components/QuoteDrawer.astro';
import Toast from '../components/Toast.astro';
import WhatsappFab from '../components/WhatsappFab.astro';
---
<!-- ...después de <Footer /> ... -->
  <WhatsappFab />
  <Toast />
  <QuoteDrawer />
  <script>
    import { initUI } from '../scripts/ui';
    import { initCart } from '../scripts/cart';
    const run = () => { initUI(); initCart(); };
    document.addEventListener('astro:page-load', run);
  </script>
```
(Reemplaza el `<script>` anterior por este — un solo bloque.)

- [ ] **Step 6: Verificar carrito cross-page**

Crear página temporal `src/pages/_carttest.astro` con dos botones:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="cart test">
  <button data-add-acc="barra60" class="container">Agregar barra</button>
  <a href="/" class="container">Ir a home</a>
</BaseLayout>
```
Run: `npm run build && npm run preview`
Expected: en `/_carttest`, click agrega item (badge=1, drawer abre, toast aparece). Navegar a `/` y abrir el carrito (#cartTrigger): el item persiste (localStorage). Borrar la página temporal después: `git rm src/pages/_carttest.astro` (o no commitearla).

- [ ] **Step 7: Commit**

```bash
git add src/components/QuoteDrawer.astro src/components/Toast.astro src/components/WhatsappFab.astro src/scripts/cart.ts src/layouts/BaseLayout.astro
git commit -m "feat(cart): cotizador cross-page (localStorage) + drawer + toast + envío por WhatsApp"
```

---

## Task 7: Home — secciones y ensamblaje de `index.astro`

**Files:**
- Create: `src/components/Hero.astro`, `src/components/ConveniosMarquee.astro`, `src/components/ComoFunciona.astro`, `src/components/ProductCard.astro`, `src/components/ProductosTeaser.astro`, `src/components/Diferenciadores.astro`, `src/components/Prensa.astro`, `src/components/Testimonios.astro`, `src/components/BlogTeaser.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Crear `src/components/Hero.astro`**

Markup desde `legacy` hero (679–727) incluyendo el slider antes/después (nodos `#slider`, `#sliderBefore`, `#sliderHandle`, `#sliderKnob`) y los nodos del copy con `id`/`data-hero-*` (heroKicker, heroH1A, heroH1B, heroSub, heroCtaPrimary, heroCtaSecondary) que `ui.ts` (mode toggle) actualiza. Render inicial con `HERO_COPY.user`. CSS: sección "Hero" (147–186).

```astro
---
import { HERO_COPY } from '../data/hero';
import { SITE } from '../data/site';
const h = HERO_COPY.user;
---
<!-- pegar markup hero (legacy 679–727), insertando h.kicker/h.h1A/h.h1B/h.sub/h.primary/h.secondary
     y SITE.whatsappUrl en el CTA secundario -->
<style>
  /* pegar la sección CSS "Hero" de legacy líneas 147–186 */
</style>
```

- [ ] **Step 2: Crear `src/components/ConveniosMarquee.astro`** (render server-side desde datos)

Markup base desde `legacy` convenios (732–739). En vez del render por JS (legacy 1400–1406), generar el track en el servidor iterando `CONVENIOS` (duplicar la lista para el loop del marquee, igual que hacía el JS). CSS: sección "Convenios" (187–200).

```astro
---
import { CONVENIOS } from '../data/convenios';
const items = [...CONVENIOS, ...CONVENIOS]; // duplicado para marquee continuo
---
<section class="convenios" aria-label="Convenios vigentes">
  <!-- estructura de legacy 732–739; el track itera items: -->
  <div class="marquee__track">
    {items.map(c => <div class="convenio-chip">[LOGO]<br />{c}</div>)}
  </div>
</section>
<style>
  /* pegar la sección CSS "Convenios" de legacy líneas 187–200 */
</style>
```

- [ ] **Step 3: Crear `src/components/ComoFunciona.astro`**

Markup desde `legacy` cómo-funciona (744–786). Es estático; pegar tal cual. CSS: si usa estilos propios fuera de los genéricos, incluirlos; si solo usa utilidades de `base.css`, no añadir `<style>`.

- [ ] **Step 4: Crear `src/components/ProductCard.astro`** (tarjeta reutilizable)

Portar el template `renderProduct` (legacy 1408–1442) a componente. Recibe un `Product`. El botón "Sumar a cotización" usa `data-add-product={product.id}` (lo maneja la delegación de `cart.ts`). CSS: sección "Productos" (248–304).

```astro
---
import type { Product } from '../data/products';
interface Props { product: Product; }
const { product } = Astro.props;
---
<!-- portar la estructura HTML de renderProduct (legacy 1408–1442) usando los campos de `product`.
     Conservar data-add-product={product.id} en el botón de cotización. -->
<style>
  /* pegar la sección CSS "Productos" de legacy líneas 248–304 */
</style>
```

- [ ] **Step 5: Crear `src/components/ProductosTeaser.astro`** (sección home con grid de productos)

Markup contenedor desde `legacy` productos (791–810), pero el grid se arma con `<ProductCard>` por cada `PRODUCTS`. El producto con `featured` va en el bloque destacado (`productosFeatured`), el resto en `productosGrid` (mismo criterio que el JS original). Añadir un enlace "Ver catálogo completo" → `/catalogo`.

```astro
---
import { PRODUCTS } from '../data/products';
import ProductCard from './ProductCard.astro';
const featured = PRODUCTS.filter(p => p.featured);
const regular = PRODUCTS.filter(p => !p.featured);
---
<!-- contenedor de legacy 791–810; iterar regular en .product-grid y featured en .product-grid--single -->
```

- [ ] **Step 6: Crear `Diferenciadores.astro`, `Prensa.astro`, `Testimonios.astro`, `BlogTeaser.astro`**

- `Diferenciadores.astro`: markup `legacy` 1023–1038 (+ banda 1043–1050 si corresponde). CSS sección "Diferenciadores" (385–400).
- `Prensa.astro`: contenedor `legacy` (la sección de prensa) iterando `PRENSA` (portar `renderPrensa` 1462–1468). CSS sección "Prensa" (401–412).
- `Testimonios.astro`: contenedor `legacy` testimonios (1055–1069) iterando `TESTIMONIOS` (portar 1470–1489). CSS sección "Testimonios" (413–432).
- `BlogTeaser.astro`: contenedor `legacy` blog (1074–1087) iterando los posts (portar `renderBlog` 1490–1506); en esta etapa enlaza a `/blog`. CSS sección "Blog" (433–451). Usar los datos del blog desde la content collection (Tarea 14) o, si esta tarea se ejecuta antes, dejar un import temporal de un arreglo local y reemplazarlo en Tarea 14. **Decisión:** importar desde `src/data/blogTeaser.ts` (crear con los 3 objetos `BLOG_POSTS` de legacy 1328–1341) para no acoplar el orden de tareas; la Tarea 14 migra a colección y actualiza este import.

Crear `src/data/blogTeaser.ts`:
```ts
export interface BlogTeaserPost { cat: string; date: string; title: string; excerpt: string; label: string; bg: string; slug?: string; }
export const BLOG_POSTS: BlogTeaserPost[] = [
  // pegar los 3 objetos de BLOG_POSTS desde legacy líneas 1328–1341
];
```

- [ ] **Step 7: Ensamblar `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import ConveniosMarquee from '../components/ConveniosMarquee.astro';
import ComoFunciona from '../components/ComoFunciona.astro';
import ProductosTeaser from '../components/ProductosTeaser.astro';
import Configurator from '../components/Configurator.astro';   // existe tras Tarea 8
import Calculator from '../components/Calculator.astro';        // existe tras Tarea 9
import Diferenciadores from '../components/Diferenciadores.astro';
import Prensa from '../components/Prensa.astro';
import Testimonios from '../components/Testimonios.astro';
import BlogTeaser from '../components/BlogTeaser.astro';
import PrefooterCta from '../components/PrefooterCta.astro';
---
<BaseLayout title="Ducha Segura® — Rebajes de tina para acceso seguro · Chile">
  <Hero />
  <ConveniosMarquee />
  <ComoFunciona />
  <ProductosTeaser />
  <Configurator />
  <Calculator />
  <Diferenciadores />
  <Prensa />
  <Testimonios />
  <BlogTeaser />
  <PrefooterCta />
</BaseLayout>
```
> Si esta tarea se ejecuta antes que 8 y 9, comentar temporalmente las líneas de `Configurator`/`Calculator` y descomentarlas al completarlas.

- [ ] **Step 8: Verificar paridad visual de la home (sin configurador/calculadora aún)**

Run: `npm run build && npm run preview`
Expected: home renderiza hero+slider, marquee de convenios animado, cómo-funciona, grid de productos con botones que agregan a cotización, diferenciadores, prensa, testimonios, blog teaser y prefooter. Comparar lado a lado con `legacy/index.html` abierto en el navegador (`file://` o `npx serve legacy`). El toggle usuario/cuidador cambia hero y prefooter.

- [ ] **Step 9: Commit**

```bash
git add src/components/ src/data/blogTeaser.ts src/pages/index.astro
git commit -m "feat(home): secciones modulares (Hero, Convenios, Productos, Prensa, Testimonios, Blog) y ensamblaje de la home"
```

---

## Task 8: Configurador — componente + script

**Files:**
- Create: `src/components/Configurator.astro`, `src/scripts/configurator.ts`
- Modify: `src/layouts/BaseLayout.astro` (cargar `configurator.ts` solo si la página lo incluye) — ver paso 4

- [ ] **Step 1: Crear `src/components/Configurator.astro`**

Markup desde `legacy` configurador (815–923), incluyendo el SVG de preview con todos sus `id` (`#cfgCutRect`, `#cfgCutDash`, `#cfgDim*`, `#cfgCutGlow`, `#cfgJets`, `#cfgPreview`, `#cfgPreviewLabel`), las opciones `data-cfg="tipo|ancho|color"`, `#cfgSwap`, `#cfgSummary`, `#cfgPrice` y `#cfgAdd`. CSS: sección "Configurador" (305–340). Al final del componente, cargar su script:

```astro
<!-- markup configurador (legacy 815–923) -->
<style>
  /* pegar la sección CSS "Configurador" de legacy líneas 305–340 */
</style>
<script>
  import { initConfigurator } from '../scripts/configurator';
  document.addEventListener('astro:page-load', initConfigurator);
</script>
```

- [ ] **Step 2: Crear `src/scripts/configurator.ts`** (portar legacy 1564–1637; precio desde `lib/pricing`; agregar al carrito vía `window.dsCart.add`)

```ts
import { $, $$ } from './dom';
import { clp } from '../lib/format';
import { basePrice, type Tipo, type Ancho } from '../lib/pricing';

export function initConfigurator(): void {
  const root = $('#cfgPreview');
  if (!root || (root as HTMLElement).dataset.bound) return;
  (root as HTMLElement).dataset.bound = '1';
  // Portar el IIFE de legacy 1564–1636:
  //  - state { tipo, ancho, color, colorHex, bano }
  //  - render(): geometría SVG + summary + precio = basePrice(state.tipo, state.ancho)
  //  - listeners data-cfg tipo/ancho/color, #cfgSwap
  //  - #cfgAdd: window.dsCart.add({ id:`cfg-${tipo}-${ancho}-${color}`, name, variant, unitPrice: basePrice(...), label })
}
```

- [ ] **Step 3: Verificar comportamiento**

Run: `npm run build && npm run preview`
Expected: en la home, cambiar tipo/ancho/color actualiza el dibujo SVG, el resumen y el precio (Tradicional 40 = $229.000; Jacuzzi 40 = $429.000); "Sumar a mi cotización" agrega el item con el precio correcto. Comparar con legacy.

- [ ] **Step 4: Commit**

```bash
git add src/components/Configurator.astro src/scripts/configurator.ts
git commit -m "feat(configurador): componente + lógica (precio desde lib/pricing) integrado al carrito"
```

---

## Task 9: Calculadora — componente + script

**Files:**
- Create: `src/components/Calculator.astro`, `src/scripts/calculator.ts`

- [ ] **Step 1: Crear `src/components/Calculator.astro`**

Markup desde `legacy` calculadora (928–1018): chips `data-calc="tipo|ancho|region|banco"`, `<select id="calcComuna">`, nodos `#calcCfg`, `#calcLoc`, `#calcStrike`, `#calcTotal`, `#calcSave`, `#calcSaveTxt`, `#calcCuotasN`, `#calcCuotasN2`, `#calcCuotaAmt`, `#calcCuotasRange`, `#calcAdd`. CSS: sección "Calculadora" (341–384). Cargar script:

```astro
<!-- markup calculadora (legacy 928–1018) -->
<style>
  /* pegar la sección CSS "Calculadora" de legacy líneas 341–384 */
</style>
<script>
  import { initCalculator } from '../scripts/calculator';
  document.addEventListener('astro:page-load', initCalculator);
</script>
```

- [ ] **Step 2: Crear `src/scripts/calculator.ts`** (portar legacy 1639–1720; usar `lib/pricing` y `COMUNAS`)

```ts
import { $, $$, escapeHtml } from './dom';
import { clp } from '../lib/format';
import { basePrice, discountAmount, finalPrice, installment, BANCO_LABELS, type Tipo, type Ancho, type Banco } from '../lib/pricing';
import { COMUNAS, type Region } from '../data/comunas';

export function initCalculator(): void {
  const select = $('#calcComuna');
  if (!select || (select as HTMLElement).dataset.bound) return;
  (select as HTMLElement).dataset.bound = '1';
  // Portar legacy 1640–1719:
  //  - state { tipo, ancho, region, comuna, banco, cuotas }
  //  - fillComunas() desde COMUNAS[region]
  //  - render(): base=basePrice; disc=discountAmount; final=finalPrice; cuota=installment(final, cuotas)
  //              actualizar #calcCfg/#calcLoc/#calcStrike/#calcSave/#calcSaveTxt/#calcCuota*/animación de #calcTotal
  //  - listeners chips data-calc, select change, range input
  //  - #calcAdd: window.dsCart.add({ id:`calc-${tipo}-${ancho}-${banco}`, name, variant, unitPrice: final, label })
}
```

- [ ] **Step 3: Verificar comportamiento**

Run: `npm run build && npm run preview`
Expected: estado inicial muestra Tradicional 40, RM/Las Condes, Santander → total $194.650, ahorro $34.350, 12 cuotas de $16.221. Cambiar región repuebla comunas; cambiar banco/ancho/tipo recalcula; el slider de cuotas actualiza el valor por cuota. "Sumar" agrega con el precio final. Comparar con legacy.

- [ ] **Step 4: Commit**

```bash
git add src/components/Calculator.astro src/scripts/calculator.ts
git commit -m "feat(calculadora): componente + lógica (descuentos/cuotas desde lib/pricing) integrado al carrito"
```

---

## Task 10: Página `/catalogo` + `AccessoryCard`

**Files:**
- Create: `src/components/AccessoryCard.astro`, `src/components/CategoryTabs.astro`, `src/pages/catalogo.astro`
- Create: `src/scripts/catalog-filter.ts`

- [ ] **Step 1: Crear `src/components/AccessoryCard.astro`**

Portar el template `renderAccessory` (legacy 1443–1461) a componente que recibe un `Accesorio`. Botón con `data-add-acc={accesorio.id}`. Reusar CSS de la sección "Productos"/accesorios; si la grilla de accesorios usa `.acc-grid`, incluir esas reglas (están dentro de "Productos" 248–304) — ya cargadas vía ProductCard scoped o moverlas a una clase compartida. Para evitar duplicar scoped styles, colocar las reglas `.acc-*` en `src/styles/base.css` si son utilitarias; si no, scoped aquí.

```astro
---
import type { Accesorio } from '../data/accesorios';
interface Props { accesorio: Accesorio; }
const { accesorio } = Astro.props;
---
<!-- portar estructura de renderAccessory (legacy 1443–1461) con data-add-acc={accesorio.id} -->
```

- [ ] **Step 2: Crear `src/components/CategoryTabs.astro`** (filtro Rebajes / Accesorios)

```astro
---
interface Props { categories: { id: string; label: string }[]; }
const { categories } = Astro.props;
---
<div class="cat-tabs" role="tablist" aria-label="Categorías">
  <button class="cat-tab active" data-cat="todos">Todos</button>
  {categories.map(c => <button class="cat-tab" data-cat={c.id}>{c.label}</button>)}
</div>
<style>
  .cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .cat-tab{padding:8px 16px;border-radius:999px;border:1px solid var(--ds-border);background:#fff;font-weight:600;font-size:14px}
  .cat-tab.active{background:var(--ds-blue);color:#fff;border-color:var(--ds-blue)}
</style>
```

- [ ] **Step 3: Crear `src/scripts/catalog-filter.ts`**

```ts
import { $$ } from './dom';

export function initCatalogFilter(): void {
  const tabs = $$('.cat-tab');
  if (!tabs.length || (tabs[0] as HTMLElement).dataset.bound) return;
  tabs.forEach(t => {
    (t as HTMLElement).dataset.bound = '1';
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const cat = (t as HTMLElement).dataset.cat;
      $$('[data-cat-item]').forEach(el => {
        const show = cat === 'todos' || (el as HTMLElement).dataset.catItem === cat;
        (el as HTMLElement).hidden = !show;
      });
    });
  });
}
```

- [ ] **Step 4: Crear `src/pages/catalogo.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CategoryTabs from '../components/CategoryTabs.astro';
import ProductCard from '../components/ProductCard.astro';
import AccessoryCard from '../components/AccessoryCard.astro';
import { PRODUCTS } from '../data/products';
import { ACCESORIOS } from '../data/accesorios';
---
<BaseLayout title="Catálogo — Ducha Segura®" description="Catálogo completo de rebajes de tina y accesorios de seguridad para baño.">
  <section class="section">
    <div class="container">
      <div class="section-head"><h1 class="h2">Catálogo</h1><p class="lead">Rebajes y accesorios para un baño accesible.</p></div>
      <CategoryTabs categories={[{id:'rebajes',label:'Rebajes'},{id:'accesorios',label:'Accesorios'}]} />
      <div class="product-grid">
        {PRODUCTS.map(p => <div data-cat-item="rebajes"><ProductCard product={p} /></div>)}
      </div>
      <div class="acc-grid" style="margin-top:32px">
        {ACCESORIOS.map(a => <div data-cat-item="accesorios"><AccessoryCard accesorio={a} /></div>)}
      </div>
    </div>
  </section>
  <script>
    import { initCatalogFilter } from '../scripts/catalog-filter';
    document.addEventListener('astro:page-load', initCatalogFilter);
  </script>
</BaseLayout>
```

- [ ] **Step 5: Verificar**

Run: `npm run build && npm run preview`
Expected: `/catalogo` lista los 3 rebajes y 4 accesorios; los tabs filtran (Todos / Rebajes / Accesorios); botones agregan a cotización; nav marca "Catálogo" activo.

- [ ] **Step 6: Commit**

```bash
git add src/components/AccessoryCard.astro src/components/CategoryTabs.astro src/scripts/catalog-filter.ts src/pages/catalogo.astro
git commit -m "feat(catalogo): página de catálogo con filtro por categoría + AccessoryCard"
```

---

## Task 11: Página `/rebajes`

**Files:**
- Create: `src/pages/rebajes.astro`

- [ ] **Step 1: Crear `src/pages/rebajes.astro`** (listado de rebajes + configurador + calculadora reutilizados)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProductCard from '../components/ProductCard.astro';
import Configurator from '../components/Configurator.astro';
import Calculator from '../components/Calculator.astro';
import { PRODUCTS } from '../data/products';
---
<BaseLayout title="Rebajes de tina — Ducha Segura®" description="Rebajes de tina Tradicional, Jacuzzi y Spa XL. Instalación incluida, garantía 3 años.">
  <section class="section">
    <div class="container">
      <div class="section-head"><h1 class="h2">Rebajes de tina</h1><p class="lead">Elige el rebaje según tu tina.</p></div>
      <div class="product-grid">{PRODUCTS.map(p => <ProductCard product={p} />)}</div>
    </div>
  </section>
  <Configurator />
  <Calculator />
</BaseLayout>
```

- [ ] **Step 2: Verificar**

Run: `npm run build && npm run preview`
Expected: `/rebajes` muestra las 3 tarjetas, el configurador y la calculadora funcionando (mismos checks que Tareas 8–9); nav "Rebajes" activo.

- [ ] **Step 3: Commit**

```bash
git add src/pages/rebajes.astro
git commit -m "feat(rebajes): página de categoría rebajes con configurador y calculadora"
```

---

## Task 12: Página `/accesorios`

**Files:**
- Create: `src/pages/accesorios.astro`

- [ ] **Step 1: Crear `src/pages/accesorios.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import AccessoryCard from '../components/AccessoryCard.astro';
import { ACCESORIOS } from '../data/accesorios';
---
<BaseLayout title="Accesorios de seguridad para baño — Ducha Segura®" description="Barras de apoyo, asientos abatibles, antideslizantes y mamparas para baño asistido.">
  <section class="section">
    <div class="container">
      <div class="section-head"><h1 class="h2">Accesorios</h1><p class="lead">Complementa tu rebaje con seguridad.</p></div>
      <div class="acc-grid">{ACCESORIOS.map(a => <AccessoryCard accesorio={a} />)}</div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verificar**

Run: `npm run build && npm run preview`
Expected: `/accesorios` lista los 4 accesorios con precio y botón de cotización; nav "Accesorios" activo.

- [ ] **Step 3: Commit**

```bash
git add src/pages/accesorios.astro
git commit -m "feat(accesorios): página de categoría accesorios"
```

---

## Task 13: Página `/convenios`

**Files:**
- Create: `src/pages/convenios.astro`

- [ ] **Step 1: Crear `src/pages/convenios.astro`** (lista de convenios + explicación del descuento)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { CONVENIOS } from '../data/convenios';
import { DISCOUNTS, BANCO_LABELS } from '../lib/pricing';
const bancos = (['santander','bci','estado'] as const).map(b => ({ label: BANCO_LABELS[b], disc: DISCOUNTS[b] }));
---
<BaseLayout title="Convenios y descuentos — Ducha Segura®" description="Convenios con bancos, AFP, isapres y municipios. Descuentos en rebajes de tina.">
  <section class="section">
    <div class="container">
      <div class="section-head"><h1 class="h2">Convenios</h1><p class="lead">Descuentos vigentes con bancos, AFP, isapres y municipios.</p></div>
      <ul class="conv-banks">
        {bancos.map(b => <li><strong>{b.label}</strong> — {b.disc}% de descuento</li>)}
      </ul>
      <div class="conv-grid">
        {CONVENIOS.map(c => <div class="convenio-chip">[LOGO]<br />{c}</div>)}
      </div>
      <p class="conv-note">Presenta tu tarjeta o credencial del convenio al cotizar. Descuentos no acumulables salvo indicación.</p>
    </div>
  </section>
  <style>
    .conv-banks{list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;margin:0 0 28px}
    .conv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
    .convenio-chip{border:1px solid var(--ds-border);border-radius:var(--ds-radius);padding:18px;text-align:center;font-size:13px;font-weight:600;color:var(--ds-text)}
    .conv-note{margin-top:24px;font-size:14px;color:var(--ds-text)}
  </style>
</BaseLayout>
```

- [ ] **Step 2: Verificar**

Run: `npm run build && npm run preview`
Expected: `/convenios` muestra la lista de bancos con % y la grilla de convenios; nav "Convenios" activo.

- [ ] **Step 3: Commit**

```bash
git add src/pages/convenios.astro
git commit -m "feat(convenios): página de convenios y descuentos"
```

---

## Task 14: Blog — content collection + `/blog`

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/blog/bano-adulto-mayor.md`, `src/content/blog/reforma-bano-accesible.md`, `src/content/blog/rebaje-tina-diy.md`
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`
- Modify: `src/components/BlogTeaser.astro` (leer desde la colección)

- [ ] **Step 1: Crear `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    cat: z.string(),
    date: z.string(),
    excerpt: z.string(),
    label: z.string(),
    bg: z.string().default('#cdd5d8'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: Crear los 3 posts en Markdown** (frontmatter desde `BLOG_POSTS`, legacy 1328–1341; cuerpo = stub corto, contenido real lo aporta el cliente)

`src/content/blog/bano-adulto-mayor.md`:
```markdown
---
title: "¿Cómo debe ser un baño para un adulto mayor?"
cat: "BAÑO ACCESIBLE"
date: "Abr 2026"
excerpt: "Altura del WC, ubicación de las barras, antideslizantes, iluminación. Los seis cambios que más impactan."
label: "FOTO BAÑO ACCESIBLE"
bg: "#cdd5d8"
---

Contenido en preparación. (El equipo de Ducha Segura completará este artículo.)
```

`src/content/blog/reforma-bano-accesible.md`:
```markdown
---
title: "Reforma de baño: cómo crear un espacio accesible y seguro en Chile"
cat: "REFORMA"
date: "Feb 2026"
excerpt: "Guía paso a paso con normativa local, opciones según presupuesto y plazos reales en Santiago y regiones."
label: "FOTO REFORMA BAÑO"
bg: "#d8cdb8"
---

Contenido en preparación.
```

`src/content/blog/rebaje-tina-diy.md`:
```markdown
---
title: "Rebaje de Tina Hágalo Usted Mismo: la nueva solución DIY de Ducha Segura®"
cat: "HÁGALO USTED MISMO"
date: "Ene 2026"
excerpt: "Para casos puntuales o instaladores locales: el kit que llega listo para colocar en una mañana."
label: "FOTO KIT DIY"
bg: "#c8bfb0"
---

Contenido en preparación.
```

- [ ] **Step 3: Crear `src/pages/blog/index.astro`** (listado desde la colección)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
const posts = (await getCollection('blog', ({ data }) => !data.draft));
---
<BaseLayout title="Blog — Ducha Segura®" description="Guías sobre baño accesible, reformas y seguridad para adultos mayores en Chile.">
  <section class="section section--alt" id="blog">
    <div class="container">
      <div class="section-head"><h1 class="h2">Blog</h1><p class="lead">Guías sobre baño accesible y seguridad.</p></div>
      <div class="blog-grid">
        {posts.map(post => (
          <a class="blog-card" href={`/blog/${post.slug}`}>
            <div class="blog-card__media" style={`background:${post.data.bg}`}>[{post.data.label}]</div>
            <div class="blog-card__body">
              <span class="blog-card__cat">{post.data.cat} · {post.data.date}</span>
              <h2 class="blog-card__title">{post.data.title}</h2>
              <p class="blog-card__excerpt">{post.data.excerpt}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
  <style>
    /* reutilizar las clases .blog-* de base/legacy; si no son globales, pegar aquí la sección "Blog" (legacy 433–451) */
  </style>
</BaseLayout>
```

- [ ] **Step 4: Crear `src/pages/blog/[slug].astro`** (página de artículo)

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({ params: { slug: post.slug }, props: { post } }));
}
interface Props { post: CollectionEntry<'blog'>; }
const { post } = Astro.props;
const { Content } = await post.render();
---
<BaseLayout title={`${post.data.title} — Ducha Segura®`} description={post.data.excerpt}>
  <article class="section">
    <div class="container" style="max-width:760px">
      <span class="kicker">{post.data.cat} · {post.data.date}</span>
      <h1 class="h2">{post.data.title}</h1>
      <div class="prose"><Content /></div>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 5: Actualizar `src/components/BlogTeaser.astro`** para leer de la colección

Reemplazar el import de `src/data/blogTeaser.ts` por:
```astro
---
import { getCollection } from 'astro:content';
const posts = (await getCollection('blog', ({ data }) => !data.draft)).slice(0, 3);
---
```
y enlazar cada tarjeta a `/blog/${post.slug}`. Luego eliminar `src/data/blogTeaser.ts`:
```bash
git rm src/data/blogTeaser.ts
```

- [ ] **Step 6: Verificar**

Run: `npm run build && npm run preview`
Expected: `/blog` lista 3 artículos; cada uno enlaza a `/blog/<slug>` que renderiza el stub; el teaser de la home también lee de la colección; nav "Blog" activo.

- [ ] **Step 7: Commit**

```bash
git add src/content/ src/pages/blog/ src/components/BlogTeaser.astro
git commit -m "feat(blog): content collection en Markdown + listado y páginas de artículo"
```

---

## Task 15: SEO técnico — 404, robots, sitemap

**Files:**
- Create: `src/pages/404.astro`, `public/robots.txt`
- Verify: integración `@astrojs/sitemap` (ya añadida en Tarea 1)

- [ ] **Step 1: Crear `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Página no encontrada — Ducha Segura®" description="La página que buscas no existe.">
  <section class="section">
    <div class="container" style="text-align:center">
      <h1 class="h2">Página no encontrada</h1>
      <p class="lead">El enlace puede estar roto o la página se movió.</p>
      <a class="btn btn--primary btn--lg" href="/">Volver al inicio</a>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Crear `public/robots.txt`**

```text
User-agent: *
Allow: /

Sitemap: https://www.duchasegura.cl/sitemap-index.xml
```

- [ ] **Step 3: Verificar sitemap y 404**

Run: `npm run build`
Expected: build genera `dist/sitemap-index.xml` y `dist/sitemap-0.xml` con las rutas (/, /catalogo, /rebajes, /accesorios, /convenios, /blog, /blog/*). `dist/404.html` existe.

- [ ] **Step 4: Commit**

```bash
git add src/pages/404.astro public/robots.txt
git commit -m "feat(seo): página 404, robots.txt y verificación de sitemap"
```

---

## Task 16: Andamiaje para pagos (reservado, sin implementar)

**Files:**
- Create: `src/lib/payments/index.ts`, `src/lib/payments/README.md`
- Create: `src/pages/api/.gitkeep`
- Create: `docs/PAYMENTS.md`

- [ ] **Step 1: Crear `src/lib/payments/index.ts`** (interfaz genérica de pasarela; sin proveedor)

```ts
// Interfaz genérica de pasarela de pago. Reservado: NO implementado todavía.
// Cuando se active el cobro online, implementar un adaptador por proveedor
// (Transbank/Webpay, Mercado Pago, Flow, Khipu) que cumpla esta interfaz.

import type { CartItem } from '../cart';

export interface PaymentInitResult { redirectUrl: string; token: string; }

export interface PaymentProvider {
  /** Crea una transacción y devuelve la URL de redirección a la pasarela. */
  createTransaction(input: { items: CartItem[]; buyOrder: string; returnUrl: string }): Promise<PaymentInitResult>;
  /** Confirma/valida el retorno de la pasarela. */
  confirmTransaction(token: string): Promise<{ status: 'approved' | 'rejected'; amount: number }>;
}

// export function getProvider(): PaymentProvider { throw new Error('Pagos no habilitados'); }
```

- [ ] **Step 2: Crear `src/lib/payments/README.md`**

```markdown
# Pagos (reservado)

Carpeta reservada para la integración de pagos online (fase futura). Hoy el sitio
funciona como catálogo + cotización por WhatsApp; no procesa pagos.

`index.ts` define la interfaz `PaymentProvider`. Para activar pagos:
1. `npm i @astrojs/node` y añadir el adapter en `astro.config.mjs`.
2. Implementar un adaptador (p. ej. `transbank.ts`) que cumpla `PaymentProvider`.
3. Crear endpoints en `src/pages/api/` (`create-transaction.ts`, `payment-return.ts`)
   con `export const prerender = false`.
4. Completar las variables en `.env` según `.env.example`.
```

- [ ] **Step 3: Crear `src/pages/api/.gitkeep`** (carpeta reservada para endpoints server)

```text
Reservado para endpoints de pago server-rendered (ver docs/PAYMENTS.md).
```

- [ ] **Step 4: Crear `docs/PAYMENTS.md`** (cómo pasar de estático a server cuando llegue el momento)

```markdown
# Activar pagos online (guía futura)

Estado actual: `output: 'static'`, todo el sitio se compila a estático.

Para habilitar cobro online sin re-arquitectura:
1. Instalar adapter Node: `npm i @astrojs/node`.
2. En `astro.config.mjs`: importar `node` y añadir `adapter: node({ mode: 'standalone' })`.
   El sitio sigue generando estático; solo las rutas con `prerender = false` corren en servidor.
3. Implementar `src/lib/payments/<proveedor>.ts` (interfaz en `src/lib/payments/index.ts`).
4. Crear `src/pages/api/create-transaction.ts` y `src/pages/api/payment-return.ts`
   (ambos con `export const prerender = false`).
5. Añadir una página `/checkout` que tome el carrito (`localStorage ds_cart`) y llame al endpoint.
6. Variables de entorno en `.env` (ver `.env.example`).
7. Desplegar en Hostinger como app Node (no solo archivos estáticos).
```

- [ ] **Step 5: Verificar build (las carpetas reservadas no rompen el estático)**

Run: `npm run build`
Expected: PASS; `src/pages/api/.gitkeep` no genera ruta; sin errores de tipos en `src/lib/payments/index.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payments/ src/pages/api/.gitkeep docs/PAYMENTS.md
git commit -m "chore(payments): andamiaje reservado (interfaz, carpetas, guía) sin implementar"
```

---

## Task 17: Verificación de paridad, limpieza de legacy y despliegue

**Files:**
- Delete: `legacy/index.html` (al final, tras verificar paridad)
- Create: `README.md`

- [ ] **Step 1: Checklist de paridad (build + recorrido manual)**

Run: `npm run build && npm run preview`
Verificar, comparando contra `legacy/index.html` (abrir en otra pestaña con `npx --yes serve legacy`):
- [ ] `/` — hero+slider, marquee, cómo-funciona, productos, configurador, calculadora, diferenciadores, prensa, testimonios, blog, prefooter. Toggle usuario/cuidador cambia copy.
- [ ] Configurador: precios y dibujo correctos; agrega a cotización.
- [ ] Calculadora: total $194.650 inicial; recalcula; agrega a cotización.
- [ ] Carrito: persiste entre páginas; badge correcto; qty +/−; eliminar; upsell; envío por WhatsApp arma el mensaje.
- [ ] `/catalogo` filtra; `/rebajes`, `/accesorios`, `/convenios`, `/blog`, `/blog/<slug>`, `/404`.
- [ ] Header activo según ruta; menú móvil; footer accordion móvil.
- [ ] Sin errores en consola del navegador.

- [ ] **Step 2: Correr tests y type-check finales**

Run: `npm test && npx astro check`
Expected: tests PASS; `astro check` 0 errors.

- [ ] **Step 3: Crear `README.md`**

```markdown
# Ducha Segura® — Sitio web

Sitio Astro (estático) modular. Catálogo + cotización (lead-gen). Preparado para pagos a futuro.

## Desarrollo
- `npm install`
- `npm run dev` — servidor local
- `npm test` — tests de lógica (pricing, cart)
- `npm run build` — genera `dist/` (estático)
- `npm run preview` — sirve el build

## Estructura
- `src/data/` — fuente única de datos (productos, accesorios, convenios, etc.)
- `src/lib/` — lógica pura testeable (pricing, cart) + payments (reservado)
- `src/scripts/` — JS de cliente (UI, carrito, configurador, calculadora)
- `src/components/`, `src/layouts/`, `src/pages/`, `src/content/blog/`, `src/styles/`

## Despliegue (Hostinger)
`npm run build` y subir el contenido de `dist/` (estático).
Para pagos online: ver `docs/PAYMENTS.md`.
```

- [ ] **Step 4: Eliminar legacy una vez verificada la paridad**

```bash
git rm legacy/index.html
rmdir legacy 2>/dev/null || true
```

- [ ] **Step 5: Build final y commit**

Run: `npm run build`
Expected: PASS.

```bash
git add -A
git commit -m "chore: README, verificación de paridad y retiro de legacy/index.html"
```

---

## Notas finales

- **Imágenes reales:** el sitio actual usa placeholders de texto (`[LOGO]`, `[FOTO …]`); la migración mantiene esa paridad. Reemplazar placeholders por imágenes reales (desde `Imagenes de la pagina vieja/`) es una tarea de contenido posterior: copiar los archivos a `public/images/` y sustituir los placeholders en los componentes correspondientes.
- **Contenido del blog:** los artículos quedan como stubs; el cliente aporta el texto (editar los `.md` en `src/content/blog/`).
- **Pagos:** todo el andamiaje queda listo (Tarea 16 + `docs/PAYMENTS.md`); la implementación real es un proyecto aparte cuando se decida activar el cobro online.
