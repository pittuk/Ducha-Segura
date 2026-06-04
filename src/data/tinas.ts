export interface TipoTina {
  id: string;
  name: string;
  nota?: string;
  image: string;
}

// 6 tipos de la tina EXISTENTE del cliente (distinto del producto rebaje).
// Imágenes reales en public/images/tinas/.
// 'no-se' se renderiza como botón sin imagen en el formulario (ver cotizar.astro).
export const TIPOS_TINA: TipoTina[] = [
  { id: 'acero-acrilica', name: 'Tina acero esmaltado o acrílica', image: '/images/tinas/Tina acero esmaltado o acrílica.webp' },
  { id: 'hidromasaje',    name: 'Tina hidromasaje',                image: '/images/tinas/Tina hidromasaje copia.webp' },
  { id: 'fierro-fundido', name: 'Tina fierro fundido',             image: '/images/tinas/Tina fierro fundido.webp' },
  { id: 'especial-1',     name: 'Tina especial', nota: 'Borde grueso',            image: '/images/tinas/Tina especial borde grueso.webp' },
  { id: 'especial-2',     name: 'Tina especial', nota: 'Mampara o shower door',   image: '/images/tinas/Tina especial con mampara o shower door.webp' },
  { id: 'especial-3',     name: 'Tina a medida', nota: 'Forma especial',          image: '/images/tinas/Tina a medida forma especial.webp' },
  { id: 'no-se',          name: 'No sé qué tipo de tina es', nota: 'Te ayudamos',  image: '/images/tinas/no-se.svg' },
];

export const TINA_IDS = TIPOS_TINA.map(t => t.id);
export const getTina = (id: string) => TIPOS_TINA.find(t => t.id === id);
