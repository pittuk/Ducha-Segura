export interface Convenio {
  name: string;
  logo: string;
  beneficiarios: string;
  descuento: string;     // titular del badge, ej. "20%"
  detalle: string[];     // precios y condiciones
  zona?: string;
  vigencia?: string;
}

// Convenios vigentes (info real de duchasegura.cl/convenios). Precios normales de referencia:
// Tina tradicional $365.000 · Hidromasaje $460.000. Descuentos NO acumulables entre sí.
// Orden de visualización (carrusel home y página /convenios):
// Chile Cuida → Banco de Chile → Banco Santander → Caja Los Andes → Penta Vida → SURA → municipios → Estadio Español.
export const CONVENIOS: Convenio[] = [
  {
    name: 'Chile Cuida',
    logo: '/images/logo-convenios/chile-cuida.webp',
    beneficiarios: 'Personas cuidadoras con credencial Chile Cuida',
    descuento: '15%',
    detalle: [
      '15% dcto. en el total del servicio de rebaje de tina',
      'Presentar credencial física o digital',
      'No aplica a accesorios complementarios · no acumulable',
    ],
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Banco de Chile',
    logo: '/images/logo-convenios/Banco_de_Chile_Logo.png',
    beneficiarios: 'Clientes de Banco de Chile y Banco Edwards',
    descuento: '20%',
    detalle: [
      '20% dcto. en el total de tu compra',
      'Pagando con tarjetas Banco de Chile / Edwards, en compra presencial',
      'Solicitar el descuento al momento de pagar · no acumulable',
    ],
    zona: 'Gran Santiago y Gran Concepción',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Banco Santander',
    logo: '/images/logo-convenios/logo-santander.webp',
    beneficiarios: 'Clientes de Banco Santander',
    descuento: '15%',
    detalle: [
      '15% dcto. en el total de tu compra',
      'Pagando con tarjetas Santander, en compra presencial',
      'Solicitar el descuento al momento de pagar · no acumulable',
    ],
    zona: 'Gran Santiago y Gran Concepción',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Caja Los Andes',
    logo: '/images/logo-convenios/caja-los-andes.png',
    beneficiarios: 'Pensionados de Caja Los Andes',
    descuento: '20%',
    detalle: [
      'Tina tradicional: $292.000 (normal $365.000)',
      'Hidromasaje: $368.000 (normal $460.000)',
      'Hasta 24 cuotas sin interés con tarjeta de cualquier banco',
      'No acumulable con otras promociones',
    ],
  },
  {
    name: 'Penta Vida',
    logo: '/images/logo-convenios/penta-vida.png',
    beneficiarios: 'Pensionados Penta Vida',
    descuento: '20%',
    detalle: [
      '20% dcto. en el total de tu compra',
      'Cualquier método de pago · hasta 24 cuotas sin interés',
      'No acumulable con otras promociones y convenios',
    ],
    zona: 'Gran Valparaíso, Gran Santiago y Gran Concepción',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Seguros SURA',
    logo: '/images/logo-convenios/sura_seguros_logotipo_unatinta_azul_positivo.png',
    beneficiarios: 'Clientes de Seguros SURA',
    descuento: '15%',
    detalle: [
      '15% en la compra total (adaptación + accesorios)',
      'Solo válido si se realiza la adaptación · previa reserva',
      'Mencionar el código de descuento al cotizar',
    ],
    zona: 'RM, Gran Valparaíso y Biobío',
    vigencia: 'hasta el 31/12/2030',
  },
  {
    name: 'Tarjeta Vecino — Municipalidad de Colina',
    logo: '/images/logo-convenios/tarjeta-vecino-colina.png',
    beneficiarios: 'Adultos mayores de Colina con Tarjeta Vecino',
    descuento: '15%',
    detalle: [
      'Tina tradicional: $310.250 (normal $365.000) + barra cromada 40 cm con instalación',
      'Hidromasaje: $391.000 (normal $460.000) + barra cromada 40 cm con instalación',
      'Aplica con todo medio de pago · no acumulable',
    ],
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Municipalidad de Las Condes',
    logo: '/images/logo-convenios/MUNICIPALIDAD-DE-LAS-CONDES-LOGO.jpg',
    beneficiarios: 'Adultos mayores de Las Condes',
    descuento: '10%',
    detalle: [
      'Opción A — 10% dcto.: Tina $328.500 · Hidromasaje $414.000',
      'Opción B — Rebaje + barra de 30 cm de acero inox + instalación: $365.000',
      'Aplica solo una de las dos opciones',
    ],
    zona: 'RM',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Municipalidad de Ñuñoa',
    logo: '/images/logo-convenios/Logo-nunoa-1980x697-1.webp',
    beneficiarios: 'Residentes de Ñuñoa con Tarjeta Vecino',
    descuento: '10%',
    detalle: [
      'Opción A — 10% dcto.: Tina $328.500 · Hidromasaje $414.000',
      'Opción B — Rebaje + barra de 30 cm de acero inox + instalación: $365.000',
      'Presentar Tarjeta Vecino al solicitar',
    ],
    zona: 'RM',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Municipalidad de Providencia',
    logo: '/images/logo-convenios/logo_providencia_footer.svg',
    beneficiarios: 'Residentes de Providencia',
    descuento: '10%',
    detalle: [
      '10% dcto. solo en el rebaje de la tina',
      'Incluye visita técnica gratuita (máx. 20 min) con un especialista',
    ],
    zona: 'RM',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Municipalidad de La Reina',
    logo: '/images/logo-convenios/logo.jpg',
    beneficiarios: 'Residentes de La Reina con Tarjeta Ciudad',
    descuento: '10%',
    detalle: [
      'Opción A — 10% dcto.: Tina $328.500 · Hidromasaje $414.000',
      'Opción B — Rebaje $365.000 + barra de 30 cm de acero inox gratis, con instalación',
    ],
    zona: 'RM',
    vigencia: 'hasta el 31/12/2026',
  },
  {
    name: 'Estadio Español Chiguayante',
    logo: '/images/logo-convenios/estadio-espanol-chiguayante-marca.png',
    beneficiarios: 'Socios del Estadio Español Chiguayante',
    descuento: '15%',
    detalle: [
      'Opción A — 15% dcto.: Tina $310.250 · Hidromasaje $391.000',
      'Opción B — 15% dcto. en todos los accesorios complementarios',
      'Presentar perfil de la app institucional + cédula de identidad',
    ],
    zona: 'Biobío',
    vigencia: 'hasta el 31/12/2026',
  },
];
