export type Region = 'RM' | 'Valparaíso' | 'Bío Bío';

export const COMUNAS: Record<Region, string[]> = {
  'RM':['Las Condes','Providencia','Ñuñoa','Vitacura','La Reina','Lo Barnechea','Maipú','San Miguel','La Florida','Macul','Santiago Centro','Independencia'],
  'Valparaíso':['Viña del Mar','Valparaíso','Concón','Quilpué','Villa Alemana'],
  'Bío Bío':['Concepción','Talcahuano','San Pedro de la Paz','Chiguayante','Hualpén'],
};
