// Regiones y comunas de Chile (16 regiones, 346 comunas) — usado por los selects en
// cascada del formulario de cotización. Orden norte→sur; comunas con capital regional
// primero. NOTA: la calculadora del home usa el dataset reducido `comunas.ts` (solo las
// 3 regiones con cobertura de despacho directo); este archivo es el listado completo país.

export interface RegionData {
  nombre: string;
  comunas: string[];
}

export const REGIONES: RegionData[] = [
  {
    nombre: 'Arica y Parinacota',
    comunas: ['Arica', 'Camarones', 'General Lagos', 'Putre'],
  },
  {
    nombre: 'Tarapacá',
    comunas: ['Iquique', 'Alto Hospicio', 'Camiña', 'Colchane', 'Huara', 'Pica', 'Pozo Almonte'],
  },
  {
    nombre: 'Antofagasta',
    comunas: ['Antofagasta', 'Calama', 'María Elena', 'Mejillones', 'Ollagüe', 'San Pedro de Atacama', 'Sierra Gorda', 'Taltal', 'Tocopilla'],
  },
  {
    nombre: 'Atacama',
    comunas: ['Copiapó', 'Alto del Carmen', 'Caldera', 'Chañaral', 'Diego de Almagro', 'Freirina', 'Huasco', 'Tierra Amarilla', 'Vallenar'],
  },
  {
    nombre: 'Coquimbo',
    comunas: ['La Serena', 'Andacollo', 'Canela', 'Combarbalá', 'Coquimbo', 'Illapel', 'La Higuera', 'Los Vilos', 'Monte Patria', 'Ovalle', 'Paihuano', 'Punitaqui', 'Río Hurtado', 'Salamanca', 'Vicuña'],
  },
  {
    nombre: 'Valparaíso',
    comunas: ['Valparaíso', 'Algarrobo', 'Cabildo', 'Calle Larga', 'Cartagena', 'Casablanca', 'Catemu', 'Concón', 'El Quisco', 'El Tabo', 'Hijuelas', 'Isla de Pascua', 'Juan Fernández', 'La Calera', 'La Cruz', 'La Ligua', 'Limache', 'Llaillay', 'Los Andes', 'Nogales', 'Olmué', 'Panquehue', 'Papudo', 'Petorca', 'Puchuncaví', 'Putaendo', 'Quillota', 'Quilpué', 'Quintero', 'Rinconada', 'San Antonio', 'San Esteban', 'San Felipe', 'Santa María', 'Santo Domingo', 'Villa Alemana', 'Viña del Mar', 'Zapallar'],
  },
  {
    nombre: 'Metropolitana de Santiago',
    comunas: ['Santiago', 'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Colina', 'Conchalí', 'Curacaví', 'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba', 'Independencia', 'Isla de Maipo', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Lampa', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'María Pinto', 'Melipilla', 'Ñuñoa', 'Padre Hurtado', 'Paine', 'Pedro Aguirre Cerda', 'Peñaflor', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San José de Maipo', 'San Miguel', 'San Pedro', 'San Ramón', 'Talagante', 'Tiltil', 'Vitacura'],
  },
  {
    nombre: "Libertador General Bernardo O'Higgins",
    comunas: ['Rancagua', 'Chépica', 'Chimbarongo', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'La Estrella', 'Las Cabras', 'Litueche', 'Lolol', 'Machalí', 'Malloa', 'Marchihue', 'Mostazal', 'Nancagua', 'Navidad', 'Olivar', 'Palmilla', 'Paredones', 'Peralillo', 'Peumo', 'Pichidegua', 'Pichilemu', 'Placilla', 'Pumanque', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Fernando', 'San Vicente', 'Santa Cruz'],
  },
  {
    nombre: 'Maule',
    comunas: ['Talca', 'Cauquenes', 'Chanco', 'Colbún', 'Constitución', 'Curepto', 'Curicó', 'Empedrado', 'Hualañé', 'Licantén', 'Linares', 'Longaví', 'Maule', 'Molina', 'Parral', 'Pelarco', 'Pelluhue', 'Pencahue', 'Rauco', 'Retiro', 'Río Claro', 'Romeral', 'Sagrada Familia', 'San Clemente', 'San Javier', 'San Rafael', 'Teno', 'Vichuquén', 'Villa Alegre', 'Yerbas Buenas'],
  },
  {
    nombre: 'Ñuble',
    comunas: ['Chillán', 'Bulnes', 'Chillán Viejo', 'Cobquecura', 'Coelemu', 'Coihueco', 'El Carmen', 'Ninhue', 'Ñiquén', 'Pemuco', 'Pinto', 'Portezuelo', 'Quillón', 'Quirihue', 'Ranquil', 'San Carlos', 'San Fabián', 'San Ignacio', 'San Nicolás', 'Treguaco', 'Yungay'],
  },
  {
    nombre: 'Biobío',
    comunas: ['Concepción', 'Alto Biobío', 'Antuco', 'Arauco', 'Cabrero', 'Cañete', 'Chiguayante', 'Contulmo', 'Coronel', 'Curanilahue', 'Florida', 'Hualpén', 'Hualqui', 'Laja', 'Lebu', 'Los Álamos', 'Los Ángeles', 'Lota', 'Mulchén', 'Nacimiento', 'Negrete', 'Penco', 'Quilaco', 'Quilleco', 'San Pedro de la Paz', 'San Rosendo', 'Santa Bárbara', 'Santa Juana', 'Talcahuano', 'Tirúa', 'Tomé', 'Tucapel', 'Yumbel'],
  },
  {
    nombre: 'La Araucanía',
    comunas: ['Temuco', 'Angol', 'Carahue', 'Cholchol', 'Collipulli', 'Cunco', 'Curacautín', 'Curarrehue', 'Ercilla', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro', 'Loncoche', 'Lonquimay', 'Los Sauces', 'Lumaco', 'Melipeuco', 'Nueva Imperial', 'Padre Las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Purén', 'Renaico', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Traiguén', 'Victoria', 'Vilcún', 'Villarrica'],
  },
  {
    nombre: 'Los Ríos',
    comunas: ['Valdivia', 'Corral', 'Futrono', 'Lago Ranco', 'Lanco', 'La Unión', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'Río Bueno'],
  },
  {
    nombre: 'Los Lagos',
    comunas: ['Puerto Montt', 'Ancud', 'Calbuco', 'Castro', 'Chaitén', 'Chonchi', 'Cochamó', 'Curaco de Vélez', 'Dalcahue', 'Fresia', 'Frutillar', 'Futaleufú', 'Hualaihué', 'Llanquihue', 'Los Muermos', 'Maullín', 'Osorno', 'Palena', 'Puerto Octay', 'Puerto Varas', 'Puqueldón', 'Purranque', 'Puyehue', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Río Negro', 'San Juan de la Costa', 'San Pablo'],
  },
  {
    nombre: 'Aysén del General Carlos Ibáñez del Campo',
    comunas: ['Coyhaique', 'Aysén', 'Chile Chico', 'Cisnes', 'Cochrane', 'Guaitecas', 'Lago Verde', "O'Higgins", 'Río Ibáñez', 'Tortel'],
  },
  {
    nombre: 'Magallanes y de la Antártica Chilena',
    comunas: ['Punta Arenas', 'Antártica', 'Cabo de Hornos', 'Laguna Blanca', 'Natales', 'Porvenir', 'Primavera', 'Río Verde', 'San Gregorio', 'Timaukel', 'Torres del Paine'],
  },
];
