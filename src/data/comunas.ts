export type Region = 'RM' | 'Valparaíso' | 'Bío Bío';

// Listas oficiales completas por región (capital regional primero, luego alfabético).
export const COMUNAS: Record<Region, string[]> = {
  'RM': [
    'Santiago',
    'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Colina', 'Conchalí',
    'Curacaví', 'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba', 'Independencia',
    'Isla de Maipo', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
    'Lampa', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú',
    'María Pinto', 'Melipilla', 'Ñuñoa', 'Padre Hurtado', 'Paine', 'Pedro Aguirre Cerda',
    'Peñaflor', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura',
    'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San José de Maipo',
    'San Miguel', 'San Pedro', 'San Ramón', 'Talagante', 'Tiltil', 'Vitacura',
  ],
  'Valparaíso': [
    'Valparaíso',
    'Algarrobo', 'Cabildo', 'La Calera', 'Calle Larga', 'Cartagena', 'Casablanca', 'Catemu',
    'Concón', 'El Quisco', 'El Tabo', 'Hijuelas', 'Isla de Pascua', 'Juan Fernández', 'La Cruz',
    'La Ligua', 'Limache', 'Llaillay', 'Los Andes', 'Nogales', 'Olmué', 'Panquehue', 'Papudo',
    'Petorca', 'Puchuncaví', 'Putaendo', 'Quillota', 'Quilpué', 'Quintero', 'Rinconada',
    'San Antonio', 'San Esteban', 'San Felipe', 'Santa María', 'Santo Domingo', 'Villa Alemana',
    'Viña del Mar', 'Zapallar',
  ],
  'Bío Bío': [
    'Concepción',
    'Alto Biobío', 'Antuco', 'Arauco', 'Cabrero', 'Cañete', 'Chiguayante', 'Contulmo', 'Coronel',
    'Curanilahue', 'Florida', 'Hualpén', 'Hualqui', 'Laja', 'Lebu', 'Los Álamos', 'Los Ángeles',
    'Lota', 'Mulchén', 'Nacimiento', 'Negrete', 'Penco', 'Quilaco', 'Quilleco',
    'San Pedro de la Paz', 'San Rosendo', 'Santa Bárbara', 'Santa Juana', 'Talcahuano', 'Tirúa',
    'Tomé', 'Tucapel', 'Yumbel',
  ],
};
