
import { ShieldCheck, Truck, Trophy, CheckCircle2 } from 'lucide-react';

// CONFIGURACIÓN DE CONEXIÓN WOOCOMMERCE
export const WOO_CONFIG = {
  baseUrl: "", // Empty for web proxy (Vercel) usage
  consumerKey: "ck_d3b44ee68cb5f6e3e222da8dde30ac733f1c859f",
  consumerSecret: "cs_bc248d17e08ea49c04100e129b5798e6006c8fdd"
};

// CONFIGURACIÓN DE PAGOS (SUMUP)
export const PAYMENT_CONFIG = {
  provider: 'sumup',
  merchantEmail: 'info@escapesymas.com'
};

// CONFIGURACIÓN GENERAL DE LA TIENDA
export const STORE_CONFIG = {
  name: "Escapes y Más",
  logoUrl: "/logo-cabecera.svg",
  defaultProductImage: "https://backendescapes.com/wp-content/uploads/2026/01/ico-1.png",
  currency: "EUR",
  contactEmail: "info@escapesymas.com",
  heroTitle: "Equipamiento Pro",
  heroSubtitle: "Para Pilotos Exigentes",
  heroImage: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=1920&auto=format&fit=crop"
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
  { label: 'Paddock', view: 'forum', highlight: true },
  { label: 'Garantías', view: 'warranty' },
  { label: 'Contacto', view: 'contact' },
];

/**
 * CATEGORÍAS DEL CATÁLOGO REORGANIZADAS
 */
export const CATEGORIES = [
  {
    id: "escapes",
    name: "Sistemas de Escape",
    image: "https://images.unsplash.com/photo-1532588237936-a14a3818bc79?auto=format&fit=crop&q=80&w=800",
    description: "Silenciosos, colectores y líneas completas de alto rendimiento.",
    subcategories: ["Línea Completa (Racing)", "Slip-On (Silenciosos)", "Colectores", "Accesorios Escape"]
  },
  {
    id: "frenos",
    name: "Frenos de Competición",
    image: "https://images.unsplash.com/photo-1563618147570-36034c4f0282?auto=format&fit=crop&q=80&w=800",
    description: "Máxima potencia y control: bombas radiales, discos y pastillas.",
    subcategories: ["Pastillas Sinterizadas", "Discos de Freno", "Bombas Radiales", "Latiguillos Metálicos"]
  },
  {
    id: "suspensiones",
    name: "Ciclista & Chasis",
    image: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800",
    description: "Estabilidad extrema con suspensiones Pro y componentes de chasis.",
    subcategories: ["Amortiguadores traseros", "Cartuchos Horquilla", "Amortiguadores Dirección", "Estriberas"]
  },
  {
    id: "electronica",
    name: "Electrónica & ECU",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
    description: "Gestión de motor, Quickshifters y telemetría de competición.",
    subcategories: ["Centralitas (ECU)", "Quickshifters", "Módulos ABS/TC", "Baterías Litio"]
  },
  {
    id: "transmision",
    name: "Transmisión & Desarrollo",
    image: "https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800",
    description: "Kits de arrastre reforzados, piñones y coronas aligeradas.",
    subcategories: ["Kits Cadena Completos", "Cadenas X-Ring/Z-Ring", "Piñones", "Coronas Ergal"]
  },
  {
    id: "mantenimiento",
    name: "Mantenimiento & Fluidos",
    image: "https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=800",
    description: "Filtros de alto flujo y lubricantes de máxima protección.",
    subcategories: ["Filtros Aire Racing", "Filtros Aceite", "Aceites Motor Pro", "Líquidos Hidráulicos"]
  },
  {
    id: "neumaticos",
    name: "Neumáticos & Paddock",
    image: "https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=800",
    description: "Gomas de alto agarre, calentadores y equipamiento de garaje.",
    subcategories: ["Neumáticos Slick/Sport", "Calentadores", "Caballetes", "Manómetros & Accesorios"]
  }
];

/**
 * MAPA DE AÑOS POR MODELO
 */
export const MODEL_YEARS: Record<string, string[]> = {
  "RS 660": ["2024", "2023", "2022", "2021", "2020"],
  "Tuono 660": ["2024", "2023", "2022", "2021"],
  "RSV4": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"],
  "S 1000 RR": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"],
  "M 1000 RR": ["2024", "2023", "2022", "2021"],
  "R 1250 GS": ["2024", "2023", "2022", "2021", "2020", "2019"],
  "R 1300 GS": ["2025", "2024"],
  "Panigale V4": ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
  "Panigale V2": ["2024", "2023", "2022", "2021", "2020"],
  "Monster 937": ["2024", "2023", "2022", "2021"],
  "CBR1000RR-R Fireblade": ["2024", "2023", "2022", "2021", "2020"],
  "CBR650R": ["2024", "2023", "2022", "2021", "2020", "2019"],
  "CB750 Hornet": ["2024", "2023"],
  "XL750 Transalp": ["2024", "2023"],
  "Africa Twin": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"],
  "Z900": ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"],
  "Ninja ZX-10R": ["2024", "2023", "2022", "2021", "2016-2020", "2011-2015"],
  "Ninja ZX-6R": ["2024", "2023", "2019-2022", "2013-2018"],
  "Duke 390": ["2024", "2023", "2022", "2021", "2020", "2017-2019", "2013-2016"],
  "Duke 890": ["2023", "2022", "2021", "2020"],
  "1290 Super Duke R": ["2023", "2022", "2021", "2020", "2017-2019", "2014-2016"],
  "MT-07": ["2024", "2023", "2022", "2021", "2018-2020", "2014-2017"],
  "MT-09": ["2024", "2023", "2022", "2021", "2017-2020", "2013-2016"],
  "YZF-R1": ["2024", "2023", "2022", "2021", "2020", "2015-2019"]
};

/**
 * DATOS ESTRUCTURADOS PARA SELECTORES
 */
export const BIKE_DATA = {
  brands: ["Aprilia", "BMW", "Ducati", "Honda", "Kawasaki", "KTM", "Yamaha"],
  models: {
    "Aprilia": ["RS 660", "Tuono 660", "RSV4"],
    "BMW": ["S 1000 RR", "M 1000 RR", "R 1250 GS", "R 1300 GS"],
    "Ducati": ["Panigale V4", "Panigale V2", "Monster 937"],
    "Honda": ["CBR1000RR-R Fireblade", "CBR650R", "CB750 Hornet", "XL750 Transalp", "Africa Twin"],
    "Kawasaki": ["Z900", "Ninja ZX-10R", "Ninja ZX-6R"],
    "KTM": ["Duke 390", "Duke 890", "1290 Super Duke R"],
    "Yamaha": ["MT-07", "MT-09", "YZF-R1"]
  },
  years: ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"]
};
