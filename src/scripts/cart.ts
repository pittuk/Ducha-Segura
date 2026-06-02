// cart.ts — Cross-page cart store (DOM glue). Pure math lives in lib/cart.
// Module-level state persists across Astro View Transitions (Astro replaces <body>
// on each swap, so per-page nodes must be queried fresh each initCart() call,
// but module variables survive the whole session).

import * as Cart from '../lib/cart';
import type { CartItem, NewItem } from '../lib/cart';
import { clp } from '../lib/format';
import { escapeHtml } from './dom';
import { PRODUCTOS, ACCESORIOS, type Grupo } from '../data/productos';

const ID_PREFIX: Record<Grupo, string> = { rebaje: 'reb', kit: 'kit', accesorio: 'acc' };

// --- Module-level state ---
let items: CartItem[] = load();

// Once-per-session guards for document/window listeners
let _clickBound = false;
let _escapeBound = false;
let _buyBound = false;

// Toast timer (module-level so it survives page swaps)
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

// --- Persistence ---
function load(): CartItem[] {
  try {
    const raw: CartItem[] = JSON.parse(localStorage.getItem('ds_cart') || '[]');
    return raw.map(i => i.grupo ? i : { ...i, grupo: Cart.deriveGrupo(i.id) });
  } catch (_) { return []; }
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
  document.getElementById('cartTrigger')?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(): void {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  drawer?.classList.remove('open');
  backdrop?.classList.remove('open');
  document.getElementById('cartTrigger')?.setAttribute('aria-expanded', 'false');
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
      <div class="cart-item__media">${i.image
        ? `<img class="cart-item__img" src="${escapeHtml(i.image)}" alt="${escapeHtml(i.name)}" loading="lazy">`
        : `<div class="cart-item__media-l">${escapeHtml(i.label)}</div>`}</div>
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

  // "Complementa tu rebaje": accesorios aún no agregados (cuando ya hay un rebaje en la cotización).
  const inCart = new Set(items.map(i => i.id));
  const hasRebaje = items.some(i => /^(reb|cfg|calc)-/.test(i.id));
  const suggestions = ACCESORIOS.filter(a => !inCart.has('acc-' + a.slug));
  const suggestHtml = (hasRebaje && suggestions.length) ? `
    <div class="cart-suggest">
      <div class="cart-suggest__h">Complementa tu rebaje</div>
      <div class="cart-suggest__row">
        ${suggestions.map(a => `
          <article class="cart-suggest__card">
            <div class="cart-suggest__media">${a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.name)}" loading="lazy">` : ''}</div>
            <div class="cart-suggest__name">${escapeHtml(a.name)}</div>
            <div class="cart-suggest__price">$${clp(a.price)}</div>
            <button class="cart-suggest__add" data-add-producto="${escapeHtml(a.slug)}" aria-label="Agregar ${escapeHtml(a.name)} a la cotización">+ Agregar</button>
          </article>`).join('')}
      </div>
    </div>` : '';

  drawerBody.innerHTML = itemsHtml + suggestHtml;

  const sub = Cart.subtotal(items);
  if (drawerSubtotal) drawerSubtotal.textContent = '$' + clp(sub);
  if (drawerTotal) drawerTotal.textContent = clp(sub);
  if (drawerFoot) drawerFoot.style.display = '';

  const buyBtn = document.getElementById('goComprar') as HTMLButtonElement | null;
  const buyNote = document.getElementById('buyNote');
  const buyBlocked = document.getElementById('buyBlocked');
  if (buyBtn) {
    const canBuy = Cart.canBuy(items);
    buyBtn.setAttribute('aria-disabled', String(!canBuy));
    if (buyNote) buyNote.style.display = canBuy ? '' : 'none';
    if (buyBlocked) buyBlocked.style.display = (!canBuy && Cart.hasRebaje(items)) ? '' : 'none';
  }
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

    // [data-add-producto] — productos del catálogo (rebaje/kit/accesorio) por slug
    const addP = target.closest<HTMLElement>('[data-add-producto]');
    if (addP) {
      const p = PRODUCTOS.find(x => x.slug === addP.dataset.addProducto);
      if (p && p.price > 0) {
        add({ id: `${ID_PREFIX[p.grupo]}-${p.slug}`, name: p.name, variant: p.shortDescription, unitPrice: p.price, label: p.name, image: p.image, grupo: p.grupo });
      }
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

// --- Botón "Comprar": placeholder de pagos (once per session) ---
function bindBuyButton(): void {
  if (_buyBound) return;
  _buyBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (!target.closest('#goComprar')) return;
    e.preventDefault();
    if (!Cart.canBuy(items)) {
      showToast('La compra online no está disponible junto a un rebaje. Continúa con la cotización.');
      return;
    }
    showToast('Pago online próximamente. Mientras tanto, continúa con la cotización.');
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
  bindBuyButton();

  // Always refresh badge + drawer state from localStorage on the new DOM
  renderCart();
}

// --- dsCart is exposed on window inside initCart() (see above) ---
declare global {
  interface Window {
    dsCart: { add: (item: NewItem) => void };
  }
}
