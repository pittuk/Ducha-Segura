export interface Product {
  id: string;
  name: string;
  sub: string;
  badge: string;
  badgeColor: 'red' | 'blue' | 'soft';
  priceFrom: number;
  cuotas: string;
  medidas: string;
  bullets: string[];
  label: string;
  accent: string;
  featured?: boolean;
}

export const PRODUCTS: Product[] = [
  { id:'tradicional', name:'Rebaje Tina Tradicional', sub:'Lata, latón, fierro o fibra de vidrio',
    badge:'Más vendido', badgeColor:'red', priceFrom:199000,
    cuotas:'12 cuotas de $16.583 sin interés', medidas:'30 · 40 · 50 cm',
    bullets:['Instalación incluida','Garantía 3 años','7–10 días hábiles'],
    label:'PRODUCTO REBAJE TRADICIONAL', accent:'#7a96a8' },
  { id:'jacuzzi', name:'Rebaje Tina Jacuzzi', sub:'Hidromasaje · caso especializado',
    badge:'Con hidromasaje', badgeColor:'blue', priceFrom:399000,
    cuotas:'24 cuotas de $16.625 sin interés', medidas:'40 · 50 cm',
    bullets:['Cañerías intactas','Instalación incluida','Garantía 3 años'],
    label:'PRODUCTO REBAJE JACUZZI', accent:'#5a7990' },
  { id:'spa', name:'Rebaje Tina Spa XL', sub:'Tinas grandes · ofuro · spa doméstico',
    badge:'Caso especial', badgeColor:'soft', priceFrom:799000,
    cuotas:'Hasta 36 cuotas · consultar', medidas:'A medida',
    bullets:['Visita técnica previa','Diseño a medida','Garantía 3 años'],
    label:'PRODUCTO REBAJE SPA XL', accent:'#3f5e72', featured:true },
];
