// quickview.ts — Modal de vista rápida. Lee data-qv-* de la tarjeta y rellena el modal.
// El "Agregar" del modal usa data-add-producto → lo maneja la delegación del carrito (cart.ts).
import { clp } from '../lib/format';

let _docBound = false;

function openQV(el: HTMLElement): void {
  const qv = document.getElementById('qv');
  if (!qv) return;
  const d = el.dataset;
  const price = Number(d.qvPrice || '0');

  const img = document.getElementById('qvImg') as HTMLImageElement | null;
  if (img) { img.src = d.qvImg || ''; img.alt = d.qvName || ''; }
  const media = document.getElementById('qvMedia');
  const coversFull = d.qvGrupo === 'rebaje' || d.qvGrupo === 'kit';
  if (media) media.className = 'qv__media' + (coversFull ? '' : ' qv__media--contain');
  const name = document.getElementById('qvName');
  if (name) name.textContent = d.qvName || '';
  const priceEl = document.getElementById('qvPrice');
  if (priceEl) priceEl.textContent = price > 0 ? '$' + clp(price) : (d.qvPricelabel || 'Consultar');
  const desc = document.getElementById('qvDesc');
  if (desc) { desc.textContent = d.qvDesc || ''; (desc as HTMLElement).style.display = d.qvDesc ? '' : 'none'; }
  const GRUPO: Record<string, string> = { rebaje: 'Rebaje de tina', kit: 'Kit', accesorio: 'Accesorio' };
  const cat = document.getElementById('qvCat');
  if (cat) cat.textContent = GRUPO[d.qvGrupo || ''] || '';
  const extract = document.getElementById('qvExtract');
  if (extract) { extract.textContent = d.qvExtract || ''; (extract as HTMLElement).style.display = d.qvExtract ? '' : 'none'; }
  const ficha = document.getElementById('qvFicha') as HTMLAnchorElement | null;
  if (ficha) ficha.href = `/producto/${d.qvSlug}/`;
  const add = document.getElementById('qvAdd');
  if (add) {
    if (price > 0) { (add as HTMLElement).style.display = ''; add.setAttribute('data-add-producto', d.qvSlug || ''); }
    else { (add as HTMLElement).style.display = 'none'; }
  }

  qv.classList.add('open');
  document.getElementById('qvBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQV(): void {
  document.getElementById('qv')?.classList.remove('open');
  document.getElementById('qvBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

export function initQuickView(): void {
  // Nodos por página (Astro reemplaza el DOM en cada navegación)
  document.getElementById('qvClose')?.addEventListener('click', closeQV);
  document.getElementById('qvBackdrop')?.addEventListener('click', closeQV);

  if (_docBound) return;
  _docBound = true;

  document.addEventListener('click', (e) => {
    const t = e.target as Element;
    const trigger = t.closest<HTMLElement>('[data-quickview]');
    if (trigger) { e.preventDefault(); openQV(trigger); return; }
    if (t.closest('#qvAdd')) { closeQV(); }   // el carrito procesa el data-add-producto
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQV(); });
}
