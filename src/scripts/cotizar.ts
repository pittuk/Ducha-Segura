// cotizar.ts — Página de cotización: hidrata resumen del carrito, validación y envío
// al backend. Ya NO pide dirección ni instalación (se coordinan después). Se inicializa
// en cada astro:page-load (solo si existe el form).
import * as Cart from '../lib/cart';
import type { CartItem } from '../lib/cart';
import { clp } from '../lib/format';
import { INSTALLATION_FEE } from '../lib/pricing';
import { getTina } from '../data/tinas';
import { REGIONES } from '../data/regiones';
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

  // ── Ubicación: select de región → al elegir, se llena el de comuna (cascada). ──
  const regionSel = document.getElementById('cotRegion') as HTMLSelectElement | null;
  const comunaSel = document.getElementById('cotComuna') as HTMLSelectElement | null;
  regionSel?.addEventListener('change', () => {
    if (!comunaSel) return;
    const region = REGIONES.find(r => r.nombre === regionSel.value);
    if (!region) {
      comunaSel.innerHTML = '<option value="" disabled selected>Primero elige tu región</option>';
      comunaSel.disabled = true;
      return;
    }
    comunaSel.innerHTML = '<option value="" disabled selected>Selecciona tu comuna</option>'
      + region.comunas.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    comunaSel.disabled = false;
  });

  // ── Envío: dos canales (email / WhatsApp). Ambos guardan el lead en el backend. ──
  const emailBtn = document.getElementById('cotizarSubmit') as HTMLButtonElement | null;
  const waBtn = document.getElementById('cotizarWa') as HTMLButtonElement | null;

  // Valida el formulario (honeypot, campos, tipo de tina). Devuelve el tipoTinaId
  // ('' si no aplica) o null si la validación falla.
  const validate = (): string | null => {
    if (errorEl) errorEl.style.display = 'none';
    if ((form.elements.namedItem('website') as HTMLInputElement)?.value) return null; // honeypot
    if (!form.reportValidity()) return null;
    const tipoTinaId = needsTina ? (form.elements.namedItem('tipoTina') as RadioNodeList | null)?.value || '' : '';
    if (needsTina && !tipoTinaId) { showError(errorEl, 'Selecciona tu tipo de tina.'); return null; }
    return tipoTinaId;
  };

  // Reúne el payload del backend y los datos para el mensaje de WhatsApp.
  const collect = (tipoTinaId: string) => {
    const fd = new FormData(form);
    const nombre = String(fd.get('nombre') || '');
    const telefono = String(fd.get('telefono') || '');
    const notas = String(fd.get('notas') || '');
    const region = String(fd.get('region') || '');
    const comuna = String(fd.get('comuna') || '');
    const instalacion = offerInstal && !!instalChk?.checked;
    const total = subtotal + (instalacion ? INSTALLATION_FEE : 0);
    const tinaName = tipoTinaId ? getTina(tipoTinaId)?.name : '';
    const payload = {
      nombre, telefono, email: fd.get('email'), notas,
      region, comuna,
      tipoTina: needsTina ? tipoTinaId : null,
      instalacion, total,
      items: items.map(i => ({ id: i.id, name: i.name, variant: i.variant, grupo: i.grupo, qty: i.qty, unitPrice: i.unitPrice })),
    };
    return { payload, nombre, telefono, notas, region, comuna, instalacion, total, tinaName };
  };

  // Canal EMAIL: envía, espera respuesta y redirige a gracias con el N°.
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipoTinaId = validate();
    if (tipoTinaId === null) return;
    const { payload } = collect(tipoTinaId);
    setBtnLoading(emailBtn, 'Enviando…');
    try {
      const data = await submitLead(payload, false);
      localStorage.removeItem('ds_cart');
      window.location.href = `/gracias-por-contactarnos?id=${encodeURIComponent(String(data.id))}`;
    } catch (_) {
      showError(errorEl, 'No pudimos enviar tu cotización. Revisa tu conexión e inténtalo de nuevo.');
      resetBtn(emailBtn);
    }
  });

  // Canal WHATSAPP: abre wa.me dentro del gesto del click (evita el bloqueo de popup),
  // guarda el lead en segundo plano (keepalive) y redirige a gracias.
  waBtn?.addEventListener('click', () => {
    const tipoTinaId = validate();
    if (tipoTinaId === null) return;
    const c = collect(tipoTinaId);
    const waUrl = buildWhatsappUrl(items, c.total, c.instalacion, c.nombre, c.telefono, c.tinaName, c.notas, c.region, c.comuna);
    const win = window.open(waUrl, '_blank', 'noopener');
    // Fallback: si el navegador bloqueó el popup, la página de gracias mostrará el botón.
    if (!win) { try { sessionStorage.setItem('ds_wa_quote', waUrl); } catch (_) { /* */ } }
    submitLead(c.payload, true).catch(() => { /* fire-and-forget: el lead viaja con keepalive */ });
    localStorage.removeItem('ds_cart');
    window.location.href = '/gracias-por-contactarnos';
  });
}

// POST al backend. keepalive=true permite que la petición sobreviva a la navegación.
async function submitLead(payload: unknown, keepalive: boolean): Promise<{ id: number | string }> {
  const res = await fetch(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), keepalive,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Error al enviar');
  return data;
}

// Estado de carga del botón sin perder su ícono (guarda/restaura el texto del <span>).
function setBtnLoading(btn: HTMLButtonElement | null, txt: string): void {
  if (!btn) return;
  btn.disabled = true;
  const span = btn.querySelector('span');
  if (span) { btn.dataset.label = span.textContent || ''; span.textContent = txt; }
}
function resetBtn(btn: HTMLButtonElement | null): void {
  if (!btn) return;
  btn.disabled = false;
  const span = btn.querySelector('span');
  if (span && btn.dataset.label) span.textContent = btn.dataset.label;
}

// Arma la URL wa.me con el resumen de la cotización (sin N°: el backend aún no respondió).
function buildWhatsappUrl(
  items: CartItem[], total: number, instalacion: boolean,
  nombre: string, telefono: string, tinaName: string | undefined, notas: string,
  region: string, comuna: string,
): string {
  const lineas = items
    .map(i => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.qty} — $${clp(i.unitPrice * i.qty)}`)
    .join('\n');
  const ubicacion = [comuna, region].filter(Boolean).join(', ');
  const msg = `Hola Ducha Segura® 👋 Quiero enviar mi cotización.\n\n${lineas}\n`
    + (instalacion ? `Instalación: Sí (+$${clp(INSTALLATION_FEE)})\n` : '')
    + `Total estimado: $${clp(total)}\n`
    + (tinaName ? `Tipo de tina: ${tinaName}\n` : '')
    + (ubicacion ? `Ubicación: ${ubicacion}\n` : '')
    + (notas ? `Notas: ${notas}\n` : '')
    + `\nMis datos: ${nombre} · ${telefono}`;
  return `${SITE.whatsappUrl}?text=${encodeURIComponent(msg)}`;
}

function showError(el: HTMLElement | null, msg: string): void {
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
