export interface TestimonioVideo {
  src: string;        // ruta del video vertical (9:16) en public/videos/testimonios/
  name: string;       // nombre del cliente
  location?: string;  // ciudad (opcional)
  blurb: string;      // descripción corta (tomada del copy de Instagram)
}

// Testimonios reales en video (publicados en @duchasegura_). Verticales 9:16.
// Nota: el testimonio de la Sra. Lidia se usa en la sección "¿Cómo lo hacemos?".
const DIR = '/videos/testimonios';
export const TESTIMONIOS_VIDEO: TestimonioVideo[] = [
  { src: `${DIR}/testimonio-arturo-salah.mp4`,        name: 'Arturo Salah',        blurb: 'Un cliente que se preocupa por su seguridad y la de los suyos.' },
  { src: `${DIR}/testimonio-marta.mp4`,               name: 'Marta',               blurb: 'El rebaje de tina que tanto se merecía.' },
  { src: `${DIR}/testimonio-fernando-gonzalez.mp4`,   name: 'Fernando González',   blurb: 'Decidió cuidar su seguridad antes de cualquier accidente.' },
  { src: `${DIR}/testimonio-sra-edita-concepcion.mp4`,name: 'Sra. Edita', location: 'Concepción', blurb: 'Fiel seguidora que nos recibió en su hogar.' },
  { src: `${DIR}/testimonio-sra-loreto.mp4`,          name: 'Sra. Loreto',         blurb: 'Sabiamente decidió mejorar su ducha a tiempo.' },
  { src: `${DIR}/testimonio-sra-luisa.mp4`,           name: 'Sra. Luisa y su hija',blurb: 'Una decisión sabia: no más caídas en el baño.' },
  { src: `${DIR}/testimonio-sra-felisa.mp4`,          name: 'Sra. Felisa',         blurb: 'Decidió prevenir accidentes en el baño.' },
  { src: `${DIR}/testimonio-sra-mireya-osorio.mp4`,   name: 'Sra. Mireya Osorio',  blurb: 'Tranquilidad para ella y toda su familia.' },
  { src: `${DIR}/testimonio-diego.mp4`,               name: 'Diego',               blurb: 'Un nieto que se preocupó por la seguridad de sus abuelos.' },
  { src: `${DIR}/testimonio-catalina-y-emmanuel.mp4`, name: 'Catalina y Emmanuel', blurb: 'Una ducha llena de amor: nos recibieron en su casa.' },
  { src: `${DIR}/testimonio-nora-y-fernando.mp4`,     name: 'Nora y Fernando',     blurb: 'La historia de un hermoso matrimonio, en terreno.' },
  { src: `${DIR}/testimonio-sra-blanca-coronel.mp4`,  name: 'Sra. Blanca', location: 'Coronel', blurb: 'Un gran paso para nuestra querida clienta de Coronel.' },
  { src: `${DIR}/testimonio-ximena-y-mariana.mp4`,    name: 'Ximena y Mariana',    blurb: 'Una familia feliz y, sobre todo, más segura.' },
  { src: `${DIR}/testimonio-clienta-feliz.mp4`,       name: 'Clienta feliz',       blurb: 'Las palabras de agradecimiento de una clienta feliz.' },
];
