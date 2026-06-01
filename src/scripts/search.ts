// search.ts — Buscador del navbar. Filtra el catálogo (nombre + descripción)
// y enlaza a la ficha /producto/<slug>/. Idempotente (guard de módulo) y
// resistente a View Transitions (listeners de teclado a nivel document una sola vez).
import { $, $$ } from './dom';
import { PRODUCTOS, type Producto } from '../data/productos';
import { clp } from '../lib/format';

let _searchKeyBound = false;

// Índice de búsqueda normalizado (sin tildes, minúsculas) — se arma una vez.
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const INDEX = PRODUCTOS.map((p) => ({
  p,
  hay: norm(`${p.name} ${p.shortDescription} ${p.grupo}`),
}));

const GRUPO_LABEL: Record<Producto['grupo'], string> = {
  rebaje: 'Rebaje',
  kit: 'Kit',
  accesorio: 'Accesorio',
};

function priceLabel(p: Producto): string {
  if (p.priceLabel) return p.priceLabel;
  if (p.price > 0) return `$${clp(p.price)}`;
  return 'A consultar';
}

function search(q: string): Producto[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return INDEX
    .filter((e) => terms.every((t) => e.hay.includes(t)))
    .slice(0, 8)
    .map((e) => e.p);
}

function render(results: Producto[], q: string): string {
  if (!q.trim()) return '';
  if (!results.length) {
    return `<div class="search-empty">Sin resultados para <b>${q.replace(/</g, '&lt;')}</b>. Probá con "rebaje", "kit" o "barra".</div>`;
  }
  return results
    .map(
      (p) => `
      <a class="search-result" href="/producto/${p.slug}/" role="option">
        <img class="search-result__img" src="${p.image}" alt="" loading="lazy" width="52" height="52" />
        <span class="search-result__body">
          <span class="search-result__name">${p.name}</span>
          <span class="search-result__desc">${GRUPO_LABEL[p.grupo]} · ${p.shortDescription}</span>
        </span>
        <span class="search-result__price">${priceLabel(p)}</span>
      </a>`
    )
    .join('');
}

export function initSearch(): void {
  const trigger = $<HTMLElement>('#searchTrigger');
  const overlay = $<HTMLElement>('#searchOverlay');
  if (!trigger || !overlay || trigger.dataset.bound) return;
  trigger.dataset.bound = '1';

  const input = $<HTMLInputElement>('#searchInput');
  const results = $<HTMLElement>('#searchResults');
  const closeBtn = $<HTMLElement>('#searchClose');

  const open = () => {
    overlay.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 60);
  };
  const close = () => {
    overlay.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  trigger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  input?.addEventListener('input', () => {
    const q = input.value;
    if (results) results.innerHTML = render(search(q), q);
  });

  // Cerrar links cierran el overlay (por si la nav es interna sin recarga)
  results?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.search-result')) close();
  });

  // Escape global — una sola vez por sesión (Astro reemplaza <body> en cada swap).
  if (!_searchKeyBound) {
    _searchKeyBound = true;
    document.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key !== 'Escape') return;
      const ov = document.getElementById('searchOverlay');
      if (ov?.classList.contains('open')) {
        ov.classList.remove('open');
        document.getElementById('searchTrigger')?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
}
