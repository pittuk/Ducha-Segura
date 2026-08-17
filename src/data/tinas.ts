export interface TipoTina {
  id: string;
  name: string;
  nota?: string;
  image: string;
  /** Foto del mismo tipo de tina ya con el rebaje instalado (hover en /cotizar, antes/después en /tipos-de-tina). */
  imageAfter?: string;
  /** Cómo reconocerla (página /tipos-de-tina). */
  comoReconocerla?: string;
  /** Cómo queda con el rebaje (página /tipos-de-tina). */
  conRebaje?: string;
}

// 6 tipos de la tina EXISTENTE del cliente (distinto del producto rebaje).
// Imágenes reales en public/images/tinas/.
// 'no-se' se renderiza como botón sin imagen en el formulario (ver cotizar.astro).
export const TIPOS_TINA: TipoTina[] = [
  {
    id: 'acero-acrilica',
    name: 'Tina acero esmaltado o acrílica',
    image: '/images/tinas/Tina acero esmaltado o acrílica.webp',
    imageAfter: '/images/tinas/Tina acero esmaltado o acrílica despues.webp',
    comoReconocerla: 'Es la más común en departamentos y casas nuevas. Pared delgada y liviana: al golpearla suena hueca y el borde se siente algo flexible. La acrílica es tibia al tacto; la de acero esmaltado, fría.',
    conRebaje: 'Es el caso más simple: el corte es limpio y la pieza se instala el mismo día, en menos de 2 horas.',
  },
  {
    id: 'hidromasaje',
    name: 'Tina hidromasaje',
    image: '/images/tinas/Tina hidromasaje copia.webp',
    imageAfter: '/images/tinas/Tina hidromasaje copia despues.webp',
    comoReconocerla: 'Tiene jets en las paredes internas, panel de control y un faldón que oculta la bomba y las mangueras.',
    conRebaje: 'Sí se puede rebajar. El técnico revisa dónde pasan las mangueras y los jets para definir el punto de corte sin tocar el sistema de hidromasaje.',
  },
  {
    id: 'fierro-fundido',
    name: 'Tina fierro fundido',
    image: '/images/tinas/Tina fierro fundido.webp',
    imageAfter: '/images/tinas/Tina fierro fundido despues.webp',
    comoReconocerla: 'Típica de casas antiguas: muy pesada, borde grueso, esmalte brillante y suena macizo al golpearla. Suele tener puntos de óxido en el desagüe.',
    conRebaje: 'Se rebaja igual, con herramienta de corte para material macizo. Toma un poco más de tiempo que una tina de acero o acrílica.',
  },
  {
    id: 'especial-1',
    name: 'Tina especial',
    nota: 'Borde grueso',
    image: '/images/tinas/Tina especial borde grueso.webp',
    imageAfter: '/images/tinas/Tina especial borde grueso despues.webp',
    comoReconocerla: 'El borde es ancho (una repisa de varios centímetros) o está rematado en cerámica o cubierta de albañilería.',
    conRebaje: 'Requiere medir el ancho del borde antes de la visita para elegir la pieza correcta. Envíanos una foto y te confirmamos la factibilidad.',
  },
  {
    id: 'especial-2',
    name: 'Tina especial',
    nota: 'Mampara o shower door',
    image: '/images/tinas/Tina especial con mampara o shower door.webp',
    imageAfter: '/images/tinas/Tina especial con mampara o shower door despues.webp',
    comoReconocerla: 'Tiene una mampara de vidrio o un shower door montado sobre el borde de la tina.',
    conRebaje: 'La mampara se retira o se recorta según el modelo para dejar libre el paso. Lo revisamos contigo antes de agendar.',
  },
  {
    id: 'especial-3',
    name: 'Tina a medida',
    nota: 'Forma especial',
    image: '/images/tinas/Tina a medida forma especial.webp',
    imageAfter: '/images/tinas/Tina a medida forma especial despues.webp',
    comoReconocerla: 'Tinas de esquina, ovaladas, empotradas en un podio o hechas a la medida del baño.',
    conRebaje: 'Se resuelve con una pieza a medida. Necesitamos fotos y medidas para cotizarla.',
  },
  { id: 'no-se',          name: 'No sé qué tipo de tina es', nota: 'Te ayudamos',  image: '/images/tinas/no-se.svg' },
];

export const TINA_IDS = TIPOS_TINA.map(t => t.id);
export const getTina = (id: string) => TIPOS_TINA.find(t => t.id === id);
