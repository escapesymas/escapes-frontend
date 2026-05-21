export interface MegaMenuSubItem {
  label: string;
  category?: string;
  view?: string;
}

export interface MegaMenuGroup {
  title: string;
  items: MegaMenuSubItem[];
}

export interface MegaMenuItem {
  label: string;
  view: string;
  category?: string;
  highlight?: boolean;
  icon?: string;
  groups?: MegaMenuGroup[]; // columnas del mega menú
  hasImage?: boolean;
}

export const MEGA_MENU: MegaMenuItem[] = [
  {
    label: 'Técnico',
    view: 'catalog',
    category: 'tecnico',
    groups: [
      {
        title: 'Escapes',
        items: [
          { label: 'Bufandas de escape', category: 'escapes' },
          { label: 'Sistemas completos de escape', category: 'linea-completa' },
          { label: 'Silenciadores', category: 'silenciadores' },
          { label: 'Silenciadores universales', category: 'silenciadores' },
          { label: 'Colectores de escape', category: 'colectores' },
          { label: 'Recambios y accesorios de escape', category: 'accesorios-escape' },
          { label: 'Protectores de colector de escape', category: 'accesorios-escape' },
          { label: 'Tapones para silenciador', category: 'accesorios-escape' },
          { label: 'Tubos de conexión de escape', category: 'accesorios-escape' },
        ],
      },
      {
        title: 'Frenos',
        items: [
          { label: 'Bombas de freno', category: 'bombas-radiales' },
          { label: 'Manetas de freno', category: 'frenos' },
          { label: 'Manetas completas de freno', category: 'frenos' },
          { label: 'Pastillas de freno', category: 'pastillas-sinterizadas' },
          { label: 'Discos de freno', category: 'discos-freno' },
          { label: 'Pinzas de freno', category: 'frenos' },
          { label: 'Latiguillos de freno', category: 'latiguillos-metalicos' },
          { label: 'Pedales de freno', category: 'frenos' },
          { label: 'Kits de reparación de pinza de freno', category: 'frenos' },
        ],
      },
      {
        title: 'Parte eléctrica',
        items: [
          { label: 'Baterías', category: 'baterias-litio' },
          { label: 'Cargadores y arrancadores de batería', category: 'electronica' },
          { label: 'Bujías', category: 'electronica' },
          { label: 'Lámparas', category: 'electronica' },
          { label: 'Tomas de encendedor y USB', category: 'electronica' },
          { label: 'Arranque', category: 'electronica' },
          { label: 'Estátores', category: 'electronica' },
          { label: 'Reguladores', category: 'electronica' },
          { label: 'Centralitas (ECU / ECM / CDI)', category: 'centralitas' },
        ],
      },
      {
        title: 'Transmisión',
        items: [
          { label: 'Kits de cadena', category: 'kits-cadena' },
          { label: 'Cadenas', category: 'cadenas-arrastre' },
          { label: 'Rodillos de variador para scooter', category: 'transmision' },
          { label: 'Variadores para scooter', category: 'transmision' },
          { label: 'Piñones', category: 'pinones' },
          { label: 'Coronas', category: 'coronas' },
          { label: 'Correas de transmisión', category: 'transmision' },
          { label: 'Muelles de embrague', category: 'transmision' },
          { label: 'Enganches de cadena', category: 'transmision' },
        ],
      },
      {
        title: 'Motor',
        items: [
          { label: 'Kits de cilindro', category: 'motor' },
          { label: 'Pistones', category: 'motor' },
          { label: 'Filtros de aceite', category: 'filtros-aceite' },
          { label: 'Ejes de biela', category: 'motor' },
          { label: 'Distribución', category: 'motor' },
          { label: 'Refrigeración', category: 'motor' },
          { label: 'Juntas y retenes de motor', category: 'motor' },
          { label: 'Pastillas de reglaje', category: 'motor' },
          { label: 'Variadores', category: 'motor' },
        ],
      },
      {
        title: 'Admisión y embrague',
        items: [
          { label: 'Embragues completo', category: 'motor' },
          { label: 'Filtros de aire', category: 'filtros-aire' },
          { label: 'Macarrones, filtros y racores de gasolina', category: 'motor' },
          { label: 'Bombas de embrague', category: 'motor' },
          { label: 'Admisión', category: 'motor' },
          { label: 'Kits de discos de embrague', category: 'motor' },
          { label: 'Kits de separadores de embrague', category: 'motor' },
          { label: 'Carburadores Keihin', category: 'motor' },
          { label: 'Carburadores Mikuni', category: 'motor' },
        ],
      },
      {
        title: 'Ruedas',
        items: [
          { label: 'Neumáticos', category: 'neumaticos-slick' },
          { label: 'Llantas', category: 'neumaticos' },
          { label: 'Ruedas completas', category: 'neumaticos' },
          { label: 'Juegos de radios', category: 'neumaticos' },
          { label: 'Cámaras', category: 'neumaticos' },
          { label: 'Rodamientos de rueda', category: 'neumaticos' },
          { label: 'Bujes de rueda', category: 'neumaticos' },
        ],
      },
      {
        title: 'Amortiguación',
        items: [
          { label: 'Amortiguadores', category: 'amortiguadores-traseros' },
          { label: 'Horquilla', category: 'cartuchos-horquilla' },
          { label: 'Retenes de horquilla', category: 'suspensiones' },
          { label: 'Tubos de horquilla', category: 'suspensiones' },
          { label: 'Kits de retenes de horquilla', category: 'suspensiones' },
          { label: 'Kits de reparación de horquilla', category: 'suspensiones' },
          { label: 'Kits de reparación de amortiguador', category: 'suspensiones' },
          { label: 'Casquillos de fricción', category: 'suspensiones' },
          { label: 'Kits de rodamientos de amortiguador', category: 'suspensiones' },
        ],
      },
    ],
  },
  {
    label: 'Equipación',
    view: 'catalog',
    category: 'equipacion',
    groups: [
      {
        title: 'Monos',
        items: [
          { label: 'Monos', category: 'monos' },
          { label: 'Mono con Airbag', category: 'monos' },
          { label: 'Deslizaderas', category: 'equipacion' },
        ],
      },
      {
        title: 'Chaquetas y Camisetas',
        items: [
          { label: 'Chaquetas de cuero', category: 'chaquetas-moto' },
          { label: 'Chaquetas textiles', category: 'chaquetas-moto' },
          { label: 'Chaquetas de Enduro', category: 'chaquetas-moto' },
          { label: 'Camisetas', category: 'equipacion' },
          { label: 'Espalderas', category: 'equipacion' },
          { label: 'Chaqueta con Airbag', category: 'equipacion' },
        ],
      },
      {
        title: 'Pantalones',
        items: [
          { label: 'Pantalones de cuero', category: 'equipacion' },
          { label: 'Pantalones textiles', category: 'equipacion' },
          { label: 'Vaqueros', category: 'equipacion' },
          { label: 'Pantalones MX', category: 'equipacion' },
        ],
      },
      {
        title: 'Guantes',
        items: [
          { label: 'Guantes de cuero', category: 'guantes-competicion' },
          { label: 'Guantes textiles', category: 'guantes-competicion' },
          { label: 'Guantes Off-Road', category: 'guantes-competicion' },
        ],
      },
      {
        title: 'Botas y Calzado',
        items: [
          { label: 'Botas de competición', category: 'botas-racing' },
          { label: 'Botas Touring', category: 'botas-racing' },
          { label: 'Zapatos casual', category: 'equipacion' },
          { label: 'Botas Off-Road', category: 'botas-racing' },
        ],
      },
      {
        title: 'Protección',
        items: [
          { label: 'Espalderas', category: 'equipacion' },
          { label: 'Petos integrales', category: 'equipacion' },
          { label: 'Petos', category: 'equipacion' },
          { label: 'Coderas', category: 'equipacion' },
          { label: 'Rodilleras', category: 'equipacion' },
          { label: 'Pantalones cortos con protecciones', category: 'equipacion' },
        ],
      },
      {
        title: 'Gafas',
        items: [
          { label: 'Gafas MX / Enduro', category: 'equipacion' },
          { label: 'Accesorios para gafas', category: 'equipacion' },
          { label: 'Gafas de sol', category: 'equipacion' },
        ],
      },
      {
        title: 'Equipamiento mujer',
        items: [
          { label: 'Monos mujer', category: 'equipacion' },
          { label: 'Chaquetas de cuero mujer', category: 'equipacion' },
          { label: 'Chaquetas textiles mujer', category: 'equipacion' },
          { label: 'Pantalones textiles mujer', category: 'equipacion' },
          { label: 'Vaqueros mujer', category: 'equipacion' },
          { label: 'Guantes de cuero mujer', category: 'equipacion' },
          { label: 'Botas racing mujer', category: 'equipacion' },
        ],
      },
    ],
  },
  {
    label: 'Cascos',
    view: 'catalog',
    category: 'cascos',
    groups: [
      {
        title: 'Tipos de casco',
        items: [
          { label: 'Cascos Integrales', category: 'cascos-integrales' },
          { label: 'Cascos Trail', category: 'cascos' },
          { label: 'Cascos Modulares', category: 'cascos-modulares' },
          { label: 'Cascos Vintage', category: 'cascos' },
          { label: 'Cascos Jet / Urban', category: 'cascos-jet' },
          { label: 'Cascos Off-Road', category: 'cascos-off-road' },
          { label: 'Cascos Junior', category: 'cascos' },
        ],
      },
      {
        title: 'Accesorios para cascos',
        items: [
          { label: 'Pinlock', category: 'cascos' },
          { label: 'Pantallas burbuja', category: 'cascos' },
          { label: 'Gafas MX / Enduro', category: 'equipacion' },
          { label: 'Viseras', category: 'cascos' },
          { label: 'Almohadillas interiores', category: 'cascos' },
          { label: 'Recambios para cascos', category: 'cascos' },
        ],
      },
    ],
  },
  {
    label: 'Accesorios',
    view: 'catalog',
    category: 'accesorios',
    groups: [
      {
        title: 'Manillares',
        items: [
          { label: 'Manillares estándar', category: 'accesorios' },
          { label: 'Semimanillares', category: 'accesorios' },
          { label: 'Barra transversal', category: 'accesorios' },
          { label: 'Protectores / Morcillas de manillar', category: 'accesorios' },
          { label: 'Puños', category: 'accesorios' },
          { label: 'Puños calefactables', category: 'accesorios' },
          { label: 'Contrapesos de manillar', category: 'accesorios' },
          { label: 'Torretas de manillar', category: 'accesorios' },
        ],
      },
      {
        title: 'Controles',
        items: [
          { label: 'Manetas de embrague', category: 'accesorios' },
          { label: 'Manetas completas de embrague', category: 'accesorios' },
          { label: 'Manetas de freno', category: 'frenos' },
          { label: 'Manetas completas de freno', category: 'frenos' },
          { label: 'Manetas de freno y embrague', category: 'accesorios' },
          { label: 'Interruptores y botoneras', category: 'accesorios' },
          { label: 'Estriberas y reposapiés', category: 'accesorios' },
          { label: 'Pedales de cambio', category: 'accesorios' },
          { label: 'Pedales de freno', category: 'frenos' },
        ],
      },
      {
        title: 'Protección del vehículo',
        items: [
          { label: 'Protectores de radiador', category: 'accesorios' },
          { label: 'Protectores para tapas de motor', category: 'accesorios' },
          { label: 'Protectores de carenado', category: 'accesorios' },
          { label: 'Protectores de motor deslizantes', category: 'accesorios' },
          { label: 'Defensas', category: 'accesorios' },
          { label: 'Paranamos', category: 'accesorios' },
          { label: 'Protectores de horquilla', category: 'accesorios' },
          { label: 'Protectores de basculante', category: 'accesorios' },
        ],
      },
      {
        title: 'Iluminación y señalización',
        items: [
          { label: 'Faros delanteros tipo OEM', category: 'electronica' },
          { label: 'Faros delanteros universales', category: 'electronica' },
          { label: 'Pilotos traseros tipo OEM', category: 'electronica' },
          { label: 'Pilotos traseros universales', category: 'electronica' },
          { label: 'Iluminación auxiliar', category: 'electronica' },
          { label: 'Luces de matrícula', category: 'electronica' },
          { label: 'Intermitentes tipo OEM', category: 'electronica' },
          { label: 'Intermitentes universales', category: 'electronica' },
        ],
      },
      {
        title: 'Personalización',
        items: [
          { label: 'Silenciadores', category: 'silenciadores' },
          { label: 'Sistemas completos de escape', category: 'linea-completa' },
          { label: 'Soportes portamatrículas', category: 'accesorios' },
          { label: 'Retrovisores universales', category: 'personalizacion-espejos' },
          { label: 'Pantallas y parabrisas', category: 'accesorios' },
          { label: 'Estriberas retrasadas', category: 'accesorios' },
          { label: 'Kits de adhesivos', category: 'accesorios' },
        ],
      },
      {
        title: 'Equipaje y movilidad',
        items: [
          { label: 'Soportes para smartphone QUAD LOCK', category: 'soportes-quad-lock' },
          { label: 'Baúles y maletas laterales', category: 'maletas-baules' },
          { label: 'Bolsas traseras y alforjas', category: 'accesorios' },
          { label: 'Bolsas sobredepósito', category: 'accesorios' },
          { label: 'Baúles para ATV', category: 'accesorios' },
          { label: 'Fijaciones', category: 'accesorios' },
          { label: 'Intercomunicadores', category: 'intercomunicadores' },
          { label: 'Tomas de encendedor y USB', category: 'electronica' },
        ],
      },
      {
        title: 'MX y Enduro',
        items: [
          { label: 'Accesorios PFX', category: 'accesorios' },
          { label: 'Kits de plástica', category: 'accesorios' },
          { label: 'Tijas', category: 'accesorios' },
          { label: 'Pernos y tornillería rápida', category: 'accesorios' },
          { label: 'Carreras sobre arena', category: 'accesorios' },
          { label: 'Ruedas completas', category: 'neumaticos' },
          { label: 'Cubrecárteres', category: 'accesorios' },
          { label: 'Cuentahoras', category: 'accesorios' },
        ],
      },
      {
        title: 'Transporte y paddock',
        items: [
          { label: 'Fundas de protección', category: 'neumaticos' },
          { label: 'Caballetes de paddock', category: 'neumaticos' },
          { label: 'Rampas y transporte', category: 'neumaticos' },
          { label: 'Garrafas de combustible', category: 'neumaticos' },
          { label: 'Calentadores de neumáticos', category: 'neumaticos' },
          { label: 'Carpas', category: 'neumaticos' },
          { label: 'Candados y antirrobos', category: 'accesorios' },
          { label: 'Alfombras de paddock', category: 'neumaticos' },
        ],
      },
    ],
  },
  {
    label: 'Herramientas',
    view: 'catalog',
    category: 'herramientas',
    groups: [
      {
        title: 'Herramientas manuales',
        items: [
          { label: 'Destornilladores', category: 'herramientas' },
          { label: 'Llaves combinadas', category: 'herramientas' },
          { label: 'Llaves de vaso', category: 'herramientas' },
          { label: 'Llaves dinamométricas', category: 'herramientas' },
          { label: 'Alicates', category: 'herramientas' },
          { label: 'Medición', category: 'herramientas' },
          { label: 'Juegos de llaves Allen / Torx', category: 'herramientas' },
          { label: 'Llaves de mango en T / Y', category: 'herramientas' },
        ],
      },
      {
        title: 'Parte eléctrica',
        items: [
          { label: 'Conectores', category: 'herramientas' },
          { label: 'Lámparas de mano', category: 'herramientas' },
          { label: 'Enrolladores de manguera', category: 'herramientas' },
          { label: 'Equipos de medición', category: 'herramientas' },
          { label: 'Instaladores', category: 'herramientas' },
          { label: 'Alicates', category: 'herramientas' },
          { label: 'Testers de batería', category: 'herramientas' },
        ],
      },
      {
        title: 'Chasis',
        items: [
          { label: 'Herramientas de dirección y basculante', category: 'herramientas' },
          { label: 'Matrículas', category: 'herramientas' },
          { label: 'Reparación de neumáticos y ruedas', category: 'herramientas' },
          { label: 'Suspensiones', category: 'herramientas' },
        ],
      },
      {
        title: 'Herramientas específicas',
        items: [
          { label: 'Extractores', category: 'herramientas' },
          { label: 'Extractores de volante magnético', category: 'herramientas' },
          { label: 'Llaves de bujía', category: 'herramientas' },
          { label: 'Llaves para filtros de aceite', category: 'herramientas' },
          { label: 'Diagnosis', category: 'herramientas' },
          { label: 'Embrague', category: 'herramientas' },
          { label: 'Estanqueidad y diagnóstico del motor', category: 'herramientas' },
          { label: 'Metrología', category: 'herramientas' },
        ],
      },
      {
        title: 'Equipamiento taller',
        items: [
          { label: 'Compresores', category: 'herramientas' },
          { label: 'Equilibradoras de rueda', category: 'herramientas' },
          { label: 'Extracción de gases', category: 'herramientas' },
          { label: 'Lavadoras de piezas', category: 'herramientas' },
          { label: 'Desmontadores de neumáticos', category: 'herramientas' },
          { label: 'Equipamiento taller', category: 'herramientas' },
          { label: 'Carros de herramientas', category: 'herramientas' },
          { label: 'Elevadores', category: 'herramientas' },
        ],
      },
      {
        title: 'Limpieza y mantenimiento',
        items: [
          { label: 'Limpieza y Mantenimiento', category: 'mantenimiento' },
          { label: 'Limpiadores y toallitas multiusos', category: 'mantenimiento' },
          { label: 'Limpiadores de cadenas', category: 'mantenimiento' },
          { label: 'Limpiadores de filtros', category: 'mantenimiento' },
          { label: 'Limpia llantas', category: 'mantenimiento' },
          { label: 'Limpia frenos', category: 'mantenimiento' },
          { label: 'Pulido y abrillantado', category: 'mantenimiento' },
          { label: 'Desengrasantes', category: 'mantenimiento' },
        ],
      },
      {
        title: 'Transporte y equipaje',
        items: [
          { label: 'Candados', category: 'accesorios' },
          { label: 'Caballetes laterales', category: 'neumaticos' },
          { label: 'Eslingas', category: 'neumaticos' },
          { label: 'Fundas de protección', category: 'neumaticos' },
          { label: 'Elevadores y caballetes', category: 'neumaticos' },
          { label: 'Rampas', category: 'neumaticos' },
          { label: 'Eslingas', category: 'neumaticos' },
        ],
      },
      {
        title: 'Aceites y lubricantes',
        items: [
          { label: 'Aceite de motor', category: 'mantenimiento' },
          { label: 'Aceite de transmisión', category: 'mantenimiento' },
          { label: 'Aceite de amortiguador', category: 'mantenimiento' },
          { label: 'Aceite de horquilla', category: 'mantenimiento' },
          { label: 'Lubricante para cadenas', category: 'mantenimiento' },
          { label: 'Lubricante para filtros', category: 'mantenimiento' },
          { label: 'Líquido de frenos y embrague', category: 'mantenimiento' },
        ],
      },
    ],
  },
  { label: 'THE PIT LANE', view: 'social' },
  { label: 'PADDOCK', view: 'forum', highlight: true },
  { label: 'Contacto', view: 'contact' },
];
