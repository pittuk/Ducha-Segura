// Kits = combos / productos que agrupan rebaje + complementos. Misma forma que Accesorio,
// por lo que pueden renderizarse con AccessoryCard (tipado estructural).
export interface Kit {
  id: string;
  name: string;
  sub: string;
  price: number;
  label: string;
  /** Ruta de imagen en public/ (ej. /images/accesorios/.../foto.webp). Opcional → cae al placeholder. */
  image?: string;
  /** Ajuste de la imagen en el recuadro cuadrado. Default 'contain'. Las escenas usan 'cover'. */
  fit?: 'contain' | 'cover';
}

// ⚠️ PRECIOS PROVISIONALES — confirmar antes de publicar/desplegar.
// Imágenes reales en public/images/accesorios/<carpeta>/<archivo>.
export const KITS: Kit[] = [
  { id:'kit-rebaje-barra', name:'Kit rebaje + barra cromada 40 cm', sub:'Rebaje de tina con barra de apoyo', price:229990, label:'KIT REBAJE + BARRA', fit:'cover',
    image:'/images/accesorios/Kit rebaje más barra cromada 40 cm/Kit rebaje más barra cromada 40 cm.webp' },
  { id:'kit-cortina', name:'Kit de cortina', sub:'Cortina + barra para el rebaje', price:24990, label:'KIT DE CORTINA',
    image:'/images/accesorios/Kit de cortina/Mesa-de-trabajo-1-copia-2.png' },
  { id:'set-antideslizante', name:'Set antideslizante de piso', sub:'Láminas antideslizantes para la tina', price:19990, label:'SET ANTIDESLIZANTE',
    image:'/images/accesorios/Lámina antideslizante/Mesa-de-trabajo-1-copia.png' },
  { id:'rebaje-puerta-estanca', name:'Rebaje con puerta estanca', sub:'Vidrio templado · cierre hermético', price:299990, label:'REBAJE PUERTA ESTANCA', fit:'cover',
    image:'/images/accesorios/Rebaje de tina con puerta estanca en vidrio templado/Rebaje de tina con puerta estanca en vidrio templado.webp' },
];
