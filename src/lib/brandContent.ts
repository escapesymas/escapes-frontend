/**
 * Texto propio de las páginas de marca que más búsquedas tienen y de las que hay producto de sobra (Planificador de
 * palabras clave de Google, 6/11/2026). Todo sale del catálogo: tipos de producto y modelos que hay en tienda.
 * Reglas de veracidad: nada de «oficial», «originales» ni promesas de homologación; la homologación va en cada ficha,
 * tal y como la informa el fabricante. Los modelos se dejan solo si están en el catálogo (revisar si cambian).
 */
export interface BrandContentLink { label: string; q: string }
export interface BrandContent {
  /** <title> sin el sufijo « | Escapes y Más». */
  title: string;
  h1: string;
  description: string;
  /** Párrafo visible bajo el título. */
  intro: string;
  /** Enlaces a la búsqueda dentro de la marca (?q=). */
  groups: { heading: string; links: BrandContentLink[] }[];
  faqs: { question: string; answer: string }[];
}

const link = (label: string, q: string = label): BrandContentLink => ({ label, q });

export const BRAND_CONTENT: Record<string, BrandContent> = {
  arai: {
    title: 'Casco Arai: RX-7V, Tour-X5, Quantic, MX-V y recambios',
    h1: 'Cascos y recambios Arai',
    description: 'Cascos Arai (RX-7V, Tour-X5, Quantic, MX-V, SZ-R, Concept-XE) y recambios sueltos: viseras, pantallas, interiores y ventilación. Envío gratis desde 200 €.',
    intro: 'Aquí tienes los cascos Arai que hay en la tienda y, aparte, los recambios para cuidarlos o cambiarles piezas: viseras, pantallas, interiores, carrilleras, ventilación, difusores y spoilers. Para una pieza, busca el modelo de tu casco (por ejemplo RX-7V) dentro de la marca. La ficha de cada casco indica la homologación que informa el fabricante.',
    groups: [
      { heading: 'Modelos de casco', links: [link('RX-7V'), link('Tour-X5'), link('Quantic'), link('MX-V'), link('SZ-R'), link('Concept-XE')] },
      { heading: 'Recambios y accesorios', links: [link('Viseras', 'visera'), link('Pantallas', 'pantalla'), link('Interiores', 'interior'), link('Carrilleras'), link('Ventilación'), link('Difusores', 'difusor'), link('Spoilers', 'spoiler')] },
    ],
    faqs: [
      { question: '¿Qué modelos de casco Arai hay en la tienda?', answer: 'Ahora mismo RX-7V, Tour-X5, Quantic, MX-V, SZ-R y Concept-XE, en varias tallas y colores. El stock cambia, así que la disponibilidad real figura en cada ficha.' },
      { question: '¿Se pueden comprar recambios sueltos para un casco Arai?', answer: 'Sí: viseras, pantallas, interiores, carrilleras, piezas de ventilación, difusores y spoilers. La ficha de cada recambio indica los modelos de casco a los que corresponde; si dudas, pregúntanos por el chat antes de comprar.' },
    ],
  },
  rst: {
    title: 'Guantes, chaquetas, pantalones y botas RST para moto',
    h1: 'Guantes y equipación RST',
    description: 'Guantes, chaquetas, pantalones y botas RST para moto, también de mujer. Homologación indicada en la ficha. Precios con IVA y envío gratis desde 200 €.',
    intro: 'Equipación RST para moto: guantes, chaquetas, pantalones, botas y monos, además de ropa casual. Los guantes se pueden elegir por uso (sport, urbano, competición, vintage, touring o adventure) y hay modelos de mujer e impermeables. Cada ficha muestra la talla, el color y la homologación que informa el fabricante.',
    groups: [
      { heading: 'Equipación', links: [link('Guantes'), link('Chaquetas', 'chaqueta'), link('Pantalones', 'pantalón'), link('Botas'), link('Monos', 'mono')] },
      { heading: 'Guantes', links: [link('De mujer', 'mujer'), link('Impermeables', 'impermeable')] },
    ],
    faqs: [
      { question: '¿Qué guantes RST llevan homologación?', answer: 'La ficha de cada guante muestra la homologación que indica el fabricante. En el catálogo actual, la gran mayoría de los guantes RST figuran con homologación CE; compruébalo en el modelo concreto antes de comprar.' },
      { question: '¿Cómo elijo la talla de unos guantes RST?', answer: 'Cada ficha indica la talla disponible. Si estás entre dos tallas o tienes dudas, pregúntanos por el chat antes de pedir.' },
    ],
  },
  sena: {
    title: 'Intercomunicadores Sena para moto: 5S, 10S, 30K, 50S, 60S',
    h1: 'Intercomunicadores Sena',
    description: 'Intercomunicadores Bluetooth y Mesh Sena para casco de moto (5S, 10S, 30K, 50S, 60S, SF2, SF4) y accesorios: altavoces, kits de fijación y cables. Envío gratis desde 200 €.',
    intro: 'Intercomunicadores Sena para hablar con el pasajero u otros motoristas, con modelos Bluetooth y Mesh, sueltos o en pack dual. También hay accesorios (altavoces, kits de fijación al casco, cables) y cascos con intercomunicador. Elige el modelo y comprueba en la ficha qué incluye.',
    groups: [
      { heading: 'Modelos', links: [link('5S'), link('10S'), link('30K'), link('50S'), link('60S'), link('SF2'), link('SF4'), link('Spider ST1', 'Spider')] },
      { heading: 'Accesorios', links: [link('Altavoces', 'altavoz'), link('Kits de fijación', 'kit'), link('Cables', 'cable')] },
    ],
    faqs: [
      { question: '¿Qué es un pack dual?', answer: 'Son dos unidades en la misma caja, pensadas para equipar dos cascos (por ejemplo, el del piloto y el del pasajero).' },
      { question: '¿Qué diferencia hay entre Bluetooth y Mesh?', answer: 'En general, el intercomunicador Bluetooth empareja a pocos interlocutores y el Mesh forma una red con más participantes. Los límites exactos de cada modelo están en su ficha.' },
    ],
  },
  shad: {
    title: 'Baúles, fijaciones y soportes Shad para moto',
    h1: 'Baúles y fijaciones Shad',
    description: 'Baúles, bolsas y respaldos Shad y fijaciones y soportes específicos por modelo de moto. Compatibilidad por marca, modelo y año. Envío gratis desde 200 €.',
    intro: 'La mayor parte de lo que tenemos de Shad son las fijaciones y soportes que permiten montar el baúl o las maletas en tu moto concreta, además de baúles, bolsas, respaldos y kits de montaje. Selecciona tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Baúles', 'baúl'), link('Fijaciones', 'fijaciones'), link('Soportes', 'soporte'), link('Respaldos', 'respaldo'), link('Bolsas', 'bolsa')] },
    ],
    faqs: [
      { question: '¿Cómo sé qué fijación Shad necesito para mi moto?', answer: 'Las fijaciones son específicas por modelo y año. Elige tu moto en el buscador (/escapes) o consulta la tabla de compatibilidad de cada ficha antes de comprar.' },
    ],
  },
  'troy-lee-designs': {
    title: 'Troy Lee Designs: cascos, guantes y equipación de motocross',
    h1: 'Troy Lee Designs: cascos, guantes y ropa de cross',
    description: 'Cascos (SE5, GP), guantes, pantalones, camisetas y protecciones Troy Lee Designs para motocross y enduro. Precios con IVA y envío gratis desde 200 €.',
    intro: 'Equipación Troy Lee Designs para motocross y enduro: cascos, guantes (también infantiles), pantalones, camisetas, sudaderas, petos y protecciones, además de recambios para cascos (viseras, interiores y carrilleras). Cada ficha indica la talla, el color y, en los cascos, la homologación que informa el fabricante.',
    groups: [
      { heading: 'Equipación', links: [link('Cascos', 'casco'), link('Guantes'), link('Pantalones', 'pantalón'), link('Camisetas', 'camiseta'), link('Petos', 'peto')] },
      { heading: 'Recambios de casco', links: [link('Viseras', 'visera'), link('Interiores', 'interior'), link('Carrilleras')] },
    ],
    faqs: [
      { question: '¿Hay guantes Troy Lee Designs para niños?', answer: 'Sí, hay guantes infantiles; la talla de cada modelo figura en su ficha.' },
    ],
  },
  'fly-racing': {
    title: 'Fly Racing: cascos, guantes y equipación de motocross',
    h1: 'Fly Racing: cascos, guantes y ropa de cross',
    description: 'Cascos, guantes, pantalones, camisetas y botas Fly Racing para motocross y enduro. Precios con IVA y envío gratis desde 200 €.',
    intro: 'Equipación Fly Racing para motocross y enduro: pantalones, camisetas, guantes y cascos, además de botas, petos y protecciones. Cada ficha indica la talla y el color y, en los cascos, la homologación que informa el fabricante.',
    groups: [
      { heading: 'Equipación', links: [link('Cascos', 'casco'), link('Guantes'), link('Pantalones', 'pantalón'), link('Camisetas', 'camiseta'), link('Botas')] },
    ],
    faqs: [],
  },
  bell: {
    title: 'Cascos Bell: Moto-9S Flex, MX-9 Mips, TX501, Broozer',
    h1: 'Cascos Bell',
    description: 'Cascos Bell: Moto-9S Flex, MX-9 Mips, MX-9 Adventure, TX501, Broozer y Bullitt, con tallas y colores. Envío gratis desde 200 €.',
    intro: 'Cascos Bell que hay en la tienda: Moto-9S Flex, MX-9 Mips, MX-9 Adventure, TX501, Broozer y Bullitt, con sus tallas y colores. La ficha de cada casco indica la homologación que informa el fabricante.',
    groups: [
      { heading: 'Modelos', links: [link('Moto-9S Flex', 'Moto-9S'), link('MX-9 Mips'), link('MX-9 Adventure'), link('TX501'), link('Broozer'), link('Bullitt')] },
    ],
    faqs: [],
  },
  pinlock: {
    title: 'Pantallas Pinlock antivaho para casco de moto',
    h1: 'Pantallas Pinlock',
    description: 'Lentes antivaho Pinlock para pantallas de casco de moto. Compatibilidad según el modelo de casco indicado en cada ficha. Envío gratis desde 200 €.',
    intro: 'Lentes antivaho Pinlock que se instalan en la pantalla del casco. Cada ficha indica los modelos de casco con los que es compatible; comprueba el tuyo antes de pedir.',
    groups: [],
    faqs: [],
  },
  polini: {
    title: 'Polini: variadores, rodillos, kits de cilindro, escapes y más',
    h1: 'Recambios Polini para moto y scooter',
    description: 'Polini: variadores, rodillos, correas, embragues, kits, pistones, carburadores, escapes y colectores. Compatibilidad por modelo. Envío gratis desde 200 €.',
    intro: 'Recambios Polini para moto y scooter: transmisión (variadores, rodillos, correas, embragues, campanas, muelles) y motor (kits, pistones, carburadores, escapes, colectores, filtros y centralitas). Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Transmisión', links: [link('Variadores', 'variador'), link('Rodillos'), link('Correas', 'correa'), link('Embragues', 'embrague')] },
      { heading: 'Motor y escape', links: [link('Kits', 'kit'), link('Pistones', 'pistón'), link('Carburadores', 'carburador'), link('Escapes', 'escape'), link('Colectores', 'colector'), link('Filtros', 'filtro')] },
    ],
    faqs: [],
  },
  malossi: {
    title: 'Malossi: variadores, rodillos, embragues, kits y más',
    h1: 'Recambios Malossi para moto y scooter',
    description: 'Malossi: variadores, rodillos, embragues, correas, kits, centralitas, cigüeñales y cilindros. Compatibilidad por modelo. Envío gratis desde 200 €.',
    intro: 'Recambios Malossi para moto y scooter: variadores, rodillos, embragues, correas y muelles, además de kits, centralitas, cigüeñales y cilindros. Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Variadores', 'variador'), link('Rodillos'), link('Embragues', 'embrague'), link('Correas', 'correa'), link('Kits', 'kit'), link('Centralitas', 'centralita')] },
    ],
    faqs: [],
  },
  ufo: {
    title: 'UFO: guardabarros, kits de plásticos, paneles y portanúmeros',
    h1: 'Plásticos y accesorios UFO',
    description: 'UFO: guardabarros, kits de plásticos, paneles, portanúmeros, protectores, guiacadenas y paramanos para modelos concretos de moto. Envío gratis desde 200 €.',
    intro: 'Plásticos y accesorios UFO para modelos concretos de moto: guardabarros, kits de plásticos, paneles, portanúmeros, protectores, guiacadenas, patines y paramanos. Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Guardabarros'), link('Kits', 'kit'), link('Paneles', 'paneles'), link('Portanúmeros'), link('Protectores', 'protector'), link('Guiacadenas'), link('Paramanos')] },
    ],
    faqs: [],
  },
  polisport: {
    title: 'Polisport: protectores, paramanos, guardabarros y kits de plásticos',
    h1: 'Plásticos y protecciones Polisport',
    description: 'Polisport: protectores, paramanos, guardabarros, aletines, paneles y kits de plásticos para modelos concretos de moto. Envío gratis desde 200 €.',
    intro: 'Protectores, paramanos, guardabarros, aletines, paneles y kits de plásticos Polisport para modelos concretos de moto. Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Protectores', 'protector'), link('Paramanos'), link('Guardabarros'), link('Aletines'), link('Kits', 'kit'), link('Paneles', 'paneles')] },
    ],
    faqs: [],
  },
  'r-g-racing': {
    title: 'R&G Racing: protectores, portamatrículas, cubrecárter y diábolos',
    h1: 'Protectores y accesorios R&G Racing',
    description: 'R&G Racing: protectores de moto, portamatrículas, cubrecárter y diábolos para modelos concretos de moto. Envío gratis desde 200 €.',
    intro: 'Protectores, portamatrículas, cubrecárter y diábolos R&G Racing para modelos concretos de moto. Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Protectores', 'protector'), link('Portamatrículas'), link('Cubrecárter'), link('Diábolos')] },
    ],
    faqs: [],
  },
  athena: {
    title: 'Athena: kits, juntas y filtros para moto y scooter',
    h1: 'Recambios Athena para moto y scooter',
    description: 'Athena: kits, juntas y filtros para moto y scooter. Compatibilidad por modelo y año. Envío gratis desde 200 €.',
    intro: 'Recambios Athena para moto y scooter: kits, juntas y filtros. Elige tu moto para ver solo lo compatible con tu modelo y año.',
    groups: [
      { heading: 'Qué buscas', links: [link('Kits', 'kit'), link('Juntas', 'junta'), link('Filtros', 'filtro')] },
    ],
    faqs: [],
  },
};

export const getBrandContent = (slug: string): BrandContent | undefined => BRAND_CONTENT[slug];
