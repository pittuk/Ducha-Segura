import { $, $$ } from './dom';
import { clp } from '../lib/format';
import {
  basePrice, discountAmount, finalPrice, installment,
  BANCO_LABELS,
  type Tipo, type Ancho, type Banco,
} from '../lib/pricing';
import { COMUNAS, type Region } from '../data/comunas';
import { PRODUCT_MEDIA } from '../data/products-media';

export function initCalculator(): void {
  const select = $('#calcComuna') as HTMLSelectElement | null;
  if (!select || (select as HTMLElement).dataset.bound) return;
  (select as HTMLElement).dataset.bound = '1';

  const state: { tipo: Tipo; ancho: Ancho; region: Region; comuna: string; banco: Banco; cuotas: number } = {
    tipo: 'tradicional',
    ancho: 40,
    region: 'RM',
    comuna: 'Las Condes',
    banco: 'santander',
    cuotas: 12,
  };

  const fillComunas = (): void => {
    select.innerHTML = COMUNAS[state.region]
      .map(c => `<option value="${c}">${c}</option>`)
      .join('');
    state.comuna = COMUNAS[state.region][0];
    select.value = state.comuna;
  };
  fillComunas();

  let displayed = 0;

  const animate = (from: number, to: number): void => {
    const start = performance.now();
    const dur = 380;
    const tick = (t: number): void => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (to - from) * eased);
      const totalEl = $('#calcTotal');
      if (totalEl) totalEl.textContent = clp(v);
      if (k < 1) {
        requestAnimationFrame(tick);
      } else {
        displayed = to;
      }
    };
    requestAnimationFrame(tick);
  };

  const render = (): void => {
    const base = basePrice(state.tipo, state.ancho);
    const discAmt = discountAmount(base, state.banco);
    const final = finalPrice(base, state.banco);
    const cuotaVal = installment(final, state.cuotas);

    const cfgEl = $('#calcCfg');
    if (cfgEl) cfgEl.textContent = `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'} · ${state.ancho} cm`;

    const locEl = $('#calcLoc');
    if (locEl) locEl.textContent = `${state.comuna}, ${state.region}`;

    const strikeEl = $('#calcStrike') as HTMLElement | null;
    if (strikeEl) {
      strikeEl.textContent = '$' + clp(base);
      strikeEl.style.display = discAmt > 0 ? '' : 'none';
    }

    animate(displayed, final);

    const saveEl = $('#calcSave') as HTMLElement | null;
    const saveTxtEl = $('#calcSaveTxt');
    if (saveEl && saveTxtEl) {
      if (discAmt > 0) {
        saveEl.style.display = '';
        saveTxtEl.textContent = `Ahorras $${clp(discAmt)} con ${BANCO_LABELS[state.banco]}`;
      } else {
        saveEl.style.display = 'none';
      }
    }

    const cuotasNEl = $('#calcCuotasN');
    if (cuotasNEl) cuotasNEl.textContent = String(state.cuotas);

    const cuotasN2El = $('#calcCuotasN2');
    if (cuotasN2El) cuotasN2El.textContent = String(state.cuotas);

    const cuotaAmtEl = $('#calcCuotaAmt');
    if (cuotaAmtEl) cuotaAmtEl.textContent = clp(cuotaVal);
  };

  $$('[data-calc] .calc-chip').forEach(chip => {
    // Chips sin data-value (ej. el enlace "Otros convenios" → WhatsApp) no son
    // selectores: dejamos que el navegador siga el href sin tocar el estado.
    if ((chip as HTMLElement).dataset.value === undefined) return;
    chip.addEventListener('click', () => {
      const group = (chip as HTMLElement).parentElement?.getAttribute('data-calc');
      if (!group) return;
      $$(`[data-calc="${group}"] .calc-chip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = (chip as HTMLElement).dataset.value ?? '';
      if (group === 'tipo') state.tipo = val as Tipo;
      else if (group === 'ancho') state.ancho = parseInt(val, 10) as Ancho;
      else if (group === 'region') { state.region = val as Region; fillComunas(); }
      else if (group === 'banco') state.banco = val as Banco;
      render();
    });
  });

  select.addEventListener('change', () => { state.comuna = select.value; render(); });

  const rangeEl = $('#calcCuotasRange') as HTMLInputElement | null;
  if (rangeEl) {
    rangeEl.addEventListener('input', (e) => {
      state.cuotas = parseInt((e.target as HTMLInputElement).value, 10);
      render();
    });
  }

  const addEl = $('#calcAdd');
  if (addEl) {
    addEl.addEventListener('click', () => {
      const base = basePrice(state.tipo, state.ancho);
      const discAmt = discountAmount(base, state.banco);
      const final = finalPrice(base, state.banco);
      window.dsCart.add({
        id: `calc-${state.tipo}-${state.ancho}-${state.banco}`,
        name: `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}`,
        variant: `${state.ancho} cm · ${state.comuna}, ${state.region}${discAmt > 0 ? ' · banco ' + state.banco : ''}`,
        unitPrice: final,
        label: `${state.tipo.toUpperCase()} ${state.ancho}`,
        image: PRODUCT_MEDIA[state.tipo]?.image,
      });
    });
  }

  // Initial paint
  const initBase = basePrice('tradicional', 40);
  const initFinal = finalPrice(initBase, 'santander');
  const totalEl = $('#calcTotal');
  if (totalEl) totalEl.textContent = clp(initFinal);
  displayed = initFinal;
  render();
}
