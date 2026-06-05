import { $, $$ } from './dom';
import { basePrice, type Tipo, type Ancho } from '../lib/pricing';
import { COMUNAS, type Region } from '../data/comunas';
import { PRODUCT_MEDIA } from '../data/products-media';

// Configurador del rebaje en el home. Ya NO calcula/muestra precio (la sección destaca
// el 20% por convenios); solo arma la configuración y la agrega a la cotización con su
// precio base (referencial; "no sé" usa el ancho de 40 cm como referencia).
export function initCalculator(): void {
  const select = $('#calcComuna') as HTMLSelectElement | null;
  if (!select || (select as HTMLElement).dataset.bound) return;
  (select as HTMLElement).dataset.bound = '1';

  const state: { tipo: Tipo; ancho: Ancho | 'no-se'; region: Region | 'otra'; comuna: string } = {
    tipo: 'tradicional',
    ancho: 40,
    region: 'RM',
    comuna: 'Santiago', // se sobrescribe con COMUNAS['RM'][0] en fillComunas()
  };

  const fillComunas = (): void => {
    // "Otra región": no tenemos lista de comunas; ofrecemos coordinar el servicio.
    if (state.region === 'otra') {
      select.innerHTML = '<option value="">Consultar por servicio en tu región</option>';
      select.value = '';
      state.comuna = 'Otra región';
      return;
    }
    select.innerHTML = COMUNAS[state.region]
      .map(c => `<option value="${c}">${c}</option>`)
      .join('');
    state.comuna = COMUNAS[state.region][0];
    select.value = state.comuna;
  };
  fillComunas();

  const anchoLabel = (): string => (state.ancho === 'no-se' ? 'ancho a confirmar' : `${state.ancho} cm`);

  const render = (): void => {
    const cfgEl = $('#calcCfg');
    if (cfgEl) cfgEl.textContent = `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'} · ${anchoLabel()}`;

    const locEl = $('#calcLoc');
    if (locEl) locEl.textContent = state.region === 'otra' ? 'Otra región · consultar servicio' : `${state.comuna}, ${state.region}`;
  };

  $$('[data-calc] .calc-chip').forEach(chip => {
    // Chips sin data-value no son selectores: dejamos pasar el comportamiento por defecto.
    if ((chip as HTMLElement).dataset.value === undefined) return;
    chip.addEventListener('click', () => {
      const group = (chip as HTMLElement).parentElement?.getAttribute('data-calc');
      if (!group) return;
      $$(`[data-calc="${group}"] .calc-chip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = (chip as HTMLElement).dataset.value ?? '';
      if (group === 'tipo') state.tipo = val as Tipo;
      else if (group === 'ancho') state.ancho = val === 'no-se' ? 'no-se' : (parseInt(val, 10) as Ancho);
      else if (group === 'region') { state.region = val as Region | 'otra'; fillComunas(); }
      render();
    });
  });

  select.addEventListener('change', () => { state.comuna = select.value; render(); });

  const addEl = $('#calcAdd');
  if (addEl) {
    addEl.addEventListener('click', () => {
      const anchoNum: Ancho = state.ancho === 'no-se' ? 40 : state.ancho;
      const ubic = state.region === 'otra' ? 'Otra región' : `${state.comuna}, ${state.region}`;
      window.dsCart.add({
        id: `calc-${state.tipo}-${state.ancho}`,
        grupo: 'rebaje',
        name: `Rebaje Tina ${state.tipo === 'jacuzzi' ? 'Jacuzzi' : 'Tradicional'}`,
        variant: `${anchoLabel()} · ${ubic}`,
        unitPrice: basePrice(state.tipo, anchoNum),
        label: `${state.tipo.toUpperCase()} ${state.ancho}`,
        image: PRODUCT_MEDIA[state.tipo]?.image,
      });
    });
  }

  render();
}
