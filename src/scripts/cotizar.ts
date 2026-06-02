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
