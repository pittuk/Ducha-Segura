# Proceso de cotización + backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el proceso de cotización (página dedicada con tipo de tina condicional) + backend PHP/MySQL en Hostinger que guarda cotizaciones, notifica por email y se gestiona desde un panel admin; y renombrar "Jacuzzi" → "Hidromasaje" en los textos visibles.

**Architecture:** Front Astro estático (sin cambio de deploy) con drawer de dos acciones ("Continuar con la cotización" / "Comprar") y página `/cotizar`. Backend PHP en `public/api/` (se copia a `dist/` y se sube junto al sitio). El front envía la cotización por `fetch` a `api/cotizacion.php`, que persiste en MySQL (PDO) y envía 2 emails (PHPMailer, SMTP del dominio). Panel admin PHP en `public/admin/` con cuentas de usuario (sesión PHP nativa).

**Tech Stack:** Astro 5 (static) · TypeScript · Vitest · PHP 8 (PDO MySQL, PHPMailer) · MySQL · HTML/CSS vanilla para el panel.

**Spec:** `docs/superpowers/specs/2026-06-02-proceso-de-cotizacion-y-backend-design.md`

---

## FASE 1 — Front

### Task 1: Modelo `grupo` + helpers `hasRebaje` / `canBuy` / `deriveGrupo` (lib pura)

**Files:**
- Modify: `src/lib/cart.ts`
- Test: `src/lib/cart.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `src/lib/cart.test.ts` (antes del cierre del archivo no; agregar nuevos `describe` después del existente). Importar los símbolos nuevos en la línea 2.

Reemplazar la línea de import (línea 2) por:
```ts
import { addItem, removeItem, changeQty, subtotal, count, hasItem, hasRebaje, canBuy, deriveGrupo, type CartItem, type Grupo } from './cart';
```

Reemplazar la línea 4 (`const base = ...`) por una que incluya `grupo`:
```ts
const base = { id: 'p1', name: 'Rebaje', variant: '40 cm', label: 'REBAJE 40', unitPrice: 229000, grupo: 'rebaje' as Grupo };
```

Agregar estos `describe` nuevos al final del archivo:
```ts
const acc = { id: 'acc-barra', name: 'Barra', variant: '40 cm', label: 'BARRA', unitPrice: 25000, grupo: 'accesorio' as Grupo };
const kit = { id: 'kit-basico', name: 'Kit', variant: 'básico', label: 'KIT', unitPrice: 80000, grupo: 'kit' as Grupo };
const reb = { id: 'reb-trad', name: 'Rebaje', variant: '40 cm', label: 'REBAJE', unitPrice: 229000, grupo: 'rebaje' as Grupo };

describe('hasRebaje', () => {
  it('false en carrito vacío', () => { expect(hasRebaje([])).toBe(false); });
  it('false con solo accesorios/kits', () => {
    expect(hasRebaje(addItem(addItem([], acc), kit))).toBe(false);
  });
  it('true cuando hay un rebaje', () => {
    expect(hasRebaje(addItem(addItem([], acc), reb))).toBe(true);
  });
});

describe('canBuy', () => {
  it('false en carrito vacío', () => { expect(canBuy([])).toBe(false); });
  it('true con solo accesorios', () => { expect(canBuy(addItem([], acc))).toBe(true); });
  it('true con solo kits', () => { expect(canBuy(addItem([], kit))).toBe(true); });
  it('true mezclando kits y accesorios', () => {
    expect(canBuy(addItem(addItem([], acc), kit))).toBe(true);
  });
  it('false si hay un rebaje', () => {
    expect(canBuy(addItem(addItem([], acc), reb))).toBe(false);
  });
});

describe('deriveGrupo', () => {
  it('reb-/cfg-/calc- → rebaje', () => {
    expect(deriveGrupo('reb-x')).toBe('rebaje');
    expect(deriveGrupo('cfg-x')).toBe('rebaje');
    expect(deriveGrupo('calc-jacuzzi-40-santander')).toBe('rebaje');
  });
  it('kit- → kit', () => { expect(deriveGrupo('kit-basico')).toBe('kit'); });
  it('acc- → accesorio', () => { expect(deriveGrupo('acc-barra')).toBe('accesorio'); });
  it('desconocido → accesorio', () => { expect(deriveGrupo('x-foo')).toBe('accesorio'); });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test`
Expected: FAIL — `hasRebaje`/`canBuy`/`deriveGrupo` no existen y `Grupo` no se exporta desde `./cart`.

- [ ] **Step 3: Implementar en `src/lib/cart.ts`**

Reemplazar las líneas 1-10 (interfaz + tipos) por:
```ts
export type Grupo = 'rebaje' | 'kit' | 'accesorio';

export interface CartItem {
  id: string;
  name: string;
  variant: string;
  label: string;
  grupo: Grupo;        // categoría del producto (define cotizar vs comprar)
  image?: string;      // ruta de imagen en public/ (thumbnail); si falta, cae al label
  unitPrice: number;   // precio unitario (checkout-ready)
  qty: number;
}
export type NewItem = Omit<CartItem, 'qty'>;
```

Agregar al final del archivo (después de `hasItem`):
```ts
export function hasRebaje(cart: CartItem[]): boolean {
  return cart.some(i => i.grupo === 'rebaje');
}

// Comprar solo está disponible si el carrito tiene productos y son todos
// kits/accesorios (sin rebaje). Con un rebaje presente, va sí o sí a cotización.
export function canBuy(cart: CartItem[]): boolean {
  return cart.length > 0 && !hasRebaje(cart) &&
    cart.every(i => i.grupo === 'kit' || i.grupo === 'accesorio');
}

// Fallback para items viejos de localStorage sin `grupo`: se deriva del prefijo del id.
export function deriveGrupo(id: string): Grupo {
  if (/^(reb|cfg|calc)-/.test(id)) return 'rebaje';
  if (id.startsWith('kit-')) return 'kit';
  return 'accesorio';
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test`
Expected: PASS (todos los tests, incluidos los previos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart.ts src/lib/cart.test.ts
git commit -m "feat(cart): grupo en CartItem + helpers hasRebaje/canBuy/deriveGrupo"
```

---

### Task 2: Propagar `grupo` a los productores de items

**Files:**
- Modify: `src/scripts/cart.ts` (load + `[data-add-producto]`)
- Modify: `src/scripts/calculator.ts:129-136`

- [ ] **Step 1: `load()` completa `grupo` para items viejos**

En `src/scripts/cart.ts`, agregar `deriveGrupo` al import de `../lib/cart` (línea 6-7). La línea 6 actual es `import * as Cart from '../lib/cart';` — eso ya expone `Cart.deriveGrupo`. Reemplazar la función `load()` (líneas 27-29) por:
```ts
function load(): CartItem[] {
  try {
    const raw: CartItem[] = JSON.parse(localStorage.getItem('ds_cart') || '[]');
    return raw.map(i => i.grupo ? i : { ...i, grupo: Cart.deriveGrupo(i.id) });
  } catch (_) { return []; }
}
```

- [ ] **Step 2: `[data-add-producto]` incluye `grupo`**

En `src/scripts/cart.ts`, en el handler de `[data-add-producto]` (línea ~169), reemplazar la llamada `add({...})` por:
```ts
        add({ id: `${ID_PREFIX[p.grupo]}-${p.slug}`, name: p.name, variant: p.shortDescription, unitPrice: p.price, label: p.name, image: p.image, grupo: p.grupo });
```

- [ ] **Step 3: Calculadora incluye `grupo: 'rebaje'`**

En `src/scripts/calculator.ts`, en el objeto pasado a `window.dsCart.add({...})` (líneas 129-136), agregar la propiedad `grupo: 'rebaje',` (por ejemplo justo después de `id:`):
```ts
      window.dsCart.add({
        id: `calc-${state.tipo}-${state.ancho}-${state.banco}`,
        grupo: 'rebaje',
        name: `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}`,
        variant: `${state.ancho} cm · ${state.comuna}, ${state.region}${discAmt > 0 ? ' · banco ' + state.banco : ''}`,
        unitPrice: final,
        label: `${state.tipo.toUpperCase()} ${state.ancho}`,
        image: PRODUCT_MEDIA[state.tipo]?.image,
      });
```
*(El texto "Jacuzzi" se corrige en la Task 7; aquí solo se agrega `grupo`.)*

- [ ] **Step 4: Verificar que compila**

Run: `npx astro check`
Expected: 0 errores (los productores ahora cumplen el tipo `NewItem` con `grupo`).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/cart.ts src/scripts/calculator.ts
git commit -m "feat(cart): propagar grupo desde catálogo, calculadora y localStorage"
```

---

### Task 3: Drawer con dos acciones (Continuar cotización / Comprar)

**Files:**
- Modify: `src/components/QuoteDrawer.astro` (footer)
- Modify: `src/scripts/cart.ts` (renderCart estado de botones + quitar bindQuoteForm)

- [ ] **Step 1: Reemplazar el footer del drawer**

En `src/components/QuoteDrawer.astro`, reemplazar el bloque `<form class="drawer__form" ...>...</form>` y el `<button ... id="sendQuote">...</button>` (líneas 22-34) por:
```html
    <a class="btn btn--primary btn--full" id="goCotizar" href="/cotizar">
      Continuar con la cotización
    </a>
    <button class="btn btn--secondary btn--full" id="goComprar" type="button" style="margin-top:8px">
      Comprar
    </button>
    <p class="drawer__buy-note" id="buyNote" style="display:none">Pago online próximamente.</p>
    <p class="drawer__buy-note" id="buyBlocked" style="display:none">La compra online no está disponible junto a un rebaje. Continúa con la cotización.</p>
```

Agregar al `<style is:global>` (cerca de `.drawer__note`):
```css
  .drawer__buy-note{font-size:12px;color:var(--ds-text);margin:8px 0 0;text-align:center}
  .btn--secondary:disabled{opacity:.5;cursor:not-allowed}
  .btn--secondary:disabled:hover{background:#fff;transform:none}
```

- [ ] **Step 2: `renderCart()` actualiza el estado de "Comprar"**

En `src/scripts/cart.ts`, dentro de `renderCart()`, después de la línea que setea `drawerFoot.style.display = ''` (al final de la función, línea ~142), agregar:
```ts
  const buyBtn = document.getElementById('goComprar') as HTMLButtonElement | null;
  const buyNote = document.getElementById('buyNote');
  const buyBlocked = document.getElementById('buyBlocked');
  if (buyBtn) {
    const canBuy = Cart.canBuy(items);
    buyBtn.disabled = !canBuy;
    if (buyNote) buyNote.style.display = canBuy ? '' : 'none';
    if (buyBlocked) buyBlocked.style.display = (!canBuy && Cart.hasRebaje(items)) ? '' : 'none';
  }
```

- [ ] **Step 3: Reemplazar `bindQuoteForm` por `bindBuyButton`**

En `src/scripts/cart.ts`, reemplazar toda la función `bindQuoteForm()` (líneas 207-247) por:
```ts
// --- Botón "Comprar": placeholder de pagos (once per session) ---
function bindBuyButton(): void {
  if (_quoteBound) return;
  _quoteBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (!target.closest('#goComprar')) return;
    e.preventDefault();
    if (!Cart.canBuy(items)) return;
    showToast('Pago online próximamente. Mientras tanto, continúa con la cotización.');
  });
}
```

En `initCart()` reemplazar la llamada `bindQuoteForm();` (línea ~269) por `bindBuyButton();`.

Quedan sin uso los imports `escapeHtml` no — sigue usándose en renderCart. `SITE` ya no se usa para WhatsApp del drawer: verificar si `SITE` queda sin uso. Si `npx astro check` marca `SITE` sin uso, quitar su import (línea 11). `clp` sigue usándose.

- [ ] **Step 4: Verificar build + comportamiento**

Run: `npx astro check`
Expected: 0 errores. (Si marca import sin uso de `SITE`, quitarlo y re-correr.)

Verificación manual (dev server): agregar un accesorio → "Comprar" habilitado, muestra "Pago online próximamente"; agregar un rebaje → "Comprar" deshabilitado y aparece la nota de bloqueo; "Continuar con la cotización" siempre lleva a `/cotizar`.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuoteDrawer.astro src/scripts/cart.ts
git commit -m "feat(drawer): dos acciones (continuar cotización / comprar) con habilitación por grupo"
```

---

### Task 4: Datos `tinas.ts` + imágenes placeholder

**Files:**
- Create: `src/data/tinas.ts`
- Create: `public/images/tinas/README.txt` (+ 6 placeholders SVG)

- [ ] **Step 1: Crear `src/data/tinas.ts`**

```ts
export interface TipoTina {
  id: string;
  name: string;
  nota?: string;
  image: string;
}

// 6 tipos de la tina EXISTENTE del cliente (distinto del producto rebaje).
// Imágenes placeholder en public/images/tinas/ — reemplazar por reales luego.
export const TIPOS_TINA: TipoTina[] = [
  { id: 'acero-acrilica', name: 'Tina acero esmaltado o acrílica', image: '/images/tinas/acero-acrilica.svg' },
  { id: 'hidromasaje',    name: 'Tina hidromasaje',                image: '/images/tinas/hidromasaje.svg' },
  { id: 'fierro-fundido', name: 'Tina fierro fundido',             image: '/images/tinas/fierro-fundido.svg' },
  { id: 'especial-1',     name: 'Tina especial', nota: 'Borde grueso',            image: '/images/tinas/especial-1.svg' },
  { id: 'especial-2',     name: 'Tina especial', nota: 'Mampara o shower door',   image: '/images/tinas/especial-2.svg' },
  { id: 'especial-3',     name: 'Tina especial', nota: 'Borde grueso irregular',  image: '/images/tinas/especial-3.svg' },
];

export const TINA_IDS = TIPOS_TINA.map(t => t.id);
export const getTina = (id: string) => TIPOS_TINA.find(t => t.id === id);
```

- [ ] **Step 2: Crear 6 placeholders SVG**

Crear cada archivo `public/images/tinas/<id>.svg` con este contenido (cambiando el texto por el nombre corto). Plantilla para `acero-acrilica.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="Placeholder tina">
  <rect width="320" height="200" fill="#eef2f5"/>
  <rect x="40" y="70" width="240" height="80" rx="40" fill="#cdd8e0"/>
  <text x="160" y="180" font-family="sans-serif" font-size="14" fill="#5b6b78" text-anchor="middle">acero / acrílica</text>
</svg>
```
Repetir para `hidromasaje.svg` (texto "hidromasaje"), `fierro-fundido.svg` ("fierro fundido"), `especial-1.svg` ("borde grueso"), `especial-2.svg` ("mampara"), `especial-3.svg` ("borde irregular").

Crear `public/images/tinas/README.txt`:
```
Placeholders de los 6 tipos de tina (selector de /cotizar).
Reemplazar cada .svg por la foto real (puede ser .jpg/.webp; actualizar la ruta en src/data/tinas.ts).
```

- [ ] **Step 3: Verificar**

Run: `npx astro check`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add src/data/tinas.ts public/images/tinas/
git commit -m "feat(data): 6 tipos de tina + placeholders SVG"
```

---

### Task 5: Página `/cotizar` + script de cliente

**Files:**
- Create: `src/pages/cotizar.astro`
- Create: `src/scripts/cotizar.ts`

- [ ] **Step 1: Crear `src/pages/cotizar.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { TIPOS_TINA } from '../data/tinas';
import { COMUNAS } from '../data/comunas';
---
<BaseLayout title="Completar cotización — Ducha Segura®" description="Completa los datos de tu cotización: tipo de tina, dirección de instalación y contacto.">
  <section class="section">
    <div class="container cotizar">
      <header class="section-head">
        <span class="kicker">Cotización</span>
        <h1 class="h2">Completa tu cotización</h1>
        <p class="lead">Revisa tu selección y déjanos tus datos. Te contactamos con la cotización final.</p>
      </header>

      <div class="cotizar__grid">
        <!-- Resumen -->
        <aside class="cotizar__summary" id="cotizarSummary" aria-live="polite">
          <h2 class="cotizar__h">Tu selección</h2>
          <div id="cotizarItems"></div>
          <div class="cotizar__total"><span>Total estimado</span><span>$<span id="cotizarTotal">0</span></span></div>
          <p class="cotizar__note">Precios referenciales. Envío + instalación incluidos. Sujeto a confirmación final.</p>
        </aside>

        <!-- Formulario -->
        <form class="cotizar__form" id="cotizarForm" novalidate>
          <div class="cotizar__empty" id="cotizarEmpty" style="display:none">
            <p>Tu cotización está vacía.</p>
            <a class="btn btn--primary" href="/catalogo">Ver catálogo</a>
          </div>

          <div id="cotizarFields">
            <!-- Tipo de tina (solo si hay rebaje) -->
            <fieldset class="cotizar__block" id="tinaBlock" style="display:none">
              <legend class="cotizar__h">¿Cuál es tu tipo de tina?</legend>
              <p class="cotizar__hint">Selecciona la tina que tienes hoy.</p>
              <div class="tina-grid">
                {TIPOS_TINA.map((t) => (
                  <label class="tina-card">
                    <input type="radio" name="tipoTina" value={t.id} />
                    <img src={t.image} alt={t.name} loading="lazy" />
                    <span class="tina-card__name">{t.name}{t.nota ? <small>{t.nota}</small> : null}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset class="cotizar__block">
              <legend class="cotizar__h">Datos de contacto</legend>
              <div class="cotizar__row">
                <label>Nombre<input type="text" name="nombre" required autocomplete="name" /></label>
                <label>Teléfono<input type="tel" name="telefono" required autocomplete="tel" /></label>
              </div>
              <label>Email<input type="email" name="email" required autocomplete="email" /></label>
            </fieldset>

            <fieldset class="cotizar__block">
              <legend class="cotizar__h">Dirección de instalación</legend>
              <label>Calle y número<input type="text" name="direccion" required autocomplete="street-address" /></label>
              <div class="cotizar__row">
                <label>Depto / Casa (opcional)<input type="text" name="depto" /></label>
                <label>Región
                  <select name="region" id="regionSel" required>
                    <option value="">Selecciona…</option>
                    {Object.keys(COMUNAS).map((r) => <option value={r}>{r}</option>)}
                  </select>
                </label>
              </div>
              <label>Comuna
                <select name="comuna" id="comunaSel" required disabled>
                  <option value="">Selecciona una región primero</option>
                </select>
              </label>
              <label>Referencia (opcional)<input type="text" name="referencia" placeholder="Block, conserjería, etc." /></label>
            </fieldset>

            <fieldset class="cotizar__block">
              <legend class="cotizar__h">Notas (opcional)</legend>
              <textarea name="notas" rows="3" placeholder="Medidas del baño (ancho, largo, material), horario de contacto, etc."></textarea>
            </fieldset>

            <!-- honeypot anti-spam -->
            <input type="text" name="website" tabindex="-1" autocomplete="off" class="cotizar__hp" aria-hidden="true" />

            <p class="cotizar__error" id="cotizarError" role="alert" style="display:none"></p>
            <button class="btn btn--primary btn--lg btn--full" id="cotizarSubmit" type="submit">Enviar cotización</button>
          </div>
        </form>
      </div>
    </div>
  </section>

  <script type="application/json" id="comunasData" set:html={JSON.stringify(COMUNAS)}></script>
</BaseLayout>

<style>
  .cotizar__grid{display:grid;grid-template-columns:340px 1fr;gap:32px;align-items:start}
  @media (max-width:860px){.cotizar__grid{grid-template-columns:1fr}}
  .cotizar__summary{background:var(--ds-bg-alt);border:1px solid var(--ds-border);border-radius:var(--ds-radius);padding:20px;position:sticky;top:120px}
  @media (max-width:860px){.cotizar__summary{position:static}}
  .cotizar__h{font-family:var(--ds-display);font-weight:700;font-size:18px;color:var(--ds-text-strong);margin:0 0 12px}
  .cotizar__total{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;color:var(--ds-text-strong);border-top:1px solid var(--ds-border);padding-top:12px;margin-top:8px;font-size:18px;font-variant-numeric:tabular-nums}
  .cotizar__note{font-size:12px;color:var(--ds-text);margin:10px 0 0}
  .cot-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--ds-border)}
  .cot-item__media{width:44px;height:44px;border-radius:6px;overflow:hidden;background:#f4f4f2;flex-shrink:0}
  .cot-item__media img{width:100%;height:100%;object-fit:cover}
  .cot-item__name{font-size:13px;font-weight:700;color:var(--ds-text-strong);line-height:1.2}
  .cot-item__meta{font-size:11px;color:var(--ds-text)}
  .cotizar__block{border:1px solid var(--ds-border);border-radius:var(--ds-radius);padding:18px;margin:0 0 16px}
  .cotizar__block legend{padding:0 6px}
  .cotizar__row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media (max-width:520px){.cotizar__row{grid-template-columns:1fr}}
  .cotizar__form label{display:block;font-size:13px;font-weight:600;color:var(--ds-text-strong);margin:0 0 12px}
  .cotizar__form input,.cotizar__form select,.cotizar__form textarea{display:block;width:100%;margin-top:5px;padding:10px 12px;border:1px solid var(--ds-border);border-radius:var(--ds-radius);font-family:var(--ds-sans);font-size:15px;font-weight:400;color:var(--ds-text-strong);background:#fff;outline:none;transition:border-color .15s}
  .cotizar__form input:focus,.cotizar__form select:focus,.cotizar__form textarea:focus{border-color:var(--ds-blue)}
  .cotizar__hint{font-size:13px;color:var(--ds-text);margin:0 0 12px}
  .tina-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  @media (max-width:520px){.tina-grid{grid-template-columns:1fr 1fr}}
  .tina-card{position:relative;border:2px solid var(--ds-border);border-radius:12px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;transition:border-color .15s,box-shadow .15s}
  .tina-card:hover{border-color:var(--ds-blue)}
  .tina-card input{position:absolute;opacity:0;pointer-events:none}
  .tina-card:has(input:checked){border-color:var(--ds-blue);box-shadow:0 0 0 3px var(--ds-blue-soft)}
  .tina-card img{width:100%;height:96px;object-fit:cover;background:#eef2f5}
  .tina-card__name{padding:8px;font-size:12px;font-weight:700;color:var(--ds-text-strong);line-height:1.2}
  .tina-card__name small{display:block;font-weight:500;color:var(--ds-text);font-size:11px;margin-top:2px}
  .cotizar__hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
  .cotizar__error{background:#fde8e8;color:var(--ds-red,#c0392b);border-radius:var(--ds-radius);padding:10px 12px;font-size:13px;font-weight:600;margin:0 0 12px}
  .cotizar__empty{text-align:center;padding:40px 0;color:var(--ds-text)}
  .cotizar__empty .btn{margin-top:12px}
</style>
```

- [ ] **Step 2: Crear `src/scripts/cotizar.ts`**

```ts
// cotizar.ts — Página de cotización: hidrata resumen del carrito, comuna dependiente,
// validación y envío al backend. Se inicializa en cada astro:page-load (solo si existe el form).
import * as Cart from '../lib/cart';
import type { CartItem } from '../lib/cart';
import { clp } from '../lib/format';
import { escapeHtml } from './dom';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api/cotizacion.php'
  : '/api/cotizacion.php';

function load(): CartItem[] {
  try {
    const raw: CartItem[] = JSON.parse(localStorage.getItem('ds_cart') || '[]');
    return raw.map(i => i.grupo ? i : { ...i, grupo: Cart.deriveGrupo(i.id) });
  } catch (_) { return []; }
}

export function initCotizar(): void {
  const form = document.getElementById('cotizarForm') as HTMLFormElement | null;
  if (!form) return; // no estamos en /cotizar

  const items = load();
  const itemsEl = document.getElementById('cotizarItems');
  const totalEl = document.getElementById('cotizarTotal');
  const emptyEl = document.getElementById('cotizarEmpty');
  const fieldsEl = document.getElementById('cotizarFields');
  const tinaBlock = document.getElementById('tinaBlock');
  const errorEl = document.getElementById('cotizarError');

  // Carrito vacío → mostrar mensaje, ocultar formulario
  if (items.length === 0) {
    if (emptyEl) emptyEl.style.display = '';
    if (fieldsEl) fieldsEl.style.display = 'none';
    return;
  }

  // Resumen
  if (itemsEl) {
    itemsEl.innerHTML = items.map(i => `
      <div class="cot-item">
        <div class="cot-item__media">${i.image ? `<img src="${escapeHtml(i.image)}" alt="${escapeHtml(i.name)}">` : ''}</div>
        <div>
          <div class="cot-item__name">${escapeHtml(i.name)}</div>
          <div class="cot-item__meta">${escapeHtml(i.variant)} · Cant: ${i.qty} · $${clp(i.unitPrice * i.qty)}</div>
        </div>
      </div>`).join('');
  }
  if (totalEl) totalEl.textContent = clp(Cart.subtotal(items));

  // Tipo de tina solo si hay rebaje
  const needsTina = Cart.hasRebaje(items);
  if (tinaBlock) tinaBlock.style.display = needsTina ? '' : 'none';

  // Comuna dependiente de región
  const comunas = JSON.parse(document.getElementById('comunasData')?.textContent || '{}') as Record<string, string[]>;
  const regionSel = document.getElementById('regionSel') as HTMLSelectElement | null;
  const comunaSel = document.getElementById('comunaSel') as HTMLSelectElement | null;
  regionSel?.addEventListener('change', () => {
    if (!comunaSel) return;
    const list = comunas[regionSel.value] || [];
    comunaSel.innerHTML = '<option value="">Selecciona…</option>' +
      list.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    comunaSel.disabled = list.length === 0;
  });

  // Envío
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    // honeypot
    if ((form.elements.namedItem('website') as HTMLInputElement)?.value) return;

    if (!form.reportValidity()) return;
    if (needsTina && !(form.elements.namedItem('tipoTina') as RadioNodeList | null)?.value) {
      showError(errorEl, 'Selecciona tu tipo de tina.');
      return;
    }

    const fd = new FormData(form);
    const payload = {
      nombre: fd.get('nombre'), telefono: fd.get('telefono'), email: fd.get('email'),
      direccion: fd.get('direccion'), depto: fd.get('depto'), region: fd.get('region'),
      comuna: fd.get('comuna'), referencia: fd.get('referencia'), notas: fd.get('notas'),
      tipoTina: needsTina ? fd.get('tipoTina') : null,
      total: Cart.subtotal(items),
      items: items.map(i => ({ id: i.id, name: i.name, variant: i.variant, grupo: i.grupo, qty: i.qty, unitPrice: i.unitPrice })),
    };

    const btn = document.getElementById('cotizarSubmit') as HTMLButtonElement | null;
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    try {
      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al enviar');
      localStorage.removeItem('ds_cart');
      window.location.href = `/gracias-por-contactarnos?id=${encodeURIComponent(data.id)}`;
    } catch (err) {
      showError(errorEl, 'No pudimos enviar tu cotización. Revisa tu conexión e inténtalo de nuevo.');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar cotización'; }
    }
  });
}

function showError(el: HTMLElement | null, msg: string): void {
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

- [ ] **Step 3: Inicializar el script en BaseLayout**

En `src/layouts/BaseLayout.astro`, en el `<script>` (líneas 67-73), agregar el import e init de cotizar:
```astro
  <script>
    import { initUI } from '../scripts/ui';
    import { initCart } from '../scripts/cart';
    import { initQuickView } from '../scripts/quickview';
    import { initSearch } from '../scripts/search';
    import { initCotizar } from '../scripts/cotizar';
    document.addEventListener('astro:page-load', () => { initUI(); initCart(); initQuickView(); initSearch(); initCotizar(); });
  </script>
```

- [ ] **Step 4: Verificar**

Run: `npx astro check`
Expected: 0 errores.

Verificación manual (dev): con accesorios en el carrito, `/cotizar` NO muestra el bloque de tina; agregando un rebaje, SÍ lo muestra y es obligatorio. La comuna se habilita al elegir región. Carrito vacío → mensaje. (El envío fallará hasta la Fase 2; eso es esperado.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/cotizar.astro src/scripts/cotizar.ts src/layouts/BaseLayout.astro
git commit -m "feat(cotizar): página de cotización con tipo de tina condicional y envío al backend"
```

---

### Task 6: Página `/gracias-por-contactarnos`

**Files:**
- Create: `src/pages/gracias-por-contactarnos.astro`

- [ ] **Step 1: Crear la página**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="¡Gracias por contactarnos! — Ducha Segura®" description="Recibimos tu solicitud de cotización. Te contactaremos a la brevedad.">
  <section class="section">
    <div class="container gracias">
      <div class="gracias__icon"><svg class="ic"><use href="#i-check"/></svg></div>
      <h1 class="h2">¡Gracias! Recibimos tu cotización</h1>
      <p class="lead gracias__lead">Un asesor de Ducha Segura te contactará a la brevedad con la cotización final. Te enviamos una copia a tu email.</p>
      <p class="gracias__id" id="graciasId" style="display:none"></p>
      <div class="gracias__actions">
        <a class="btn btn--primary btn--lg" href="/">Volver al inicio</a>
        <a class="btn btn--secondary btn--lg" href="/catalogo">Seguir viendo productos</a>
      </div>
    </div>
  </section>

  <script>
    document.addEventListener('astro:page-load', () => {
      const id = new URLSearchParams(window.location.search).get('id');
      const el = document.getElementById('graciasId');
      if (id && el) { el.textContent = `N° de cotización: ${id}`; el.style.display = ''; }
    });
  </script>
</BaseLayout>

<style>
  .gracias{max-width:620px;margin:0 auto;text-align:center}
  .gracias__icon{width:64px;height:64px;margin:0 auto 20px;border-radius:50%;background:var(--ds-blue-soft);color:var(--ds-blue);display:flex;align-items:center;justify-content:center}
  .gracias__icon .ic{width:30px;height:30px}
  .gracias__lead{margin-left:auto;margin-right:auto}
  .gracias__id{font-weight:700;color:var(--ds-text-strong);margin-top:16px;font-variant-numeric:tabular-nums}
  .gracias__actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:28px}
</style>
```

- [ ] **Step 2: Verificar que el ícono `#i-check` existe**

Run: `grep -n "i-check" src/components/Icons.astro`
Expected: una coincidencia (id del símbolo). Si NO existe, agregar al `<svg>` de Icons.astro este símbolo:
```html
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
```

- [ ] **Step 3: Verificar build**

Run: `npx astro check && npm run build`
Expected: 0 errores; la página `/gracias-por-contactarnos` aparece en el build.

- [ ] **Step 4: Commit**

```bash
git add src/pages/gracias-por-contactarnos.astro src/components/Icons.astro
git commit -m "feat(gracias): página de confirmación post-cotización"
```

---

### Task 7: Rename "Jacuzzi" → "Hidromasaje" (solo textos visibles)

**Files:**
- Modify: `src/data/productos.ts` (NAME_OVERRIDE)
- Modify: `src/components/Calculator.astro:20`
- Modify: `src/scripts/calculator.ts:61,131`
- Modify: `src/data/products-media.ts:19`
- Modify: `src/pages/rebaje-de-tina.astro:8`
- Modify: `src/data/convenios.ts` (textos visibles)

- [ ] **Step 1: `NAME_OVERRIDE` en `productos.ts`**

En `src/data/productos.ts`, después del bloque `IMG_OVERRIDE` (línea 26), agregar:
```ts
// Renombrar el nombre VISIBLE (no el slug, que está indexado). Sobrevive a re-importar de WC.
const NAME_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-jacuzzi': 'Rebaje de tina: Hidromasaje',
};
```
Y en el `.map` que arma `wc` (líneas 28-31), agregar el override de `name`:
```ts
const wc: Producto[] = (data as Producto[]).map((p) => ({
  ...p,
  name: NAME_OVERRIDE[p.slug] ?? p.name,
  image: IMG_OVERRIDE[p.slug] ?? p.image,
}));
```

- [ ] **Step 2: Calculadora (chip + textos)**

En `src/components/Calculator.astro` línea 20, cambiar el label del botón (mantener `data-value="jacuzzi"`):
```html
            <button class="calc-chip" data-value="jacuzzi">Hidromasaje</button>
```

En `src/scripts/calculator.ts`:
- Línea 61: `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}` → `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Hidromasaje' : 'Tradicional'}`
- Línea 131 (dentro del `add`): mismo cambio de `'Jacuzzi'` → `'Hidromasaje'`.

- [ ] **Step 3: Alt de imagen + meta**

En `src/data/products-media.ts` línea 19:
```ts
    alt: 'Tina hidromasaje en un baño, lista para rebaje',
```
En `src/pages/rebaje-de-tina.astro` línea 8, cambiar la `description`:
```astro
<BaseLayout title="Rebajes de tina — Ducha Segura®" description="Rebajes de tina Tradicional e Hidromasaje. Instalación incluida, garantía 3 años.">
```

- [ ] **Step 4: Convenios (textos visibles)**

En `src/data/convenios.ts`, reemplazar en los strings visibles "Jacuzzi / Hidromasaje" → "Hidromasaje" y "Jacuzzi" suelto → "Hidromasaje". Líneas afectadas: 21, 46, 69, 108, 133, 145. Ejemplos:
- Línea 21: `'Jacuzzi / Hidromasaje: $368.000 (normal $460.000)'` → `'Hidromasaje: $368.000 (normal $460.000)'`
- Línea 46: `'Jacuzzi / Hidromasaje: $391.000 (normal $460.000) + barra cromada 40 cm con instalación'` → `'Hidromasaje: $391.000 (normal $460.000) + barra cromada 40 cm con instalación'`
- Líneas 69/108/133: `'Opción A — 10% dcto.: Tina $328.500 · Jacuzzi $414.000'` → `'… · Hidromasaje $414.000'`
- Línea 145: `'Opción A — 15% dcto.: Tina $310.250 · Jacuzzi $391.000'` → `'… · Hidromasaje $391.000'`
- El comentario de la línea 12 puede dejarse o actualizarse (no es visible). Actualizarlo por prolijidad: "Jacuzzi/Hidromasaje" → "Hidromasaje".

- [ ] **Step 5: Verificar que solo quedan referencias permitidas**

Run: `npx astro check && npm test`
Expected: 0 errores; tests en verde (los tests de pricing usan la key interna `'jacuzzi'`, que NO cambiamos).

Run: `grep -rni "jacuzzi" src/data src/components src/scripts src/pages`
Expected: solo quedan: slug `rebaje-de-tina-jacuzzi`, keys internas (`'jacuzzi'`, `data-value="jacuzzi"`, `state.tipo === 'jacuzzi'`, `PRODUCT_MEDIA.jacuzzi`/`jacuzzi:` en products-media), y rutas de imagen (`Rebaje Tina Jacuzzi.webp`). Ningún texto visible.

- [ ] **Step 6: Commit**

```bash
git add src/data/productos.ts src/components/Calculator.astro src/scripts/calculator.ts src/data/products-media.ts src/pages/rebaje-de-tina.astro src/data/convenios.ts
git commit -m "refactor: renombrar Jacuzzi→Hidromasaje en textos visibles (slugs/keys intactos)"
```

---

## FASE 2 — Backend PHP + MySQL

> **Nota de entorno:** estas tareas requieren PHP local (`php -v` ≥ 8.0) y una base MySQL de prueba. El backend vive en `public/api/` y `public/admin/` (Astro copia `public/` a `dist/` tal cual). Las credenciales reales van en `public/api/config.php` (gitignored).

### Task 8: Estructura backend, config, .gitignore, .htaccess, conexión PDO

**Files:**
- Create: `public/api/config.example.php`
- Create: `public/api/db.php`
- Create: `public/api/.htaccess`
- Modify: `.gitignore`

- [ ] **Step 1: `.gitignore` ignora la config real**

Agregar al final de `.gitignore`:
```
# Backend PHP — credenciales reales (no commitear)
public/api/config.php
```

- [ ] **Step 2: `public/api/config.example.php`**

```php
<?php
// Copia este archivo a config.php y completa con credenciales reales (NO commitear config.php).
return [
  'db' => [
    'host' => 'localhost',
    'name' => 'ducha_cotizaciones',
    'user' => 'CAMBIAR',
    'pass' => 'CAMBIAR',
  ],
  'smtp' => [
    'host' => 'smtp.hostinger.com',
    'port' => 465,
    'secure' => 'ssl',          // 'ssl' (465) o 'tls' (587)
    'user' => 'cotizaciones@duchasegura.cl',
    'pass' => 'CAMBIAR',
    'from_email' => 'cotizaciones@duchasegura.cl',
    'from_name' => 'Ducha Segura',
  ],
  'manager_email' => 'CAMBIAR@duchasegura.cl', // copia al gestor
  'site_url' => 'https://www.duchasegura.cl',
  'cors_origin' => '*', // en prod, mismo origen; en dev permite localhost:4321
];
```

- [ ] **Step 3: `public/api/db.php`**

```php
<?php
// Carga config + conexión PDO compartida.
function ds_config(): array {
  static $cfg = null;
  if ($cfg === null) {
    $path = __DIR__ . '/config.php';
    if (!file_exists($path)) {
      http_response_code(500);
      header('Content-Type: application/json');
      echo json_encode(['ok' => false, 'error' => 'config_missing']);
      exit;
    }
    $cfg = require $path;
  }
  return $cfg;
}

function ds_db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $c = ds_config()['db'];
    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  }
  return $pdo;
}
```

- [ ] **Step 4: `public/api/.htaccess`**

```apache
# Bloquear acceso directo a includes y archivos sensibles
<FilesMatch "\.(sql)$">
  Require all denied
</FilesMatch>
<Files "config.php">
  Require all denied
</Files>
<Files "config.example.php">
  Require all denied
</Files>
<Files "db.php">
  Require all denied
</Files>
<Files "mailer.php">
  Require all denied
</Files>
# Bloquear la carpeta de librerías (PHPMailer)
RedirectMatch 403 ^/api/lib/.*$
```

- [ ] **Step 5: Verificar (manual)**

Crear `public/api/config.php` local (copia de example con credenciales de tu MySQL de prueba).
Run: `php -S localhost:8080 -t public`
En otra terminal: `php -r "require 'public/api/db.php'; ds_db(); echo 'OK';"`
Expected: imprime `OK` (conexión válida). Si falla, revisar credenciales/servicio MySQL.

- [ ] **Step 6: Commit**

```bash
git add public/api/config.example.php public/api/db.php public/api/.htaccess .gitignore
git commit -m "feat(api): estructura backend, config de ejemplo, PDO y .htaccess"
```

---

### Task 9: Esquema MySQL

**Files:**
- Create: `public/api/schema.sql`

- [ ] **Step 1: `public/api/schema.sql`**

```sql
-- Esquema de cotizaciones — Ducha Segura
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  telefono      VARCHAR(40)  NOT NULL,
  email         VARCHAR(180) NOT NULL,
  direccion     VARCHAR(200) NOT NULL,
  depto         VARCHAR(80)  NULL,
  region        VARCHAR(60)  NOT NULL,
  comuna        VARCHAR(80)  NOT NULL,
  referencia    VARCHAR(200) NULL,
  tipo_tina     VARCHAR(40)  NULL,
  notas         TEXT         NULL,
  total_estimado INT UNSIGNED NOT NULL DEFAULT 0,
  estado        ENUM('nueva','contactada','cotizada','cerrada') NOT NULL DEFAULT 'nueva',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cotizacion_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cotizacion_id INT UNSIGNED NOT NULL,
  producto_id   VARCHAR(120) NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  variante      VARCHAR(200) NULL,
  grupo         VARCHAR(20)  NOT NULL,
  cantidad      INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_cot FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(180) NOT NULL UNIQUE,
  nombre        VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('admin','gestor') NOT NULL DEFAULT 'gestor',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: Importar el esquema en la DB de prueba**

Run: `mysql -u <user> -p ducha_cotizaciones < public/api/schema.sql`
Expected: sin errores; 3 tablas creadas (`SHOW TABLES;`).

- [ ] **Step 3: Commit**

```bash
git add public/api/schema.sql
git commit -m "feat(api): esquema MySQL (cotizaciones, items, admin_users)"
```

---

### Task 10: PHPMailer + wrapper de email

**Files:**
- Create: `public/api/lib/phpmailer/{PHPMailer.php,SMTP.php,Exception.php}` (descargados)
- Create: `public/api/mailer.php`

- [ ] **Step 1: Descargar PHPMailer (3 archivos, sin composer)**

Descargar desde https://github.com/PHPMailer/PHPMailer/tree/master/src los archivos `PHPMailer.php`, `SMTP.php`, `Exception.php` a `public/api/lib/phpmailer/`.

Run (PowerShell):
```powershell
$dir = "public/api/lib/phpmailer"; New-Item -ItemType Directory -Force $dir | Out-Null
$base = "https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src"
foreach ($f in "PHPMailer.php","SMTP.php","Exception.php") { Invoke-WebRequest "$base/$f" -OutFile "$dir/$f" }
```
Expected: 3 archivos presentes en `public/api/lib/phpmailer/`.

- [ ] **Step 2: `public/api/mailer.php`**

```php
<?php
require_once __DIR__ . '/lib/phpmailer/Exception.php';
require_once __DIR__ . '/lib/phpmailer/PHPMailer.php';
require_once __DIR__ . '/lib/phpmailer/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Envía un email HTML. Devuelve true/false (no lanza: el caller decide).
function ds_send_mail(string $toEmail, string $toName, string $subject, string $html): bool {
  $cfg = ds_config()['smtp'];
  $mail = new PHPMailer(true);
  try {
    $mail->isSMTP();
    $mail->Host = $cfg['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $cfg['user'];
    $mail->Password = $cfg['pass'];
    $mail->SMTPSecure = $cfg['secure'];
    $mail->Port = (int)$cfg['port'];
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($cfg['from_email'], $cfg['from_name']);
    $mail->addAddress($toEmail, $toName);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '</p>'], "\n", $html));
    $mail->send();
    return true;
  } catch (Exception $e) {
    error_log('ds_send_mail error: ' . $mail->ErrorInfo);
    return false;
  }
}

function ds_email_layout(string $title, string $bodyHtml): string {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1d2b36">'
    . '<div style="background:#0072C0;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold">Ducha Segura&reg;</div>'
    . '<div style="border:1px solid #e3e8ec;border-top:0;border-radius:0 0 8px 8px;padding:24px">'
    . '<h2 style="margin:0 0 12px;font-size:18px">' . htmlspecialchars($title) . '</h2>'
    . $bodyHtml
    . '</div></div>';
}
```

- [ ] **Step 3: Commit**

```bash
git add public/api/lib/phpmailer public/api/mailer.php
git commit -m "feat(api): PHPMailer (vendored) + wrapper de email con layout"
```

---

### Task 11: Endpoint `cotizacion.php`

**Files:**
- Create: `public/api/cotizacion.php`

- [ ] **Step 1: `public/api/cotizacion.php`**

```php
<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

$cfg = ds_config();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $cfg['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method']); exit; }

$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_json']); exit; }

// Helpers
function s($v, $max = 255) { return mb_substr(trim((string)($v ?? '')), 0, $max); }
function bad($msg) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>$msg]); exit; }

$nombre = s($d['nombre'] ?? '', 120);
$telefono = s($d['telefono'] ?? '', 40);
$email = s($d['email'] ?? '', 180);
$direccion = s($d['direccion'] ?? '', 200);
$depto = s($d['depto'] ?? '', 80);
$region = s($d['region'] ?? '', 60);
$comuna = s($d['comuna'] ?? '', 80);
$referencia = s($d['referencia'] ?? '', 200);
$notas = s($d['notas'] ?? '', 2000);
$tipoTina = isset($d['tipoTina']) && $d['tipoTina'] !== null ? s($d['tipoTina'], 40) : null;
$total = (int)($d['total'] ?? 0);
$items = is_array($d['items'] ?? null) ? $d['items'] : [];

if ($nombre === '' || $telefono === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) bad('contacto');
if ($direccion === '' || $region === '' || $comuna === '') bad('direccion');
if (count($items) === 0) bad('items');

$tieneRebaje = false;
foreach ($items as $it) { if (($it['grupo'] ?? '') === 'rebaje') { $tieneRebaje = true; break; } }
if ($tieneRebaje && !$tipoTina) bad('tipo_tina');

$pdo = ds_db();
$pdo->beginTransaction();
try {
  $stmt = $pdo->prepare('INSERT INTO cotizaciones
    (nombre,telefono,email,direccion,depto,region,comuna,referencia,tipo_tina,notas,total_estimado)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  $stmt->execute([$nombre,$telefono,$email,$direccion,$depto ?: null,$region,$comuna,$referencia ?: null,$tipoTina,$notas ?: null,$total]);
  $id = (int)$pdo->lastInsertId();

  $istmt = $pdo->prepare('INSERT INTO cotizacion_items
    (cotizacion_id,producto_id,nombre,variante,grupo,cantidad,precio_unitario) VALUES (?,?,?,?,?,?,?)');
  foreach ($items as $it) {
    $istmt->execute([
      $id, s($it['id'] ?? '', 120), s($it['name'] ?? '', 200), s($it['variant'] ?? '', 200),
      s($it['grupo'] ?? '', 20), max(1,(int)($it['qty'] ?? 1)), max(0,(int)($it['unitPrice'] ?? 0)),
    ]);
  }
  $pdo->commit();
} catch (Throwable $e) {
  $pdo->rollBack();
  error_log('cotizacion insert error: ' . $e->getMessage());
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db']); exit;
}

// Emails (no bloquean el éxito si fallan: la cotización ya quedó guardada)
$rows = '';
foreach ($items as $it) {
  $rows .= '<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">' . htmlspecialchars($it['name'] ?? '')
    . ' <span style="color:#888">' . htmlspecialchars($it['variant'] ?? '') . '</span></td>'
    . '<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">' . (int)($it['qty'] ?? 1) . '</td>'
    . '<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">$' . number_format((int)($it['unitPrice'] ?? 0) * (int)($it['qty'] ?? 1), 0, ',', '.') . '</td></tr>';
}
$tabla = '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">' . $rows
  . '<tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Total estimado</td>'
  . '<td style="padding:8px;text-align:right;font-weight:bold">$' . number_format($total, 0, ',', '.') . '</td></tr></table>';

// Cliente
ds_send_mail($email, $nombre, 'Recibimos tu cotización — Ducha Segura', ds_email_layout(
  "¡Gracias, $nombre!",
  "<p>Recibimos tu solicitud de cotización (N° <b>$id</b>). Un asesor te contactará a la brevedad.</p>"
  . "<p><b>Resumen:</b></p>$tabla"
  . "<p style='color:#888;font-size:12px'>Precios referenciales, sujetos a confirmación final.</p>"
));

// Gestor
$dir = htmlspecialchars("$direccion" . ($depto ? ", $depto" : "") . " · $comuna, $region" . ($referencia ? " ($referencia)" : ""));
ds_send_mail($cfg['manager_email'], 'Gestor Ducha Segura', "Nueva cotización #$id — $nombre", ds_email_layout(
  "Nueva cotización #$id",
  "<p><b>Contacto:</b> " . htmlspecialchars($nombre) . " · " . htmlspecialchars($telefono) . " · " . htmlspecialchars($email) . "</p>"
  . "<p><b>Instalación:</b> $dir</p>"
  . ($tipoTina ? "<p><b>Tipo de tina:</b> " . htmlspecialchars($tipoTina) . "</p>" : "")
  . ($notas ? "<p><b>Notas:</b> " . htmlspecialchars($notas) . "</p>" : "")
  . "$tabla"
));

echo json_encode(['ok'=>true, 'id'=>$id]);
```

- [ ] **Step 2: Probar el endpoint (manual)**

Con `php -S localhost:8080 -t public` corriendo:
```bash
curl -s -X POST http://localhost:8080/api/cotizacion.php -H "Content-Type: application/json" -d "{\"nombre\":\"Ana\",\"telefono\":\"+56911111111\",\"email\":\"ana@example.com\",\"direccion\":\"Calle 1\",\"region\":\"RM\",\"comuna\":\"Ñuñoa\",\"total\":229000,\"items\":[{\"id\":\"reb-trad\",\"name\":\"Rebaje\",\"variant\":\"40cm\",\"grupo\":\"rebaje\",\"qty\":1,\"unitPrice\":229000}]}"
```
Expected (con rebaje y SIN tipoTina): `{"ok":false,"error":"tipo_tina"}`.
Agregar `"tipoTina":"acero-acrilica"` → Expected: `{"ok":true,"id":N}` y la fila aparece en `SELECT * FROM cotizaciones;`.
Caso accesorio (sin rebaje, sin tipoTina) → Expected: `{"ok":true,"id":N}`.
*(Los emails pueden fallar si el SMTP no está configurado en local; eso NO debe romper la respuesta `ok:true`.)*

- [ ] **Step 3: Commit**

```bash
git add public/api/cotizacion.php
git commit -m "feat(api): endpoint cotizacion.php (validación, persistencia, emails)"
```

---

### Task 12: Stub `comprar.php` (reservado pagos)

**Files:**
- Create: `public/api/comprar.php`

- [ ] **Step 1: `public/api/comprar.php`**

```php
<?php
// Reservado para pagos online (Webpay/Flow/Mercado Pago). Aún no implementado.
header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode(['ok' => false, 'reason' => 'coming_soon', 'message' => 'Pago online próximamente.']);
```

- [ ] **Step 2: Verificar**

Run: `curl -s http://localhost:8080/api/comprar.php`
Expected: `{"ok":false,"reason":"coming_soon","message":"Pago online próximamente."}`

- [ ] **Step 3: Commit**

```bash
git add public/api/comprar.php
git commit -m "feat(api): stub comprar.php reservado para pagos"
```

---

### Task 13: CORS en dev — verificar el flujo front↔backend

**Files:** (sin cambios de código; verificación de integración)

- [ ] **Step 1: Configurar `cors_origin` para dev**

En `public/api/config.php` local, poner `'cors_origin' => 'http://localhost:4321'` (origen del dev de Astro).

- [ ] **Step 2: Probar el flujo completo en el navegador**

Con `npm run dev` (4321) y `php -S localhost:8080 -t public` corriendo:
1. Agregar un rebaje al carrito → "Continuar con la cotización" → `/cotizar`.
2. Verificar que pide tipo de tina; completar todo y enviar.
Expected: redirige a `/gracias-por-contactarnos?id=N`; fila nueva en `cotizaciones`; (si SMTP configurado) llegan los 2 emails.
3. Repetir con solo accesorios → no pide tipo de tina; envía ok.

- [ ] **Step 3: Commit (si se ajustó algo)**

Si no hubo cambios de código, no hay commit. Documentar el resultado de la verificación en el PR/notas.

---

### Task 14: Panel admin — autenticación (login/logout, sesión, CSRF)

**Files:**
- Create: `public/admin/auth.php`
- Create: `public/admin/login.php`
- Create: `public/admin/logout.php`
- Create: `public/admin/styles.css`
- Create: `public/admin/crear-admin.php` (CLI seed)

- [ ] **Step 1: `public/admin/auth.php` (helpers de sesión + CSRF + guard)**

```php
<?php
require_once __DIR__ . '/../api/db.php';
session_start();

function ds_csrf_token(): string {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  return $_SESSION['csrf'];
}
function ds_csrf_check(): void {
  if (($_POST['csrf'] ?? '') !== ($_SESSION['csrf'] ?? null)) { http_response_code(403); exit('CSRF'); }
}
function ds_user(): ?array { return $_SESSION['admin'] ?? null; }
function ds_require_login(): array {
  $u = ds_user();
  if (!$u) { header('Location: login.php'); exit; }
  return $u;
}
function ds_require_admin(): array {
  $u = ds_require_login();
  if ($u['rol'] !== 'admin') { http_response_code(403); exit('Solo administradores.'); }
  return $u;
}
function ds_e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
```

- [ ] **Step 2: `public/admin/login.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $email = trim($_POST['email'] ?? '');
  $pass = $_POST['password'] ?? '';
  $stmt = ds_db()->prepare('SELECT * FROM admin_users WHERE email = ?');
  $stmt->execute([$email]);
  $u = $stmt->fetch();
  if ($u && password_verify($pass, $u['password_hash'])) {
    session_regenerate_id(true);
    $_SESSION['admin'] = ['id'=>$u['id'],'nombre'=>$u['nombre'],'email'=>$u['email'],'rol'=>$u['rol']];
    header('Location: index.php'); exit;
  }
  $error = 'Credenciales inválidas.';
}
$csrf = ds_csrf_token();
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Ducha Segura</title><link rel="stylesheet" href="styles.css"></head>
<body class="login-body">
  <form method="post" class="login-card">
    <h1>Ducha Segura · Admin</h1>
    <?php if ($error): ?><p class="err"><?= ds_e($error) ?></p><?php endif; ?>
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>">
    <label>Email<input type="email" name="email" required></label>
    <label>Contraseña<input type="password" name="password" required></label>
    <button type="submit">Entrar</button>
  </form>
</body></html>
```

- [ ] **Step 3: `public/admin/logout.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
$_SESSION = [];
session_destroy();
header('Location: login.php');
```

- [ ] **Step 4: `public/admin/styles.css`**

```css
:root{--blue:#0072C0;--ink:#1d2b36;--border:#e3e8ec;--bg:#f5f7f9}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--blue)}
.login-body{display:flex;min-height:100vh;align-items:center;justify-content:center}
.login-card{background:#fff;border:1px solid var(--border);border-radius:10px;padding:28px;width:320px;display:flex;flex-direction:column;gap:14px}
.login-card h1{font-size:18px;margin:0 0 4px}
.login-card label{display:block;font-size:13px;font-weight:bold}
.login-card input{width:100%;margin-top:4px;padding:9px;border:1px solid var(--border);border-radius:6px}
button{background:var(--blue);color:#fff;border:0;border-radius:6px;padding:10px 14px;font-weight:bold;cursor:pointer}
button:hover{background:#005a99}
.err{background:#fde8e8;color:#c0392b;padding:8px;border-radius:6px;font-size:13px;margin:0}
.topbar{background:#fff;border-bottom:1px solid var(--border);padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.topbar nav a{margin-right:14px;font-weight:bold;text-decoration:none}
.wrap{max-width:1000px;margin:24px auto;padding:0 20px}
table.list{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden}
table.list th,table.list td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);font-size:14px}
table.list th{background:#fafbfc}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:bold}
.b-nueva{background:#e3f0fb;color:#0072C0}.b-contactada{background:#fff4d6;color:#9a6b00}
.b-cotizada{background:#e6f6ec;color:#1e7d40}.b-cerrada{background:#eceff1;color:#5b6b78}
.filters{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.filters select,.filters input{padding:8px;border:1px solid var(--border);border-radius:6px}
.card{background:#fff;border:1px solid var(--border);border-radius:8px;padding:18px;margin-bottom:16px}
.card h2{margin:0 0 10px;font-size:16px}
.kv{display:grid;grid-template-columns:160px 1fr;gap:6px;font-size:14px}
.kv dt{font-weight:bold}
```

- [ ] **Step 5: `public/admin/crear-admin.php` (seed CLI)**

```php
<?php
// USO (CLI): php public/admin/crear-admin.php email "Nombre" rol
// rol: admin | gestor. Pide la contraseña por stdin (no queda en el historial).
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Solo CLI.'); }
require_once __DIR__ . '/../api/db.php';
$email = $argv[1] ?? null; $nombre = $argv[2] ?? null; $rol = $argv[3] ?? 'gestor';
if (!$email || !$nombre || !in_array($rol, ['admin','gestor'], true)) {
  exit("Uso: php crear-admin.php email \"Nombre\" [admin|gestor]\n");
}
echo "Contraseña: "; $pass = trim(fgets(STDIN));
if (strlen($pass) < 8) exit("La contraseña debe tener al menos 8 caracteres.\n");
$hash = password_hash($pass, PASSWORD_DEFAULT);
$stmt = ds_db()->prepare('INSERT INTO admin_users (email,nombre,password_hash,rol) VALUES (?,?,?,?)
  ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password_hash=VALUES(password_hash), rol=VALUES(rol)');
$stmt->execute([$email,$nombre,$hash,$rol]);
echo "Usuario $email ($rol) creado/actualizado.\n";
```

- [ ] **Step 6: Crear el primer admin y probar login (manual)**

Run: `php public/admin/crear-admin.php admin@duchasegura.cl "Admin" admin` (ingresar contraseña ≥8).
Con `php -S localhost:8080 -t public`: abrir `http://localhost:8080/admin/login.php`, entrar.
Expected: login OK redirige a `index.php` (404 hasta la Task 15 — esperado); credenciales malas → "Credenciales inválidas".

- [ ] **Step 7: Commit**

```bash
git add public/admin/auth.php public/admin/login.php public/admin/logout.php public/admin/styles.css public/admin/crear-admin.php
git commit -m "feat(admin): autenticación con cuentas, sesión PHP, CSRF y seed CLI"
```

---

### Task 15: Panel admin — listado con filtros y paginación

**Files:**
- Create: `public/admin/index.php`
- Create: `public/admin/_layout.php` (header/footer compartido)

- [ ] **Step 1: `public/admin/_layout.php`**

```php
<?php
function ds_header(array $u, string $active = ''): void { ?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Ducha Segura</title><link rel="stylesheet" href="styles.css"></head><body>
<div class="topbar">
  <nav>
    <a href="index.php"<?= $active==='list'?' style="color:#0072C0"':'' ?>>Cotizaciones</a>
    <?php if ($u['rol']==='admin'): ?><a href="usuarios.php"<?= $active==='users'?' style="color:#0072C0"':'' ?>>Usuarios</a><?php endif; ?>
  </nav>
  <div><?= ds_e($u['nombre']) ?> · <a href="logout.php">Salir</a></div>
</div>
<div class="wrap">
<?php }
function ds_footer(): void { echo '</div></body></html>'; }
```

- [ ] **Step 2: `public/admin/index.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_login();

$estados = ['nueva','contactada','cotizada','cerrada'];
$estado = in_array($_GET['estado'] ?? '', $estados, true) ? $_GET['estado'] : '';
$q = trim($_GET['q'] ?? '');
$page = max(1, (int)($_GET['p'] ?? 1));
$per = 20; $off = ($page - 1) * $per;

$where = []; $args = [];
if ($estado) { $where[] = 'estado = ?'; $args[] = $estado; }
if ($q) { $where[] = '(nombre LIKE ? OR email LIKE ? OR comuna LIKE ?)'; array_push($args, "%$q%","%$q%","%$q%"); }
$wsql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$cnt = ds_db()->prepare("SELECT COUNT(*) FROM cotizaciones $wsql");
$cnt->execute($args); $total = (int)$cnt->fetchColumn();
$pages = max(1, (int)ceil($total / $per));

$sql = "SELECT id,nombre,email,comuna,region,total_estimado,estado,creado_en FROM cotizaciones $wsql ORDER BY creado_en DESC LIMIT $per OFFSET $off";
$stmt = ds_db()->prepare($sql); $stmt->execute($args); $rows = $stmt->fetchAll();

ds_header($u, 'list');
?>
<form class="filters" method="get">
  <select name="estado" onchange="this.form.submit()">
    <option value="">Todos los estados</option>
    <?php foreach ($estados as $e): ?><option value="<?= $e ?>"<?= $estado===$e?' selected':'' ?>><?= ucfirst($e) ?></option><?php endforeach; ?>
  </select>
  <input type="search" name="q" placeholder="Buscar nombre/email/comuna" value="<?= ds_e($q) ?>">
  <button type="submit">Filtrar</button>
  <a href="export.php?estado=<?= ds_e($estado) ?>&q=<?= urlencode($q) ?>" style="margin-left:auto"><button type="button">Exportar CSV</button></a>
</form>
<p><?= $total ?> cotizaciones</p>
<table class="list">
  <tr><th>#</th><th>Fecha</th><th>Nombre</th><th>Comuna</th><th>Total</th><th>Estado</th><th></th></tr>
  <?php foreach ($rows as $r): ?>
  <tr>
    <td><?= (int)$r['id'] ?></td>
    <td><?= ds_e(substr($r['creado_en'],0,16)) ?></td>
    <td><?= ds_e($r['nombre']) ?><br><small><?= ds_e($r['email']) ?></small></td>
    <td><?= ds_e($r['comuna']) ?>, <?= ds_e($r['region']) ?></td>
    <td>$<?= number_format((int)$r['total_estimado'],0,',','.') ?></td>
    <td><span class="badge b-<?= ds_e($r['estado']) ?>"><?= ds_e($r['estado']) ?></span></td>
    <td><a href="detalle.php?id=<?= (int)$r['id'] ?>">Ver</a></td>
  </tr>
  <?php endforeach; ?>
  <?php if (!$rows): ?><tr><td colspan="7">Sin resultados.</td></tr><?php endif; ?>
</table>
<?php if ($pages > 1): ?>
<p>
  <?php for ($i=1;$i<=$pages;$i++): ?>
    <?php if ($i===$page): ?><b><?= $i ?></b><?php else: ?><a href="?estado=<?= ds_e($estado) ?>&q=<?= urlencode($q) ?>&p=<?= $i ?>"><?= $i ?></a><?php endif; ?>
  <?php endfor; ?>
</p>
<?php endif; ?>
<?php ds_footer();
```

- [ ] **Step 3: Probar (manual)**

Con datos de prueba ya insertados (Task 11), abrir `http://localhost:8080/admin/index.php`.
Expected: lista las cotizaciones; filtro por estado y búsqueda funcionan; paginación si hay >20.

- [ ] **Step 4: Commit**

```bash
git add public/admin/index.php public/admin/_layout.php
git commit -m "feat(admin): listado de cotizaciones con filtros y paginación"
```

---

### Task 16: Panel admin — detalle + cambio de estado

**Files:**
- Create: `public/admin/detalle.php`

- [ ] **Step 1: `public/admin/detalle.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_login();
$id = (int)($_GET['id'] ?? 0);
$estados = ['nueva','contactada','cotizada','cerrada'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $nuevo = $_POST['estado'] ?? '';
  if (in_array($nuevo, $estados, true)) {
    $up = ds_db()->prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?');
    $up->execute([$nuevo, $id]);
  }
  header("Location: detalle.php?id=$id"); exit;
}

$stmt = ds_db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
$stmt->execute([$id]); $c = $stmt->fetch();
if (!$c) { ds_header($u,'list'); echo '<p>No encontrada. <a href="index.php">Volver</a></p>'; ds_footer(); exit; }
$istmt = ds_db()->prepare('SELECT * FROM cotizacion_items WHERE cotizacion_id = ?');
$istmt->execute([$id]); $items = $istmt->fetchAll();
$csrf = ds_csrf_token();

ds_header($u, 'list');
?>
<p><a href="index.php">&larr; Volver</a></p>
<div class="card">
  <h2>Cotización #<?= (int)$c['id'] ?> · <span class="badge b-<?= ds_e($c['estado']) ?>"><?= ds_e($c['estado']) ?></span></h2>
  <dl class="kv">
    <dt>Fecha</dt><dd><?= ds_e($c['creado_en']) ?></dd>
    <dt>Nombre</dt><dd><?= ds_e($c['nombre']) ?></dd>
    <dt>Teléfono</dt><dd><?= ds_e($c['telefono']) ?></dd>
    <dt>Email</dt><dd><?= ds_e($c['email']) ?></dd>
    <dt>Dirección</dt><dd><?= ds_e($c['direccion']) ?><?= $c['depto'] ? ', '.ds_e($c['depto']) : '' ?> · <?= ds_e($c['comuna']) ?>, <?= ds_e($c['region']) ?></dd>
    <?php if ($c['referencia']): ?><dt>Referencia</dt><dd><?= ds_e($c['referencia']) ?></dd><?php endif; ?>
    <?php if ($c['tipo_tina']): ?><dt>Tipo de tina</dt><dd><?= ds_e($c['tipo_tina']) ?></dd><?php endif; ?>
    <?php if ($c['notas']): ?><dt>Notas</dt><dd><?= nl2br(ds_e($c['notas'])) ?></dd><?php endif; ?>
  </dl>
</div>
<div class="card">
  <h2>Productos</h2>
  <table class="list">
    <tr><th>Producto</th><th>Grupo</th><th>Cant</th><th>Precio</th></tr>
    <?php foreach ($items as $it): ?>
    <tr><td><?= ds_e($it['nombre']) ?> <small><?= ds_e($it['variante']) ?></small></td>
        <td><?= ds_e($it['grupo']) ?></td><td><?= (int)$it['cantidad'] ?></td>
        <td>$<?= number_format((int)$it['precio_unitario']*(int)$it['cantidad'],0,',','.') ?></td></tr>
    <?php endforeach; ?>
    <tr><td colspan="3" style="text-align:right;font-weight:bold">Total estimado</td>
        <td style="font-weight:bold">$<?= number_format((int)$c['total_estimado'],0,',','.') ?></td></tr>
  </table>
</div>
<div class="card">
  <h2>Cambiar estado</h2>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>">
    <select name="estado">
      <?php foreach ($estados as $e): ?><option value="<?= $e ?>"<?= $c['estado']===$e?' selected':'' ?>><?= ucfirst($e) ?></option><?php endforeach; ?>
    </select>
    <button type="submit">Guardar</button>
  </form>
</div>
<?php ds_footer();
```

- [ ] **Step 2: Probar (manual)**

Abrir `detalle.php?id=N`; cambiar estado → persiste y el badge se actualiza; los items se muestran.

- [ ] **Step 3: Commit**

```bash
git add public/admin/detalle.php
git commit -m "feat(admin): detalle de cotización + cambio de estado (CSRF)"
```

---

### Task 17: Panel admin — export CSV + gestión de usuarios

**Files:**
- Create: `public/admin/export.php`
- Create: `public/admin/usuarios.php`

- [ ] **Step 1: `public/admin/export.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
$u = ds_require_login();
$estados = ['nueva','contactada','cotizada','cerrada'];
$estado = in_array($_GET['estado'] ?? '', $estados, true) ? $_GET['estado'] : '';
$q = trim($_GET['q'] ?? '');
$where = []; $args = [];
if ($estado) { $where[] = 'estado = ?'; $args[] = $estado; }
if ($q) { $where[] = '(nombre LIKE ? OR email LIKE ? OR comuna LIKE ?)'; array_push($args,"%$q%","%$q%","%$q%"); }
$wsql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
$stmt = ds_db()->prepare("SELECT id,creado_en,nombre,telefono,email,direccion,depto,comuna,region,referencia,tipo_tina,total_estimado,estado FROM cotizaciones $wsql ORDER BY creado_en DESC");
$stmt->execute($args);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="cotizaciones.csv"');
$out = fopen('php://output', 'w');
fprintf($out, "\xEF\xBB\xBF"); // BOM para Excel
fputcsv($out, ['ID','Fecha','Nombre','Teléfono','Email','Dirección','Depto','Comuna','Región','Referencia','Tipo tina','Total','Estado']);
while ($r = $stmt->fetch()) { fputcsv($out, $r); }
fclose($out);
```

- [ ] **Step 2: `public/admin/usuarios.php` (solo admin)**

```php
<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/_layout.php';
$u = ds_require_admin();
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  ds_csrf_check();
  $accion = $_POST['accion'] ?? '';
  if ($accion === 'crear') {
    $email = trim($_POST['email'] ?? ''); $nombre = trim($_POST['nombre'] ?? '');
    $rol = in_array($_POST['rol'] ?? '', ['admin','gestor'], true) ? $_POST['rol'] : 'gestor';
    $pass = $_POST['password'] ?? '';
    if (filter_var($email, FILTER_VALIDATE_EMAIL) && $nombre && strlen($pass) >= 8) {
      $hash = password_hash($pass, PASSWORD_DEFAULT);
      $st = ds_db()->prepare('INSERT INTO admin_users (email,nombre,password_hash,rol) VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password_hash=VALUES(password_hash), rol=VALUES(rol)');
      $st->execute([$email,$nombre,$hash,$rol]); $msg = 'Usuario guardado.';
    } else { $msg = 'Datos inválidos (email válido, nombre, contraseña ≥8).'; }
  } elseif ($accion === 'borrar') {
    $del = (int)($_POST['id'] ?? 0);
    if ($del !== (int)$u['id']) { ds_db()->prepare('DELETE FROM admin_users WHERE id = ?')->execute([$del]); $msg = 'Usuario eliminado.'; }
    else { $msg = 'No puedes eliminar tu propia cuenta.'; }
  }
}
$users = ds_db()->query('SELECT id,email,nombre,rol,creado_en FROM admin_users ORDER BY creado_en')->fetchAll();
$csrf = ds_csrf_token();
ds_header($u, 'users');
?>
<?php if ($msg): ?><p class="err" style="background:#e6f6ec;color:#1e7d40"><?= ds_e($msg) ?></p><?php endif; ?>
<div class="card">
  <h2>Usuarios</h2>
  <table class="list">
    <tr><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr>
    <?php foreach ($users as $usr): ?>
    <tr><td><?= ds_e($usr['nombre']) ?></td><td><?= ds_e($usr['email']) ?></td><td><?= ds_e($usr['rol']) ?></td>
      <td><?php if ((int)$usr['id'] !== (int)$u['id']): ?>
        <form method="post" onsubmit="return confirm('¿Eliminar usuario?')" style="display:inline">
          <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>"><input type="hidden" name="accion" value="borrar"><input type="hidden" name="id" value="<?= (int)$usr['id'] ?>">
          <button type="submit">Eliminar</button>
        </form><?php endif; ?></td></tr>
    <?php endforeach; ?>
  </table>
</div>
<div class="card">
  <h2>Crear / actualizar usuario</h2>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= ds_e($csrf) ?>"><input type="hidden" name="accion" value="crear">
    <p><input type="text" name="nombre" placeholder="Nombre" required></p>
    <p><input type="email" name="email" placeholder="Email" required></p>
    <p><input type="password" name="password" placeholder="Contraseña (≥8)" required></p>
    <p><select name="rol"><option value="gestor">gestor</option><option value="admin">admin</option></select></p>
    <button type="submit">Guardar usuario</button>
  </form>
</div>
<?php ds_footer();
```

- [ ] **Step 3: Probar (manual)**

`export.php` descarga CSV con BOM (abre bien en Excel, acentos correctos).
`usuarios.php` (como admin): crea un gestor, intenta borrarse a sí mismo (bloqueado), borra otro. Como gestor: `usuarios.php` responde 403.

- [ ] **Step 4: Commit**

```bash
git add public/admin/export.php public/admin/usuarios.php
git commit -m "feat(admin): export CSV + gestión de usuarios (solo admin)"
```

---

### Task 18: Documentación y notas de despliegue

**Files:**
- Modify: `docs/ESTADO.md`
- Modify: `README.md`

- [ ] **Step 1: Actualizar `docs/ESTADO.md`**

Agregar una sección nueva "## Proceso de cotización + backend (ajustes-varios-4)" resumiendo: drawer con 2 acciones, `/cotizar` con tipo de tina condicional (6 tipos placeholder), `/gracias-por-contactarnos`, rename Jacuzzi→Hidromasaje (solo visible), y el backend PHP/MySQL en `public/api` + panel `public/admin`. Marcar como pendiente: imágenes reales de tinas, pagos online (Comprar = placeholder), credenciales reales en `config.php`.

- [ ] **Step 2: Sección de despliegue en `README.md`**

Agregar:
```markdown
## Backend de cotizaciones (PHP + MySQL en Hostinger)

El backend vive en `public/api/` y `public/admin/` y se copia a `dist/` con `npm run build`.

### Dev local
1. `npm run dev` (front en http://localhost:4321)
2. `php -S localhost:8080 -t public` (API + admin)
3. Copiar `public/api/config.example.php` → `public/api/config.php` y completar credenciales (MySQL local + SMTP). En dev, `cors_origin = http://localhost:4321`.
4. Importar el esquema: `mysql -u <user> -p <db> < public/api/schema.sql`
5. Crear admin: `php public/admin/crear-admin.php admin@duchasegura.cl "Admin" admin`

### Producción (Hostinger)
1. `npm run build` → subir `dist/` a `public_html` (incluye `api/` y `admin/`).
2. Crear DB MySQL en hPanel; importar `public/api/schema.sql`.
3. Crear `public_html/api/config.php` con credenciales reales (DB + SMTP del buzón del dominio; `cors_origin` = origen del sitio).
4. Ejecutar el seed del primer admin (SSH `php` o insertar fila con hash).
5. Verificar: enviar una cotización de prueba, revisar email y panel `/admin/`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/ESTADO.md README.md
git commit -m "docs: proceso de cotización + backend (uso y despliegue)"
```

---

## Verificación final (toda la rama)

- [ ] `npm test` → verde (lib cart con los nuevos helpers).
- [ ] `npx astro check` → 0 errores.
- [ ] `npm run build` → genera `dist/` con `cotizar`, `gracias-por-contactarnos`, `api/` y `admin/`.
- [ ] `grep -rni "jacuzzi" src` → solo slugs/keys/paths de imagen/blog (ningún texto visible).
- [ ] Flujo manual end-to-end (front 4321 + php 8080): rebaje → pide tina → envía → fila en DB + emails (si SMTP) + redirección a gracias.
- [ ] Panel admin: login, listado, filtros, detalle, cambio de estado, export CSV, usuarios.
