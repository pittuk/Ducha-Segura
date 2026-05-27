// cart.ts — Cross-page cart store (DOM glue). Pure math lives in lib/cart.
// Module-level state persists across Astro View Transitions (Astro replaces <body>
// on each swap, so per-page nodes must be queried fresh each initCart() call,
// but module variables survive the whole session).

import * as Cart from '../lib/cart';
import type { CartItem, NewItem } from '../lib/cart';
import { clp } from '../lib/format';
import { escapeHtml } from './dom';
import { PRODUCTS } from '../data/products';
import { ACCESORIOS } from '../data/accesorios';
import { SITE } from '../data/site';

// --- Module-level state ---
let items: CartItem[] = load();

// Once-per-session guards for document/window listeners
let _clickBound = false;
let _escapeBound = false;
let _quoteBound = false;

// Toast timer (module-level so it survives page swaps)
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

// --- Persistence ---
function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem('ds_cart') || '[]'); } catch (_) { return []; }
}

function save(): void {
  try { localStorage.setItem('ds_cart', JSON.stringify(items)); } catch (_) {}
}

// --- Public: add item ---
export function add(item: NewItem): void {
  items = Cart.addItem(items, item);
  save();
  renderCart();
  showToast(`${item.name} agregado a tu cotización`);
  openDrawer();
}

// --- Drawer open/close (query live nodes each call) ---
function openDrawer(): void {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  drawer?.classList.add('open');
  backdrop?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(): void {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  drawer?.classList.remove('open');
  backdrop?.classList.remove('open');
  document.body.style.overflow = '';
}

// --- Render cart (queries live nodes) ---
function renderCart(): void {
  const cartBadge = document.getElementById('cartBadge');
  const drawerCount = document.getElementById('drawerCount');
  const drawerBody = document.getElementById('drawerBody');
  const drawerFoot = document.getElementById('drawerFoot');
  const drawerEmpty = document.getElementById('drawerEmpty');
  const drawerSubtotal = document.getElementById('drawerSubtotal');
  const drawerTotal = document.getElementById('drawerTotal');

  const total = Cart.count(items);
  if (cartBadge) {
    cartBadge.textContent = String(total);
    (cartBadge as HTMLElement).style.display = total > 0 ? '' : 'none';
  }
  if (drawerCount) drawerCount.textContent = String(items.length);

  if (!drawerBody) return; // drawer not yet in DOM

  if (items.length === 0) {
    drawerBody.innerHTML = '';
    if (drawerEmpty) {
      drawerEmpty.style.display = '';
      drawerBody.appendChild(drawerEmpty);
    }
    if (drawerFoot) drawerFoot.style.display = 'none';
    return;
  }

  if (drawerEmpty) drawerEmpty.style.display = 'none';

  const itemsHtml = items.map(i => `
    <div class="cart-item" data-id="${escapeHtml(i.id)}">
      <div class="cart-item__media"><div class="cart-item__media-l">[${escapeHtml(i.label)}]</div></div>
      <div class="cart-item__body">
        <div class="cart-item__name">${escapeHtml(i.name)}</div>
        <div class="cart-item__variant">${escapeHtml(i.variant)}</div>
        <div class="cart-item__foot">
          <div class="qty">
            <button data-qty="-1" data-id="${escapeHtml(i.id)}" aria-label="Restar">−</button>
            <span>${i.qty}</span>
            <button data-qty="1" data-id="${escapeHtml(i.id)}" aria-label="Sumar">+</button>
          </div>
          <div style="display:flex;align-items:center">
            <span class="cart-item__price">$${clp(i.unitPrice * i.qty)}</span>
            <button class="cart-item__remove" data-remove="${escapeHtml(i.id)}" aria-label="Eliminar">
              <svg class="ic"><use href="#i-trash"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const upsell = !Cart.hasItem(items, 'acc-barra60') ? `
    <div class="upsell">
      <div>
        <div class="upsell__t">Suma una barra de apoyo</div>
        <div class="upsell__s">por solo $34.990</div>
      </div>
      <button data-upsell>+ Agregar</button>
    </div>` : '';

  drawerBody.innerHTML = itemsHtml + upsell;

  const sub = Cart.subtotal(items);
  if (drawerSubtotal) drawerSubtotal.textContent = '$' + clp(sub);
  if (drawerTotal) drawerTotal.textContent = clp(sub);
  if (drawerFoot) drawerFoot.style.display = '';
}

// --- Toast (queries live nodes) ---
function showToast(msg: string): void {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// --- Event delegation (once per session) ---
function bindDocumentClick(): void {
  if (_clickBound) return;
  _clickBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as Element;

    // [data-add-product]
    const addP = target.closest<HTMLElement>('[data-add-product]');
    if (addP) {
      const p = PRODUCTS.find(x => x.id === addP.dataset.addProduct);
      if (p) add({ id: 'prod-' + p.id, name: p.name, variant: 'Configurar variante en cotización', unitPrice: p.priceFrom, label: p.label });
      return;
    }

    // [data-add-acc]
    const addA = target.closest<HTMLElement>('[data-add-acc]');
    if (addA) {
      const a = ACCESORIOS.find(x => x.id === addA.dataset.addAcc);
      if (a) add({ id: 'acc-' + a.id, name: a.name, variant: a.sub, unitPrice: a.price, label: a.label });
      return;
    }

    // [data-qty]
    const qtyBtn = target.closest<HTMLElement>('[data-qty]');
    if (qtyBtn) {
      const id = qtyBtn.dataset.id!;
      const delta = parseInt(qtyBtn.dataset.qty!, 10);
      items = Cart.changeQty(items, id, delta);
      save();
      renderCart();
      return;
    }

    // [data-remove]
    const rmBtn = target.closest<HTMLElement>('[data-remove]');
    if (rmBtn) {
      items = Cart.removeItem(items, rmBtn.dataset.remove!);
      save();
      renderCart();
      return;
    }

    // [data-upsell]
    if (target.closest('[data-upsell]')) {
      const a = ACCESORIOS[0];
      add({ id: 'acc-' + a.id, name: a.name, variant: a.sub, unitPrice: a.price, label: a.label });
    }
  });
}

// --- Escape key (once per session, queries live nodes) ---
function bindEscape(): void {
  if (_escapeBound) return;
  _escapeBound = true;

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeDrawer();
  });
}

// --- Quote form → WhatsApp (once per session, queries live node at call time) ---
function bindQuoteForm(): void {
  if (_quoteBound) return;
  _quoteBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (!target.closest('#sendQuote')) return;
    e.preventDefault();
    const form = document.getElementById('quoteForm') as HTMLFormElement | null;
    if (!form) return;
    if (!form.reportValidity()) return;
    if (items.length === 0) { showToast('Tu cotización está vacía'); return; }

    const data = new FormData(form);
    const nombre = data.get('nombre');
    const telefono = data.get('telefono');
    const email = data.get('email');
    const mensaje = data.get('mensaje');

    const lines = [
      `*Solicitud de cotización — Ducha Segura*`,
      ``,
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Email: ${email}`,
      mensaje ? `Datos del baño: ${mensaje}` : '',
      ``,
      `*Productos solicitados:*`,
      ...items.map(i => `• ${i.name} — ${i.variant} — Cant: ${i.qty} — $${clp(i.unitPrice * i.qty)}`),
      ``,
      `Total estimado: $${clp(Cart.subtotal(items))}`,
      ``,
      `(Precios referenciales. Sujetos a confirmación final.)`,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener');
    showToast('Abriendo WhatsApp para enviar tu cotización');
  });
}

// --- initCart: called each page-load (binds fresh per-page nodes + ensures session listeners) ---
export function initCart(): void {
  // Expose the cart API for other scripts (configurador/calculadora) — idempotent.
  window.dsCart = { add };

  // Re-read from localStorage in case another tab changed it
  items = load();

  // Bind per-page nodes (fresh DOM each Astro transition)
  const cartTrigger = document.getElementById('cartTrigger');
  const drawerClose = document.getElementById('drawerClose');
  const drawerBackdrop = document.getElementById('drawerBackdrop');

  cartTrigger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  // Ensure session-level listeners are registered exactly once
  bindDocumentClick();
  bindEscape();
  bindQuoteForm();

  // Always refresh badge + drawer state from localStorage on the new DOM
  renderCart();
}

// --- dsCart is exposed on window inside initCart() (see above) ---
declare global {
  interface Window {
    dsCart: { add: (item: NewItem) => void };
  }
}
