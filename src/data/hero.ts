export interface HeroCopy {
  kicker: string; h1A: string; h1B: string; sub: string;
  primary: string; secondary: string;
  pfKicker: string; pfH2: string; pfSub: string;
}
export type Mode = 'user' | 'caregiver';

// Copiado de legacy/index.html (HERO_COPY, ~1354–1370), claves `user` y `caregiver`.
export const HERO_COPY: Record<Mode, HeroCopy> = {
  user: {
    kicker: 'Patente chilena · +6 años fabricando rebajes en Chile',
    h1A: 'Rebaje para tinas.', h1B: 'Un acceso seguro.',
    sub: 'Adapta tu tina en 2 horas. Sin obras ni riesgo de filtraciones.',
    primary: 'Ver rebajes', secondary: 'Habla con un ejecutivo',
    pfKicker: '¿Listo para tu rebaje?', pfH2: 'Coordina hoy.', pfSub: 'Instalamos esta semana.',
  },
  caregiver: {
    kicker: 'Para quien cuida con amor',
    h1A: 'Cuidar es prevenir', h1B: 'esa caída.',
    sub: 'Le devolvés autonomía a mamá, papá o a quien quieras cuidar. Un día de instalación, 3 años de garantía.',
    primary: 'Ver precios y agendar', secondary: 'Quiero asesorarme',
    pfKicker: '¿Listos para hacer su baño seguro?', pfH2: 'Coordina hoy.', pfSub: 'Le instalamos esta semana.',
  },
};
