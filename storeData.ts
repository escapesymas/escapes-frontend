import { ShieldCheck, Truck, Star } from 'lucide-react';

// CONFIGURACIÓN DE CONEXIÓN WOOCOMMERCE
export const WOO_CONFIG = {
  // URL de Producción
  baseUrl: "https://backendescapes.com",
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
  // URL del logo actualizada (Versión Cabecera/Footer)
  logoUrl: "https://backendescapes.com/wp-content/uploads/2026/01/logo1-cab.png",
  // URL de la imagen por defecto para productos sin foto
  defaultProductImage: "https://backendescapes.com/wp-content/uploads/2026/01/icow-scaled.png",
  currency: "EUR",
  contactEmail: "info@escapesymas.com",
  heroTitle: "Equipamiento Pro",
  heroSubtitle: "Para Pilotos Exigentes",
  heroImage: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=1920&auto=format&fit=crop"
};

// CARACTERÍSTICAS DESTACADAS
export const FEATURES = [
  { icon: ShieldCheck, title: "Garantía Oficial", desc: "3 años en todas las piezas" },
  { icon: Truck, title: "Envío 24H/48H", desc: "Tiempo de entrega según destino" },
  { icon: Star, title: "Calidad Pro", desc: "Marcas certificadas Moto GP" },
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
 * BASE DE DATOS ESTÁTICA
 */
export const BIKE_DATA = {
  brands: [
    "Aprilia", "BMW", "Ducati", "Harley-Davidson", "Honda", "Husqvarna", 
    "Indian", "Kawasaki", "KTM", "MV Agusta", "Royal Enfield", "Suzuki", "Triumph", "Yamaha"
  ],
  models: {
    "Aprilia": ["RS 660", "Tuono 660", "RSV4", "Tuono V4", "Dorsoduro 900", "Shiver 900", "SR GT 125"],
    "BMW": ["S 1000 RR", "M 1000 RR", "R 1250 GS", "R 1300 GS", "F 900 R", "F 900 XR", "F 850 GS", "S 1000 XR", "R nineT", "G 310 R"],
    "Ducati": ["Panigale V4", "Panigale V2", "Streetfighter V4", "Streetfighter V2", "Monster 937", "Monster 821", "Multistrada V4", "Hypermotard 950", "Scrambler 800", "Diavel V4"],
    "Harley-Davidson": ["Sportster S", "Pan America 1250", "Iron 883", "Softail Standard", "Fat Bob 114", "Street Bob 114"],
    "Honda": ["CBR1000RR-R Fireblade", "CBR650R", "CB650R", "CB1000R", "CB750 Hornet", "XL750 Transalp", "CRF1100L Africa Twin", "X-ADV 750", "Forza 750", "CB500F", "CB500X", "Rebel 500", "Rebel 1100"],
    "Husqvarna": ["Svartpilen 401", "Vitpilen 401", "701 Supermoto", "Norden 901"],
    "Indian": ["Scout", "Scout Bobber", "FTR 1200", "Chief"],
    "Kawasaki": ["Z900", "Z900RS", "Z650", "Z400", "Ninja ZX-10R", "Ninja ZX-6R", "Ninja 650", "Ninja 400", "Versys 650", "Versys 1000", "Vulcan S"],
    "KTM": ["Duke 125", "Duke 390", "Duke 790", "Duke 890", "Duke 990", "1290 Super Duke R", "RC 390", "Adventure 390", "890 Adventure", "1290 Super Adventure"],
    "MV Agusta": ["Brutale 800", "Dragster 800", "F3 800", "Superveloce 800", "Turismo Veloce"],
    "Royal Enfield": ["Interceptor 650", "Continental GT 650", "Himalayan 411", "Himalayan 450", "Meteor 350", "Classic 350"],
    "Suzuki": ["GSX-R1000", "GSX-S1000", "GSX-8S", "V-Strom 650", "V-Strom 800DE", "V-Strom 1050", "SV650", "Hayabusa"],
    "Triumph": ["Street Triple 765", "Speed Triple 1200", "Trident 660", "Tiger 900", "Tiger 1200", "Bonneville T100", "Bonneville T120", "Speed Twin", "Thruxton RS"],
    "Yamaha": ["MT-07", "MT-09", "MT-10", "MT-03", "MT-125", "YZF-R1", "YZF-R6", "YZF-R7", "YZF-R3", "YZF-R125", "Tracer 7", "Tracer 9", "Ténéré 700", "XSR 700", "XSR 900", "TMAX 560", "XMAX 300"]
  },
  years: [
    "2025", "2024", "2023", "2022", "2021", "2020", 
    "2019", "2018", "2017", "2016", "2015", "2014", 
    "2013", "2012", "2011", "2010"
  ]
};

// ENLACES DEL MENÚ
export const NAV_LINKS = [
  { label: "Comunidad", href: "#", view: "forum" }, 
  { label: "Escapes", href: "#", category: "Escapes" },
  { label: "Frenos", href: "#", category: "Frenos" },
  { label: "Ofertas", href: "#", highlight: true, category: "Ofertas" }
];