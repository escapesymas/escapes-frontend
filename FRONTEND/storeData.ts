
import { ShieldCheck, Truck, Trophy, CheckCircle2 } from 'lucide-react';

// CONFIGURACIÓN DE PAGOS (SUMUP)
export const PAYMENT_CONFIG = {
  provider: 'sumup',
  merchantEmail: 'info@escapesymas.com'
};

// CONFIGURACIÓN GENERAL DE LA TIENDA
export const STORE_CONFIG = {
  name: "Escapes y Más",
  logoUrl: "/logo-cabecera.svg",
  defaultProductImage: "https://placehold.co/800x800/18181b/f97316?text=ESCAPES+Y+MAS",
  currency: "EUR",
  contactEmail: "info@escapesymas.com",
  heroTitle: "Equipamiento Pro",
  heroSubtitle: "Para Pilotos Exigentes",
  heroImage: "/hero.avif"
};

// CARACTERÍSTICAS DESTACADAS (TRUST SIGNALS)
export const FEATURES = [
  { icon: CheckCircle2, title: "100% Original", desc: "Material auténtico. Cero imitaciones." },
  { icon: ShieldCheck, title: "Garantía Oficial", desc: "Cobertura directa del fabricante." },
  { icon: Truck, title: "Envío 24/48h", desc: "Despacho rápido desde almacén." },
  { icon: Trophy, title: "Solo Top Brands", desc: "Akrapovič, Brembo, Öhlins..." },
];

/**
 * NAVEGACIÓN PRINCIPAL
 */
export const NAV_LINKS: { label: string; view: string; category?: string; highlight?: boolean }[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Para tu moto', view: 'catalog' },
  { label: 'Categorías', view: 'categories' },
  { label: 'THE PIT LANE', view: 'social' },
  { label: 'PADDOCK', view: 'forum', highlight: true },
  { label: 'Garantías', view: 'warranty' },
  { label: 'Contacto', view: 'contact' },
];

/**
 * CATEGORÍAS DEL CATÁLOGO REORGANIZADAS
 */
export const CATEGORIES = [
  {
    id: 1,
    name: "Sistemas de Escape",
    slug: "escapes",
    image: "https://images.unsplash.com/photo-1532588237936-a14a3818bc79?auto=format&fit=crop&q=80&w=800",
    description: "Silenciosos, colectores y líneas completas de alto rendimiento.",
    subcategories: ["Línea Completa (Racing)", "Slip-On (Silenciosos)", "Colectores", "Accesorios Escape"]
  },
  {
    id: 2,
    name: "Frenos de Competición",
    slug: "frenos",
    image: "https://images.unsplash.com/photo-1563618147570-36034c4f0282?auto=format&fit=crop&q=80&w=800",
    description: "Máxima potencia y control: bombas radiales, discos y pastillas.",
    subcategories: ["Pastillas Sinterizadas", "Discos de Freno", "Bombas Radiales", "Latiguillos Metálicos"]
  },
  {
    id: 3,
    name: "Ciclista & Chasis",
    slug: "suspensiones",
    image: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800",
    description: "Estabilidad extrema con suspensiones Pro y componentes de chasis.",
    subcategories: ["Amortiguadores traseros", "Cartuchos Horquilla", "Amortiguadores Dirección", "Estriberas"]
  },
  {
    id: 4,
    name: "Electrónica & ECU",
    slug: "electronica",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
    description: "Gestión de motor, Quickshifters y telemetría de competición.",
    subcategories: ["Centralitas (ECU)", "Quickshifters", "Módulos ABS/TC", "Baterías Litio"]
  },
  {
    id: 5,
    name: "Transmisión & Desarrollo",
    slug: "transmision",
    image: "https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800",
    description: "Kits de arrastre reforzados, piñones y coronas aligeradas.",
    subcategories: ["Kits Cadena Completos", "Cadenas X-Ring/Z-Ring", "Piñones", "Coronas Ergal"]
  },
  {
    id: 6,
    name: "Mantenimiento & Fluidos",
    slug: "mantenimiento",
    image: "https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=800",
    description: "Filtros de alto flujo y lubricantes de máxima protección.",
    subcategories: ["Filtros Aire Racing", "Filtros Aceite", "Aceites Motor Pro", "Líquidos Hidráulicos"]
  },
  {
    id: 7,
    name: "Neumáticos & Paddock",
    slug: "neumaticos",
    image: "https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=800",
    description: "Gomas de alto agarre, calentadores y equipamiento de garaje.",
    subcategories: ["Neumáticos Slick/Sport", "Calentadores", "Caballetes", "Manómetros & Accesorios"]
  },
  {
    id: 8,
    name: "Cascos",
    slug: "cascos",
    image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800",
    description: "Cascos integrales, modulares, jet y off-road de las mejores marcas.",
    subcategories: ["Cascos Integrales", "Cascos Modulares", "Cascos Jet", "Cascos Off-Road"]
  },
  {
    id: 9,
    name: "Equipación Piloto",
    slug: "equipacion",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    description: "Monos de competición, chaquetas, guantes, botas y protecciones.",
    subcategories: ["Chaquetas Moto", "Monos", "Guantes de Competición", "Botas Racing"]
  },
  {
    id: 10,
    name: "Accesorios & Maletas",
    slug: "accesorios",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
    description: "Sistemas de equipaje, soportes Quad Lock, intercomunicadores y cúpulas.",
    subcategories: ["Maletas & Baúles", "Soportes Quad Lock", "Intercomunicadores", "Personalización & Espejos"]
  }
];

/**
 * DIMENSIONES DE NEUMÁTICOS
 */
export const TIRE_WIDTHS = ["80", "90", "100", "110", "120", "130", "140", "150", "160", "170", "180", "190", "200", "240"];
export const TIRE_PROFILES = ["30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "90", "100"];
export const TIRE_RIMS = ['12', '13', '14', '15', '16', '17', '18', '19', '21'];
export const TIRE_CATEGORY_ID = 296;

// Obsolete static bike data removed. Use services/apiService.ts functions instead.

/**
 * ESTRATEGIA DE MARKETING Y NIVELES DE CLIENTE
 */
export const MARKETING_TIERS = {
  BRONCE: {
    min: 0,
    max: 149,
    discount: 0,
    shipping: 15,
    label: "Bronce"
  },
  PLATA: {
    min: 150,
    max: 299,
    discount: 5,
    shipping: 0,
    label: "Plata"
  },
  ORO: {
    min: 300,
    max: 499,
    discount: 10,
    shipping: 0,
    label: "Oro"
  },
  PLATINO: {
    min: 500,
    max: Infinity,
    discount: 15,
    shipping: 0,
    label: "Platino"
  }
};

export const FLAT_CATEGORIES: Record<string, { id: number; name: string; slug: string; parentId?: number }> = {
  "1": { id: 1, name: "Sistemas de Escape", slug: "escapes" },
  "escapes": { id: 1, name: "Sistemas de Escape", slug: "escapes" },
  "2": { id: 2, name: "Frenos de Competición", slug: "frenos" },
  "frenos": { id: 2, name: "Frenos de Competición", slug: "frenos" },
  "3": { id: 3, name: "Ciclista & Chasis", slug: "suspensiones" },
  "suspensiones": { id: 3, name: "Ciclista & Chasis", slug: "suspensiones" },
  "4": { id: 4, name: "Electrónica & ECU", slug: "electronica" },
  "electronica": { id: 4, name: "Electrónica & ECU", slug: "electronica" },
  "5": { id: 5, name: "Transmisión & Desarrollo", slug: "transmision" },
  "transmision": { id: 5, name: "Transmisión & Desarrollo", slug: "transmision" },
  "6": { id: 6, name: "Mantenimiento & Fluidos", slug: "mantenimiento" },
  "mantenimiento": { id: 6, name: "Mantenimiento & Fluidos", slug: "mantenimiento" },
  "7": { id: 7, name: "Neumáticos & Paddock", slug: "neumaticos" },
  "neumaticos": { id: 7, name: "Neumáticos & Paddock", slug: "neumaticos" },
  "8": { id: 8, name: "Cascos", slug: "cascos" },
  "cascos": { id: 8, name: "Cascos", slug: "cascos" },
  "9": { id: 9, name: "Equipación Piloto", slug: "equipacion" },
  "equipacion": { id: 9, name: "Equipación Piloto", slug: "equipacion" },
  "10": { id: 10, name: "Accesorios & Maletas", slug: "accesorios" },
  "accesorios": { id: 10, name: "Accesorios & Maletas", slug: "accesorios" },

  "101": { id: 101, name: "Línea Completa (Racing)", slug: "linea-completa", parentId: 1 },
  "linea-completa": { id: 101, name: "Línea Completa (Racing)", slug: "linea-completa", parentId: 1 },
  "102": { id: 102, name: "Slip-On (Silenciosos)", slug: "silenciadores", parentId: 1 },
  "silenciadores": { id: 102, name: "Slip-On (Silenciosos)", slug: "silenciadores", parentId: 1 },
  "103": { id: 103, name: "Colectores", slug: "colectores", parentId: 1 },
  "colectores": { id: 103, name: "Colectores", slug: "colectores", parentId: 1 },
  "104": { id: 104, name: "Accesorios Escape", slug: "accesorios-escape", parentId: 1 },
  "accesorios-escape": { id: 104, name: "Accesorios Escape", slug: "accesorios-escape", parentId: 1 },

  "201": { id: 201, name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas", parentId: 2 },
  "pastillas-sinterizadas": { id: 201, name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas", parentId: 2 },
  "202": { id: 202, name: "Discos de Freno", slug: "discos-freno", parentId: 2 },
  "discos-freno": { id: 202, name: "Discos de Freno", slug: "discos-freno", parentId: 2 },
  "203": { id: 203, name: "Bombas Radiales", slug: "bombas-radiales", parentId: 2 },
  "bombas-radiales": { id: 203, name: "Bombas Radiales", slug: "bombas-radiales", parentId: 2 },
  "204": { id: 204, name: "Latiguillos Metálicos", slug: "latiguillos-metalicos", parentId: 2 },
  "latiguillos-metalicos": { id: 204, name: "Latiguillos Metálicos", slug: "latiguillos-metalicos", parentId: 2 },

  "301": { id: 301, name: "Amortiguadores Traseros", slug: "amortiguadores-traseros", parentId: 3 },
  "amortiguadores-traseros": { id: 301, name: "Amortiguadores Traseros", slug: "amortiguadores-traseros", parentId: 3 },
  "302": { id: 302, name: "Cartuchos Horquilla", slug: "cartuchos-horquilla", parentId: 3 },
  "cartuchos-horquilla": { id: 302, name: "Cartuchos Horquilla", slug: "cartuchos-horquilla", parentId: 3 },
  "303": { id: 303, name: "Amortiguadores Dirección", slug: "amortiguadores-direccion", parentId: 3 },
  "amortiguadores-direccion": { id: 303, name: "Amortiguadores Dirección", slug: "amortiguadores-direccion", parentId: 3 },
  "304": { id: 304, name: "Estriberas", slug: "estriberas", parentId: 3 },
  "estriberas": { id: 304, name: "Estriberas", slug: "estriberas", parentId: 3 },

  "401": { id: 401, name: "Centralitas (ECU)", slug: "centralitas", parentId: 4 },
  "centralitas": { id: 401, name: "Centralitas (ECU)", slug: "centralitas", parentId: 4 },
  "402": { id: 402, name: "Quickshifters", slug: "quickshifters", parentId: 4 },
  "quickshifters": { id: 402, name: "Quickshifters", slug: "quickshifters", parentId: 4 },
  "403": { id: 403, name: "Módulos ABS/TC", slug: "modulos-abs-tc", parentId: 4 },
  "modulos-abs-tc": { id: 403, name: "Módulos ABS/TC", slug: "modulos-abs-tc", parentId: 4 },
  "404": { id: 404, name: "Baterías Litio", slug: "baterias-litio", parentId: 4 },
  "baterias-litio": { id: 404, name: "Baterías Litio", slug: "baterias-litio", parentId: 4 },

  "501": { id: 501, name: "Kits Cadena Completos", slug: "kits-cadena", parentId: 5 },
  "kits-cadena": { id: 501, name: "Kits Cadena Completos", slug: "kits-cadena", parentId: 5 },
  "502": { id: 502, name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre", parentId: 5 },
  "cadenas-arrastre": { id: 502, name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre", parentId: 5 },
  "503": { id: 503, name: "Piñones", slug: "pinones", parentId: 5 },
  "pinones": { id: 503, name: "Piñones", slug: "pinones", parentId: 5 },
  "504": { id: 504, name: "Coronas Ergal", slug: "coronas", parentId: 5 },
  "coronas": { id: 504, name: "Coronas Ergal", slug: "coronas", parentId: 5 },

  "601": { id: 601, name: "Filtros Aire Racing", slug: "filtros-aire", parentId: 6 },
  "filtros-aire": { id: 601, name: "Filtros Aire Racing", slug: "filtros-aire", parentId: 6 },
  "602": { id: 602, name: "Filtros Aceite", slug: "filtros-aceite", parentId: 6 },
  "filtros-aceite": { id: 602, name: "Filtros Aceite", slug: "filtros-aceite", parentId: 6 },
  "603": { id: 603, name: "Aceites Motor Pro", slug: "aceites-motor", parentId: 6 },
  "aceites-motor": { id: 603, name: "Aceites Motor Pro", slug: "aceites-motor", parentId: 6 },
  "604": { id: 604, name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos", parentId: 6 },
  "liquidos-hidraulicos": { id: 604, name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos", parentId: 6 },

  "701": { id: 701, name: "Neumáticos Slick/Sport", slug: "neumaticos-slick", parentId: 7 },
  "neumaticos-slick": { id: 701, name: "Neumáticos Slick/Sport", slug: "neumaticos-slick", parentId: 7 },
  "702": { id: 702, name: "Calentadores", slug: "calentadores", parentId: 7 },
  "calentadores": { id: 702, name: "Calentadores", slug: "calentadores", parentId: 7 },
  "703": { id: 703, name: "Caballetes", slug: "caballetes", parentId: 7 },
  "caballetes": { id: 703, name: "Caballetes", slug: "caballetes", parentId: 7 },
  "704": { id: 704, name: "Manómetros & Accesorios", slug: "manometros-accesorios", parentId: 7 },
  "manometros-accesorios": { id: 704, name: "Manómetros & Accesorios", slug: "manometros-accesorios", parentId: 7 },

  "801": { id: 801, name: "Cascos Integrales", slug: "cascos-integrales", parentId: 8 },
  "cascos-integrales": { id: 801, name: "Cascos Integrales", slug: "cascos-integrales", parentId: 8 },
  "802": { id: 802, name: "Cascos Modulares", slug: "cascos-modulares", parentId: 8 },
  "cascos-modulares": { id: 802, name: "Cascos Modulares", slug: "cascos-modulares", parentId: 8 },
  "803": { id: 803, name: "Cascos Jet", slug: "cascos-jet", parentId: 8 },
  "cascos-jet": { id: 803, name: "Cascos Jet", slug: "cascos-jet", parentId: 8 },
  "804": { id: 804, name: "Cascos Off-Road", slug: "cascos-off-road", parentId: 8 },
  "cascos-off-road": { id: 804, name: "Cascos Off-Road", slug: "cascos-off-road", parentId: 8 },

  "901": { id: 901, name: "Chaquetas Moto", slug: "chaquetas-moto", parentId: 9 },
  "chaquetas-moto": { id: 901, name: "Chaquetas Moto", slug: "chaquetas-moto", parentId: 9 },
  "902": { id: 902, name: "Monos", slug: "monos", parentId: 9 },
  "monos": { id: 902, name: "Monos", slug: "monos", parentId: 9 },
  "903": { id: 903, name: "Guantes de Competición", slug: "guantes-compencion", parentId: 9 },
  "guantes-competicion": { id: 903, name: "Guantes de Competición", slug: "guantes-competicion", parentId: 9 },
  "904": { id: 904, name: "Botas Racing", slug: "botas-racing", parentId: 9 },
  "botas-racing": { id: 904, name: "Botas Racing", slug: "botas-racing", parentId: 9 },

  "1001": { id: 1001, name: "Maletas & Baúles", slug: "maletas-baules", parentId: 10 },
  "maletas-baules": { id: 1001, name: "Maletas & Baúles", slug: "maletas-baules", parentId: 10 },
  "1002": { id: 1002, name: "Soportes Quad Lock", slug: "soportes-quad-lock", parentId: 10 },
  "soportes-quad-lock": { id: 1002, name: "Soportes Quad Lock", slug: "soportes-quad-lock", parentId: 10 },
  "1003": { id: 1003, name: "Intercomunicadores", slug: "intercomunicadores", parentId: 10 },
  "intercomunicadores": { id: 1003, name: "Intercomunicadores", slug: "intercomunicadores", parentId: 10 },
  "1004": { id: 1004, name: "Personalización & Espejos", slug: "personalizacion-espejos", parentId: 10 },
  "personalizacion-espejos": { id: 1004, name: "Personalización & Espejos", slug: "personalizacion-espejos", parentId: 10 }
};
