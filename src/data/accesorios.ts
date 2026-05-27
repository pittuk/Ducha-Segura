export interface Accesorio {
  id: string;
  name: string;
  sub: string;
  price: number;
  label: string;
}

export const ACCESORIOS: Accesorio[] = [
  { id:'barra60', name:'Barra de apoyo recta', sub:'60 cm · acero inox.', price:34990, label:'BARRA APOYO 60CM' },
  { id:'asiento', name:'Asiento abatible de ducha', sub:'Carga hasta 130 kg', price:89990, label:'ASIENTO ABATIBLE' },
  { id:'piso', name:'Set antideslizante de piso', sub:'8 piezas · doble adhesivo', price:19990, label:'SET ANTIDESLIZANTE' },
  { id:'mampara', name:'Mampara baño asistido', sub:'Apertura amplia · vidrio', price:249990, label:'MAMPARA APERTURA' },
];
