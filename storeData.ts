
import { ShieldCheck, Truck, Trophy, CheckCircle2 } from 'lucide-react';

// CONFIGURACIÓN DE CONEXIÓN WOOCOMMERCE
export const WOO_CONFIG = {
  baseUrl: "https://www.backendescapes.com",
  consumerKey: "ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9",
  consumerSecret: "cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a"
};

// CONFIGURACIÓN DE PAGOS (SUMUP)
export const PAYMENT_CONFIG = {
  provider: 'sumup',
  // NOTA: La secretKey debe estar en variables de entorno (SUMUP_SECRET_KEY) en el servidor.
  merchantEmail: 'info@escapesymas.com' 
};

// CONFIGURACIÓN GENERAL DE LA TIENDA
export const STORE_CONFIG = {
  name: "Escapes y Más", 
  logoUrl: "https://backendescapes.com/wp-content/uploads/2026/01/logo1-cab.png",
  defaultProductImage: "https://backendescapes.com/wp-content/uploads/2026/01/ico.png",
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
  { label: 'Catálogo', view: 'catalog' },
  { label: 'Categorías', view: 'categories' },
  { label: 'Paddock', view: 'forum', highlight: true },
  { label: 'Garantías', view: 'warranty' },
  { label: 'Contacto', view: 'contact' },
];

/**
 * CATEGORÍAS DEL CATÁLOGO
 */
export const CATEGORIES = [
  {
    id: "escapes",
    name: "Sistemas de Escape",
    image: "https://images.unsplash.com/photo-1532588237936-a14a3818bc79?auto=format&fit=crop&q=80&w=800",
    description: "Silenciosos, colectores y líneas completas.",
    subcategories: ["Racing Line", "Slip-On", "Colectores", "Db Killers"]
  },
  {
    id: "frenos",
    name: "Frenos & Hidráulica",
    image: "https://images.unsplash.com/photo-1563618147570-36034c4f0282?auto=format&fit=crop&q=80&w=800",
    description: "Pastillas sinterizadas, discos wave y latiguillos.",
    subcategories: ["Pastillas", "Discos", "Bombas Radiales", "Líquidos"]
  },
  {
    id: "transmision",
    name: "Kits de Transmisión",
    image: "https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800",
    description: "Cadenas reforzadas, piñones y coronas aligeradas.",
    subcategories: ["Kits Completos", "Cadenas X-Ring", "Piñones", "Coronas"]
  },
  {
    id: "admision",
    name: "Admisión & Filtros",
    image: "https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=800",
    description: "Filtros de alto flujo y kits de admisión directa.",
    subcategories: ["Filtros Aire", "Filtros Aceite", "Kits Admisión"]
  },
  {
    id: "neumaticos",
    name: "Neumáticos & Llantas",
    image: "https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=800",
    description: "Gomas slick, sport-touring y calentadores.",
    subcategories: ["Slicks", "Carretera", "Off-Road", "Válvulas"]
  },
  {
    id: "electronica",
    name: "Electrónica Racing",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
    description: "Centralitas, quickshifters y control de tracción.",
    subcategories: ["Quickshifters", "Centralitas", "Baterías Litio"]
  }
];

/**
 * MAPA DE AÑOS POR MODELO (Para filtrado preciso)
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
