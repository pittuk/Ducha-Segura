export interface TipoTina {
  id: string;
  name: string;
  nota?: string;
  image: string;
}

// 6 tipos de la tina EXISTENTE del cliente (distinto del producto rebaje).
// Imágenes placeholder en public/images/tinas/ — reemplazar por reales luego.
export const TIPOS_TINA: TipoTina[] = [
  { id: 'acero-acrilica', name: 'Tina acero esmaltado o acrílica', image: '/images/tinas/acero-acrilica.svg' },
  { id: 'hidromasaje',    name: 'Tina hidromasaje',                image: '/images/tinas/hidromasaje.svg' },
  { id: 'fierro-fundido', name: 'Tina fierro fundido',             image: '/images/tinas/fierro-fundido.svg' },
  { id: 'especial-1',     name: 'Tina especial', nota: 'Borde grueso',            image: '/images/tinas/especial-1.svg' },
  { id: 'especial-2',     name: 'Tina especial', nota: 'Mampara o shower door',   image: '/images/tinas/especial-2.svg' },
  { id: 'especial-3',     name: 'Tina especial', nota: 'Borde grueso irregular',  image: '/images/tinas/especial-3.svg' },
];

export const TINA_IDS = TIPOS_TINA.map(t => t.id);
export const getTina = (id: string) => TIPOS_TINA.find(t => t.id === id);
