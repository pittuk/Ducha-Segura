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
    name: 'Tina tradicional (esmaltada o acrílica)',
    image: '/images/tinas/Tina acero esmaltado o acrílica.webp',
    imageAfter: '/images/tinas/Tina acero esmaltado o acrílica despues.webp',
    comoReconocerla: 'Es la más común en departamentos y casas nuevas. Faldón delgado y liviano: al golpearla suena hueca. La tina acrílica es tibia al tacto; la tina de acero esmaltado, fría.',
    conRebaje: 'Es el caso más simple: el corte es limpio y la pieza se instala el mismo día, en menos de 40 minutos.',
  },
  {
    id: 'hidromasaje',
    name: 'Tina hidromasaje',
    image: '/images/tinas/Tina hidromasaje.webp',
    imageAfter: '/images/tinas/Tina hidromasaje despues.webp',
    comoReconocerla: 'Tiene jets en las paredes internas, panel de control eléctrico y un faldón que oculta la bomba, las mangueras y el motor.',
    conRebaje: 'Sí se puede rebajar. El técnico revisa dónde pasan las mangueras, el motor y los jets para definir el punto de corte, dejando el sistema inhabilitado.',
  },
  {
    id: 'fierro-fundido',
    name: 'Tina fierro fundido',
    image: '/images/tinas/Tina fierro fundido.webp',
    imageAfter: '/images/tinas/Tina fierro fundido despues.webp',
    comoReconocerla: 'Típica de casas de los años 30 al 60: muy pesada, borde grueso, esmalte brillante y suena macizo al golpearla. Suele tener puntos de óxido en el desagüe.',
    conRebaje: 'Toma un poco más de tiempo que una tina de acero o acrílica: 2 horas aproximadamente.',
  },
  {
    id: 'especial-1',
    name: 'Tina especial',
    nota: 'Borde grueso',
    image: '/images/tinas/Tina especial borde grueso.webp',
    imageAfter: '/images/tinas/Tina especial borde grueso despues.webp',
    comoReconocerla: 'El borde es ancho, faldón sobresaliente, terminación en cerámica o cubierta de albañilería.',
    conRebaje: 'Requiere medir el ancho del borde antes de la instalación para elegir la pieza correcta.',
  },
  {
    id: 'especial-2',
    name: 'Tina especial',
    nota: 'Mampara o shower door',
    image: '/images/tinas/Tina especial con mampara o shower door.webp',
    imageAfter: '/images/tinas/Tina especial con mampara o shower door despues.webp',
    comoReconocerla: 'Tiene una mampara de vidrio o un shower door montado sobre el borde de la tina.',
    conRebaje: 'La mampara o shower door se puede retirar y se instala un kit riel de cortina de Ducha Segura®, o se puede mantener dependiendo de factibilidad técnica. Lo revisamos contigo antes de agendar.',
  },
  {
    id: 'especial-3',
    name: 'Tina a medida',
    nota: 'Forma especial',
    image: '/images/tinas/Tina a medida forma especial.webp',
    imageAfter: '/images/tinas/Tina a medida forma especial despues.webp',
    comoReconocerla: 'Tinas o hidromasajes, empotradas en un podio o hechas a la medida del baño.',
    conRebaje: 'Al ser fabricantes de productos, se resuelve con una pieza a medida. Necesitamos fotos y medidas para cotizarla.',
  },
  { id: 'no-se',          name: 'No sé qué tipo de tina es', nota: 'Te ayudamos',  image: '/images/tinas/no-se.svg' },
];

export const TINA_IDS = TIPOS_TINA.map(t => t.id);
export const getTina = (id: string) => TIPOS_TINA.find(t => t.id === id);
