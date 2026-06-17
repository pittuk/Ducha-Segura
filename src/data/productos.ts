import data from './productos.json';

export type Grupo = 'rebaje' | 'kit' | 'accesorio';

export interface Producto {
  id: string;
  slug: string;            // coincide con el slug de WooCommerce → /producto/<slug>/
  name: string;
  grupo: Grupo;
  price: number;           // 0 = a medida / a consultar
  regularPrice: number | null;
  salePrice: number | null;
  shortDescription: string;
  descriptionHtml: string;
  image: string;
  images: string[];
  priceLabel?: string;     // ej. "A medida" cuando no hay precio fijo
  featured?: boolean;      // tarjeta destacada (banner ancho)
  custom?: boolean;        // no proviene de WooCommerce
}

// Imágenes curadas para rebajes (elegidas por el cliente; mejores que las de WC).
const IMG_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-tradicional': '/images/rebajes/Rebaje Tina Tradicional.webp',
  'rebaje-de-tina-jacuzzi': '/images/rebajes/Rebaje Tina Jacuzzi.webp',
};

// Renombrar el nombre VISIBLE (no el slug, que está indexado). Sobrevive a re-importar de WC.
// (El rebaje de jacuzzi conserva el nombre "Jacuzzi" del JSON; no se sobrescribe.)
const NAME_OVERRIDE: Record<string, string> = {
  'barra-de-cromada-40cm': 'Barra cromada 40cm',
};

// Recategorizar productos (decisión del cliente; sobrevive a re-importar de WC).
const GRUPO_OVERRIDE: Record<string, Grupo> = {
  'juego-de-ducha-2-funciones': 'accesorio',
  'kit-cortina-bano': 'accesorio',
};

// Descripciones enriquecidas (SEO/AEO + ficha): material, medidas, compatibilidad,
// instalación, garantía. Reemplazan las descripciones mínimas de WooCommerce y
// sobreviven a re-importar (mismo patrón que NAME/IMG_OVERRIDE). Alimentan tanto
// la sección "Descripción" como `Product.description` del JSON-LD (ver seo.ts).
const DESC_OVERRIDE: Record<string, string> = {
  'rebaje-de-tina-tradicional':
    '<p>El <strong>rebaje de tina tradicional</strong> corta y rebaja la pared lateral de tu tina existente para crear un acceso bajo y seguro, sin demoler ni reemplazar la tina. Es la solución ideal para adultos mayores y personas con movilidad reducida que ya no pueden levantar la pierna sobre el borde.</p><p>Lo realizamos a domicilio, normalmente en <strong>menos de 2 horas</strong> y el mismo día, sobre tinas de fierro fundido, fibra, acrílico y acero. Producto nacional patentado, con <strong>garantía de 3 años</strong>. *Precio sujeto a evaluación de factibilidad técnica.</p>',
  'rebaje-de-tina-jacuzzi':
    '<p>El <strong>rebaje de tina jacuzzi (hidromasaje)</strong> adapta tu tina con motor, cañerías de hidromasaje y conexiones eléctricas para lograr un acceso bajo y seguro, conservando la estructura y el funcionamiento del equipo. Su instalación es más compleja que la de una tina convencional, por lo que se evalúa la posición de montaje y el enlace de las conexiones de llenado y desagüe.</p><p>Trabajo a domicilio realizado por técnicos especializados. Producto nacional patentado y <strong>garantía de 3 años</strong>. *Precio sujeto a evaluación de factibilidad técnica.</p>',
  'juego-de-ducha-2-funciones':
    '<p>Juego de ducha anticalcáreo con maneral de <strong>2 funciones</strong> (chorro y lluvia) y flexible disponible en <strong>1,75 m o 2,00 m</strong>. El maneral antical evita la acumulación de sarro en las salidas, manteniendo un flujo parejo y facilitando la limpieza.</p><p>Es el complemento ideal para un baño accesible: permite ducharse cómodamente sentado o con apoyo. Se cotiza junto al rebaje de tina.</p>',
  'kit-cortina-bano':
    '<p>Kit de cortina pensado para baños con tina rebajada. Incluye <strong>riel tubular de acero inoxidable de 19 mm</strong> de espesor, argollas plásticas, soporte para el riel y forro de cortina.</p><p>El riel inoxidable resiste la humedad sin oxidarse y mantiene la cortina firme para contener el agua dentro de la zona de ducha. Instalación sencilla sobre muro. Se cotiza junto al rebaje de tina.</p>',
  'tabla-de-tina-para-bano':
    '<p>Asiento de tina plástico, antideslizante y ergonómico, con <strong>2 posiciones de instalación</strong> para adaptarse al ancho de tu tina. Sus agujeros de drenaje evitan la acumulación de agua y reducen el riesgo de deslizamiento.</p><p>Permite ducharse sentado de forma estable, ideal para adultos mayores o personas con movilidad reducida. Soporta hasta <strong>100 kg</strong>. Se cotiza junto al rebaje de tina.</p>',
  'banco-de-transferencia-para-tina':
    '<p>Banco de transferencia diseñado para personas con movilidad reducida o en recuperación post-operatoria. Facilita el ingreso y la salida de la tina: permite sentarse fuera y deslizarse hacia el interior con seguridad, evitando giros y apoyos riesgosos.</p><p>Es <strong>ajustable</strong> y compatible con la mayoría de las tinas, con superficie antideslizante. Soporta hasta <strong>113 kg</strong> aproximadamente. Se cotiza junto al rebaje de tina.</p>',
  'barra-abatible':
    '<p>Barra de seguridad <strong>abatible de 60 cm</strong> en acero inoxidable color blanco, empotrada en el muro. Su sistema abatible permite levantarla cuando no se usa, liberando espacio en baños pequeños.</p><p>Entrega un punto de apoyo firme junto al W.C. o la ducha para sentarse y levantarse con seguridad, especialmente útil para adultos mayores. Se cotiza junto al rebaje de tina.</p>',
  'barra-borde-tina':
    '<p>Barra de apoyo en acero inoxidable color blanco que se instala en el <strong>borde de la tina</strong>, entregando un punto de sujeción firme para el ingreso y la salida. Se recomienda especialmente para tinas de fierro fundido.</p><p>Ayuda a mantener el equilibrio en el momento más riesgoso del baño y se monta sin obras mayores. Se cotiza junto al rebaje de tina.</p>',
  'barra-de-cromada-40cm':
    '<p>Barra de seguridad <strong>cromada de 40 cm</strong> para el baño, con terminación brillante que combina con la grifería tradicional. Fabricada en acero con acabado cromado resistente a la humedad.</p><p>Ofrece un apoyo firme para entrar y salir de la tina o la ducha con mayor seguridad. *Precio variable según las medidas de la barra. Se cotiza junto al rebaje de tina.</p>',
  'barra-de-seguridad-30cm':
    '<p>Barra de seguridad de <strong>30 cm</strong> fabricada en <strong>acero inoxidable</strong>, ideal como apoyo para el ingreso y la salida de la tina o la ducha. Soporta hasta <strong>100 kg</strong> de carga.</p><p>El acero inoxidable resiste la humedad y la corrosión del baño, manteniendo un agarre firme y seguro en el tiempo. Disponible también en 40, 60 y 76 cm. *Precio variable según las medidas. Se cotiza junto al rebaje de tina.</p>',
  'barra-de-seguridad-40cm':
    '<p>Barra de seguridad de <strong>40 cm</strong> fabricada en <strong>acero inoxidable</strong>, ideal como apoyo para el ingreso y la salida de la tina o la ducha. Soporta hasta <strong>100 kg</strong> de carga.</p><p>El acero inoxidable resiste la humedad y la corrosión del baño, manteniendo un agarre firme y seguro en el tiempo. Disponible también en 30, 60 y 76 cm. *Precio variable según las medidas. Se cotiza junto al rebaje de tina.</p>',
  'barra-de-seguridad-60cm':
    '<p>Barra de seguridad de <strong>60 cm</strong> fabricada en <strong>acero inoxidable</strong>, ideal como apoyo para el ingreso y la salida de la tina o la ducha. Soporta hasta <strong>100 kg</strong> de carga.</p><p>El acero inoxidable resiste la humedad y la corrosión del baño, manteniendo un agarre firme y seguro en el tiempo. Disponible también en 30, 40 y 76 cm. *Precio variable según las medidas. Se cotiza junto al rebaje de tina.</p>',
  'barra-de-seguridad-76cm':
    '<p>Barra de seguridad de <strong>76 cm</strong> fabricada en <strong>acero inoxidable</strong>, ideal como apoyo para el ingreso y la salida de la tina o la ducha. Soporta hasta <strong>100 kg</strong> de carga.</p><p>El acero inoxidable resiste la humedad y la corrosión del baño, manteniendo un agarre firme y seguro en el tiempo. Disponible también en 30, 40 y 60 cm. *Precio variable según las medidas. Se cotiza junto al rebaje de tina.</p>',
  'barra-muro-piso-60cm':
    '<p>Barra de seguridad <strong>muro-piso de 60 cm</strong> en acero inoxidable, diseñada para instalarse a ambos lados del W.C. y entregar apoyo al sentarse y levantarse. Su fijación a muro y piso le da máxima estabilidad.</p><p>Soporta hasta <strong>100 kg</strong> y resiste la humedad del baño sin oxidarse. Pensada para adultos mayores y personas con movilidad reducida. Se cotiza junto al rebaje de tina.</p>',
  'lamina-antideslizante-para-tinas-3m':
    '<p>Lámina antideslizante <strong>3M</strong> autoadhesiva que se instala sobre la base de la tina para evitar resbalones. Su textura rugosa entrega agarre incluso con la superficie mojada y enjabonada.</p><p>Es <strong>antihongos y antibacterial</strong>, duradera y fácil de mantener. Una mejora simple y económica para hacer cualquier tina más segura, sin obras. Se cotiza junto al rebaje de tina.</p>',
};

const wc: Producto[] = (data as Producto[]).map((p) => ({
  ...p,
  name: NAME_OVERRIDE[p.slug] ?? p.name,
  grupo: GRUPO_OVERRIDE[p.slug] ?? p.grupo,
  image: IMG_OVERRIDE[p.slug] ?? p.image,
  descriptionHtml: DESC_OVERRIDE[p.slug] ?? p.descriptionHtml,
}));

// Kits curados (no existen en WooCommerce). Imágenes reales. Precios reales entregados por el cliente.
const CURATED: Producto[] = [
  {
    id: 'kit-rebaje-40cm',
    slug: 'kit-rebaje-40cm',
    name: 'Kit Rebaje 40 cm',
    grupo: 'kit',
    price: 178500,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje de 40 cm para instalar tú mismo. Incluye manual paso a paso.',
    descriptionHtml: '<p>Kit de rebaje de tina formato <strong>hágalo usted mismo</strong>: incluye la pieza de rebaje de 40 cm en fibra de vidrio reforzada y un manual de instalación paso a paso.</p><p><small>*Precios: No acumulables con otros descuentos, promociones ni convenios vigentes.</small></p>',
    image: '/images/kits/Kit Rebaje 40 cm - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm - DUCHA SEGURA.webp'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra',
    slug: 'kit-rebaje-40cm-barra',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox',
    grupo: 'kit',
    price: 205000,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra de seguridad de acero inoxidable de 40 cm.',
    descriptionHtml: '<p>Incluye la pieza de rebaje de 40 cm y una <strong>barra de seguridad de acero inoxidable de 40 cm</strong> con sus elementos de fijación y guía de montaje.</p><p><small>*Precios: No acumulables con otros descuentos, promociones ni convenios vigentes.</small></p>',
    image: '/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox - DUCHA SEGURA.webp'],
    custom: true,
  },
  {
    id: 'kit-rebaje-40cm-barra-silicona',
    slug: 'kit-rebaje-40cm-barra-silicona',
    name: 'Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética',
    grupo: 'kit',
    price: 215000,
    regularPrice: null,
    salePrice: null,
    shortDescription: 'Pieza de rebaje 40 cm + barra inox 40 cm + silicona blanca acética de 280 ml para el sellado.',
    descriptionHtml: '<p>Kit completo: pieza de rebaje de 40 cm, <strong>barra de acero inoxidable de 40 cm</strong> y <strong>silicona blanca acética de 280 ml</strong> para un sellado prolijo y duradero.</p><p><small>*Precios: No acumulables con otros descuentos, promociones ni convenios vigentes.</small></p>',
    image: '/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética - DUCHA SEGURA.webp',
    images: ['/images/kits/Kit Rebaje 40 cm + barra 40 cm acero inox + silicona blanca acética - DUCHA SEGURA.webp'],
    custom: true,
  },
];

export const PRODUCTOS: Producto[] = [...wc, ...CURATED];

export const REBAJES = PRODUCTOS.filter((p) => p.grupo === 'rebaje');
export const KITS = PRODUCTOS.filter((p) => p.grupo === 'kit');

// Orden de accesorios: barras de seguridad estrictamente por tamaño (menor → mayor),
// luego el resto de las barras. Los slugs no listados aquí quedan al final en su orden original.
const ACCESORIOS_ORDER: string[] = [
  'barra-de-seguridad-30cm',
  'barra-de-seguridad-40cm',
  'barra-de-seguridad-60cm',
  'barra-de-seguridad-76cm',
  'barra-de-cromada-40cm',
  'barra-abatible',
  'barra-borde-tina',
  'barra-muro-piso-60cm',
];
export const ACCESORIOS = (() => {
  const list = PRODUCTOS.filter((p) => p.grupo === 'accesorio');
  const rank = (slug: string, origIdx: number): number => {
    const i = ACCESORIOS_ORDER.indexOf(slug);
    return i === -1 ? ACCESORIOS_ORDER.length + origIdx : i;
  };
  return list
    .map((p, idx) => ({ p, r: rank(p.slug, idx) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p);
})();

export const getProducto = (slug: string): Producto | undefined =>
  PRODUCTOS.find((p) => p.slug === slug);
