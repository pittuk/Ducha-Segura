// cotizar.ts — Página de cotización: hidrata resumen del carrito, validación y envío
// al backend. Ya NO pide dirección ni instalación (se coordinan después). Se inicializa
// en cada astro:page-load (solo si existe el form).
import * as Cart from '../lib/cart';
import type { CartItem } from '../lib/cart';
import { clp } from '../lib/format';
import { INSTALLATION_FEE } from '../lib/pricing';
import { getTina } from '../data/tinas';
import { SITE } from '../data/site';
import { escapeHtml } from './dom';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api/cotizacion.php'
  : '/api/cotizacion.php';

// Evita re-cablear listeners si initCotizar corre dos veces sobre el mismo nodo.
let _formNode: HTMLFormElement | null = null;

function load(): CartItem[] {
  try {
    const raw: CartItem[] = JSON.parse(localStorage.getItem('ds_cart') || '[]');
    return raw.map(i => i.grupo ? i : { ...i, grupo: Cart.deriveGrupo(i.id) });
  } catch (_) { return []; }
}

export function initCotizar(): void {
  const form = document.getElementById('cotizarForm') as HTMLFormElement | null;
  if (!form || form === _formNode) return; // no estamos en /cotizar, o ya cableado este nodo
  _formNode = form;

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

  // Resumen (sin descripción del producto: solo nombre, cantidad y precio)
  if (itemsEl) {
    itemsEl.innerHTML = items.map(i => `
      <div class="cot-item">
        <div class="cot-item__media">${i.image ? `<img src="${escapeHtml(i.image)}" alt="${escapeHtml(i.name)}">` : ''}</div>
        <div class="cot-item__body">
          <div class="cot-item__name">${escapeHtml(i.name)}</div>
          <div class="cot-item__line"><span>Cant: ${i.qty}</span><span class="cot-item__price">$${clp(i.unitPrice * i.qty)}</span></div>
        </div>
      </div>`).join('');
  }

  const subtotal = Cart.subtotal(items);
  const needsTina = Cart.hasRebaje(items);

  // Nota de envío/instalación: con rebaje van incluidos; con kits/accesorios el envío no.
  const noteEnvio = document.getElementById('cotizarNoteEnvio');
  if (noteEnvio) noteEnvio.textContent = needsTina ? 'Envío e instalación incluidos.' : 'El envío no está incluido.';

  // Tipo de tina solo si hay rebaje
  if (tinaBlock) tinaBlock.style.display = needsTina ? '' : 'none';

  // Instalación: SOLO para kits/accesorios. Si hay un rebaje en el carrito, no aplica.
  const instalBlock = document.getElementById('instalBlock');
  const instalChk = document.getElementById('instalacionChk') as HTMLInputElement | null;
  const instalLine = document.getElementById('cotInstalLine');
  const instalAmount = document.getElementById('cotInstalAmount');
  const offerInstal = !needsTina; // sin rebaje => kits/accesorios
  if (instalBlock) instalBlock.style.display = offerInstal ? '' : 'none';
  if (!offerInstal && instalChk) instalChk.checked = false;

  const recomputeTotal = () => {
    const withInstal = offerInstal && !!instalChk?.checked;
    if (instalLine) instalLine.style.display = withInstal ? '' : 'none';
    if (instalAmount) instalAmount.textContent = clp(INSTALLATION_FEE);
    if (totalEl) totalEl.textContent = clp(subtotal + (withInstal ? INSTALLATION_FEE : 0));
  };
  instalChk?.addEventListener('change', recomputeTotal);
  recomputeTotal();

  // Envío
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    // honeypot
    if ((form.elements.namedItem('website') as HTMLInputElement)?.value) return;

    if (!form.reportValidity()) return;
    const tipoTinaId = needsTina ? (form.elements.namedItem('tipoTina') as RadioNodeList | null)?.value || '' : '';
    if (needsTina && !tipoTinaId) {
      showError(errorEl, 'Selecciona tu tipo de tina.');
      return;
    }

    const fd = new FormData(form);
    const nombre = String(fd.get('nombre') || '');
    const telefono = String(fd.get('telefono') || '');
    const notas = String(fd.get('notas') || '');
    const instalacion = offerInstal && !!instalChk?.checked;
    const total = subtotal + (instalacion ? INSTALLATION_FEE : 0);
    const payload = {
      nombre, telefono, email: fd.get('email'),
      notas,
      tipoTina: needsTina ? tipoTinaId : null,
      instalacion,
      total,
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
      // Prepara un enlace de WhatsApp con la cotización para agilizar el contacto
      // (lo usa la página de gracias). Se construye ANTES de limpiar el carrito.
      const tinaName = tipoTinaId ? getTina(tipoTinaId)?.name : '';
      saveWhatsappQuote(data.id, items, total, instalacion, nombre, telefono, tinaName, notas);
      localStorage.removeItem('ds_cart');
      window.location.href = `/gracias-por-contactarnos?id=${encodeURIComponent(data.id)}`;
    } catch (err) {
      showError(errorEl, 'No pudimos enviar tu cotización. Revisa tu conexión e inténtalo de nuevo.');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar cotización'; }
    }
  });
}

// Arma el enlace wa.me con el resumen de la cotización y lo guarda en sessionStorage
// para que la página de gracias muestre el botón "Enviar por WhatsApp".
function saveWhatsappQuote(
  id: number | string, items: CartItem[], total: number, instalacion: boolean,
  nombre: string, telefono: string, tinaName: string | undefined, notas: string,
): void {
  const lineas = items
    .map(i => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.qty} — $${clp(i.unitPrice * i.qty)}`)
    .join('\n');
  const msg = `Hola Ducha Segura 👋 Envié la cotización N° ${id}.\n\n${lineas}\n`
    + (instalacion ? `Instalación: Sí (+$${clp(INSTALLATION_FEE)})\n` : '')
    + `Total estimado: $${clp(total)}\n`
    + (tinaName ? `Tipo de tina: ${tinaName}\n` : '')
    + (notas ? `Notas: ${notas}\n` : '')
    + `\nMis datos: ${nombre} · ${telefono}`;
  try {
    sessionStorage.setItem('ds_wa_quote', `${SITE.whatsappUrl}?text=${encodeURIComponent(msg)}`);
  } catch (_) { /* sessionStorage no disponible: el flujo por email sigue funcionando */ }
}

function showError(el: HTMLElement | null, msg: string): void {
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
