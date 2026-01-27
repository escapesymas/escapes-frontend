
import { ShieldCheck, Truck, Trophy, CheckCircle2 } from 'lucide-react';

// CONFIGURACIÓN DE CONEXIÓN WOOCOMMERCE
export const WOO_CONFIG = {
  baseUrl: "", // Empty because woocommerce.ts adds /wp-json and server proxies on /wp-json
  consumerKey: "ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9",
  consumerSecret: "cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a"
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
/**
 * MAPA DE AÑOS POR MODELO Y DATOS DE SELECTOR
 * Generado dinámicamente desde utils/bikeDatabase.ts
 */
import { BIKE_DATABASE, getAllBrands, getModelsByBrand, getYearsByModel } from './utils/bikeDatabase';

// Transformar base de datos plana a estructura encadenada para selectores
export const BIKE_DATA = {
  brands: getAllBrands(),
  models: getAllBrands().reduce((acc, brand) => {
    acc[brand] = getModelsByBrand(brand);
    return acc;
  }, {} as Record<string, string[]>),
  years: Array.from(new Set(BIKE_DATABASE.flatMap(b => b.years))).sort().reverse() // Todos los años posibles
};

// Mapa rápido para buscar años dado un modelo
export const MODEL_YEARS = BIKE_DATABASE.reduce((acc, bike) => {
  acc[bike.model] = bike.years;
  return acc;
}, {} as Record<string, string[]>);
