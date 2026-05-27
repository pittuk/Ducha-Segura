export interface Convenio {
  name: string;
  logo: string;
}

// Convenios con logo real (archivos en public/images/logo-convenios/).
export const CONVENIOS: Convenio[] = [
  { name: 'Santander', logo: '/images/logo-convenios/logo-santander.webp' },
  { name: 'Banco de Chile', logo: '/images/logo-convenios/Banco_de_Chile_Logo.png' },
  { name: 'SURA', logo: '/images/logo-convenios/sura_seguros_logotipo_unatinta_azul_positivo.png' },
  { name: 'Municipalidad de Las Condes', logo: '/images/logo-convenios/MUNICIPALIDAD-DE-LAS-CONDES-LOGO.jpg' },
  { name: 'Municipalidad de Ñuñoa', logo: '/images/logo-convenios/Logo-nunoa-1980x697-1.webp' },
  { name: 'Municipalidad de Providencia', logo: '/images/logo-convenios/logo_providencia_footer.svg' },
  { name: 'Municipalidad de La Reina', logo: '/images/logo-convenios/logo.jpg' },
  { name: 'Estadio Español de Chiguayante', logo: '/images/logo-convenios/estadio-espanol-chiguayante-marca.png' },
];
