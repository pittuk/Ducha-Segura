export interface Accesorio {
  id: string;
  name: string;
  sub: string;
  price: number;
  label: string;
  /** Ruta de imagen en public/ (ej. /images/accesorios/.../foto.webp). Opcional → cae al placeholder. */
  image?: string;
  /** Ajuste de la imagen en el recuadro cuadrado. Default 'contain' (recortes sobre blanco). */
  fit?: 'contain' | 'cover';
}

// ⚠️ PRECIOS PROVISIONALES — confirmar antes de publicar/desplegar.
// Imágenes reales en public/images/accesorios/<carpeta>/<archivo>.
export const ACCESORIOS: Accesorio[] = [
  { id:'barra-cromada', name:'Barra de apoyo cromada', sub:'40 y 60 cm · cromado', price:29990, label:'BARRA CROMADA',
    image:'/images/accesorios/Barra cromada 40 y 60 cm/Barra cromada 40 y 60 cm.webp' },
  { id:'barra-inox', name:'Barra de seguridad acero inox', sub:'30 · 40 · 60 · 76 cm', price:34990, label:'BARRA ACERO INOX',
    image:'/images/accesorios/Barra de seguridad acero inox 30, 40, 60 y 76 cm/Mesa-de-trabajo-1-copia-6.png' },
  { id:'barra-muro-piso', name:'Barra muro-piso para W.C.', sub:'60 cm · acero inox', price:49990, label:'BARRA MURO-PISO',
    image:'/images/accesorios/Barra muro-piso w.c 60cm/Barra muro-piso w.c 60cm.webp' },
  { id:'banco-transferencia', name:'Banco de transferencia', sub:'Entrada asistida a la tina', price:79990, label:'BANCO TRANSFERENCIA',
    image:'/images/accesorios/Banco de transferencia/Mesa-de-trabajo-1-copia-3.png' },
  { id:'asiento-2pos', name:'Asiento 2 posiciones', sub:'Banqueta apoyada en la tina', price:69990, label:'ASIENTO 2 POSICIONES',
    image:'/images/accesorios/Asiento 2 posiciones/Mesa-de-trabajo-1-copia-9.png' },
  { id:'barra-borde-tina', name:'Barra borde de tina', sub:'Apoyo sujeto al borde', price:39990, label:'BARRA BORDE TINA',
    image:'/images/accesorios/Barra borde tina/Mesa-de-trabajo-1-copia-10.png' },
  { id:'barra-abatible', name:'Barra abatible', sub:'Se pliega contra el muro', price:59990, label:'BARRA ABATIBLE',
    image:'/images/accesorios/Barra abatible/Mesa-de-trabajo-1-copia-7.png' },
];
