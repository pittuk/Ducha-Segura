// configurator.ts — Visual configurator logic, ported from legacy/index.html (lines 1564–1637).
// Idempotent: guarded on #cfgPreview dataset.bound.
import { $, $$ } from './dom';
import { clp } from '../lib/format';
import { basePrice, type Tipo, type Ancho } from '../lib/pricing';

export function initConfigurator(): void {
  const root = $<HTMLElement>('#cfgPreview');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = '1';

  const state: { tipo: Tipo; ancho: Ancho; color: string; colorHex: string; bano: number } = {
    tipo: 'tradicional',
    ancho: 40,
    color: 'blanco',
    colorHex: '#f5f5f4',
    bano: 0,
  };

  const banos = [
    { label: '[BAÑO ESTÁNDAR · TINA BLANCA]', bg: 'linear-gradient(180deg,#d6d3cf 0%,#b5b3b0 100%)' },
    { label: '[BAÑO REFORMADO · CERÁMICA BEIGE]', bg: 'linear-gradient(180deg,#d8cdb8 0%,#b3a48d 100%)' },
    { label: '[BAÑO MODERNO · GRIS Y MADERA]', bg: 'linear-gradient(180deg,#c7cdd1 0%,#5e6c75 100%)' },
  ];

  const cutRect = $<SVGRectElement>('#cfgCutRect');
  const cutDash = $<SVGLineElement>('#cfgCutDash');
  const dimLine = $<SVGLineElement>('#cfgDimLine');
  const dimL = $<SVGLineElement>('#cfgDimL');
  const dimR = $<SVGLineElement>('#cfgDimR');
  const dimT = $<SVGTextElement>('#cfgDimT');
  const cutGlow = $<SVGRectElement>('#cfgCutGlow');
  const jets = $<SVGGElement>('#cfgJets');
  const preview = $<HTMLElement>('#cfgPreview');
  const previewLabel = $<HTMLElement>('#cfgPreviewLabel');

  const render = () => {
    const cutW = state.ancho === 30 ? 70 : state.ancho === 40 ? 95 : 120;
    const cutX = 250 - cutW / 2;

    cutRect?.setAttribute('x', String(cutX));
    cutRect?.setAttribute('width', String(cutW));
    cutRect?.setAttribute('fill', state.colorHex);

    cutDash?.setAttribute('x1', String(cutX));
    cutDash?.setAttribute('x2', String(cutX + cutW));

    dimLine?.setAttribute('x1', String(cutX));
    dimLine?.setAttribute('x2', String(cutX + cutW));

    dimL?.setAttribute('x1', String(cutX));
    dimL?.setAttribute('x2', String(cutX));

    dimR?.setAttribute('x1', String(cutX + cutW));
    dimR?.setAttribute('x2', String(cutX + cutW));

    if (dimT) dimT.textContent = state.ancho + ' cm';

    cutGlow?.setAttribute('x', String(cutX - 2));
    cutGlow?.setAttribute('width', String(cutW + 4));

    jets?.setAttribute('opacity', state.tipo === 'jacuzzi' ? '0.7' : '0');

    if (preview) preview.style.background = banos[state.bano].bg;
    if (previewLabel) previewLabel.textContent = banos[state.bano].label;

    const colorName =
      $$<HTMLElement>('.cfg-color').find(c => c.dataset.value === state.color)
        ?.querySelector('.cfg-color__name')?.textContent || '';

    const cfgSummary = $<HTMLElement>('#cfgSummary');
    if (cfgSummary) {
      cfgSummary.innerHTML = `Rebaje <strong>${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}</strong> · ${state.ancho} cm · color <strong>${colorName}</strong>`;
    }

    const price = basePrice(state.tipo as Tipo, state.ancho as Ancho);
    const cfgPrice = $<HTMLElement>('#cfgPrice');
    if (cfgPrice) cfgPrice.textContent = clp(price);
  };

  // Tipo buttons
  $$<HTMLButtonElement>('[data-cfg="tipo"] .cfg-opt').forEach(b =>
    b.addEventListener('click', () => {
      $$<HTMLButtonElement>('[data-cfg="tipo"] .cfg-opt').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.tipo = b.dataset.value as Tipo;
      render();
    })
  );

  // Ancho buttons
  $$<HTMLButtonElement>('[data-cfg="ancho"] .cfg-opt').forEach(b =>
    b.addEventListener('click', () => {
      $$<HTMLButtonElement>('[data-cfg="ancho"] .cfg-opt').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.ancho = parseInt(b.dataset.value!, 10) as Ancho;
      render();
    })
  );

  // Color buttons
  $$<HTMLButtonElement>('[data-cfg="color"] .cfg-color').forEach(b =>
    b.addEventListener('click', () => {
      $$<HTMLButtonElement>('[data-cfg="color"] .cfg-color').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.color = b.dataset.value!;
      state.colorHex = b.dataset.hex!;
      render();
    })
  );

  // Swap background
  const cfgSwap = $<HTMLButtonElement>('#cfgSwap');
  cfgSwap?.addEventListener('click', () => {
    state.bano = (state.bano + 1) % banos.length;
    render();
  });

  // Add to cart
  const cfgAdd = $<HTMLButtonElement>('#cfgAdd');
  cfgAdd?.addEventListener('click', () => {
    const colorName =
      $$<HTMLElement>('.cfg-color').find(c => c.dataset.value === state.color)
        ?.querySelector('.cfg-color__name')?.textContent || state.color;

    window.dsCart.add({
      id: `cfg-${state.tipo}-${state.ancho}-${state.color}`,
      name: `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}`,
      variant: `${state.ancho} cm · color ${colorName}`,
      unitPrice: basePrice(state.tipo as Tipo, state.ancho as Ancho),
      label: `${state.tipo.toUpperCase()} ${state.ancho}`,
    });
  });

  // Initial render
  render();
}
