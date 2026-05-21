
import { WOO_CONFIG, STORE_CONFIG } from '../storeData';
import { Product, WooProduct, OrderPayload, Order, User, WooCategory, Category, UserRank } from '../types';

export const isConfigValid = () => {
  return WOO_CONFIG.baseUrl !== undefined && WOO_CONFIG.consumerKey;
};

const getAuthHeaders = () => {
  // Use Basic Auth for mobile if not proxying
  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${credentials}`
  };
};

export const makeRequest = async (path: string, options: RequestInit = {}) => {
  let baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  const cacheBuster = `_t=${new Date().getTime()}`;
  const separator = path.includes('?') ? '&' : '?';
  let url = `${baseUrl}/wp-json${path}${separator}${cacheBuster}`;

  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  try {
    let response = await fetch(url, { ...options, headers });

    // Retry logic for 404/fallback handled in original but simplified here for brevity/native stability
    // ...

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1');

    return { data, totalPages };

  } catch (error: any) {
    console.error("[API FETCH ERROR]", error);
    throw error;
  }
};

// ... Copied existing fetchCategories ...
export const fetchCategories = async (): Promise<Category[]> => {
  const mainCategories: Category[] = [
    {
      id: 1,
      name: "Sistemas de Escape",
      slug: "escapes",
      parent: 0,
      description: "Silenciosos, colectores y líneas completas de alto rendimiento.",
      image: "https://images.unsplash.com/photo-1532588237936-a14a3818bc79?auto=format&fit=crop&q=80&w=800",
      count: 1918,
      children: [
        { id: 101, name: "Línea Completa (Racing)", slug: "linea-completa", parent: 1, description: "", image: "", count: 480 },
        { id: 102, name: "Slip-On (Silenciosos)", slug: "silenciadores", parent: 1, description: "", image: "", count: 850 },
        { id: 103, name: "Colectores", slug: "colectores", parent: 1, description: "", image: "", count: 320 },
        { id: 104, name: "Accesorios Escape", slug: "accesorios-escape", parent: 1, description: "", image: "", count: 268 }
      ]
    },
    {
      id: 2,
      name: "Frenos de Competición",
      slug: "frenos",
      parent: 0,
      description: "Máxima potencia y control: bombas radiales, discos y pastillas.",
      image: "https://images.unsplash.com/photo-1563618147570-36034c4f0282?auto=format&fit=crop&q=80&w=800",
      count: 12023,
      children: [
        { id: 201, name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas", parent: 2, description: "", image: "", count: 6420 },
        { id: 202, name: "Discos de Freno", slug: "discos-freno", parent: 2, description: "", image: "", count: 3850 },
        { id: 203, name: "Bombas Radiales", slug: "bombas-radiales", parent: 2, description: "", image: "", count: 980 },
        { id: 204, name: "Latiguillos Metálicos", slug: "latiguillos-metalicos", parent: 2, description: "", image: "", count: 773 }
      ]
    },
    {
      id: 3,
      name: "Ciclista & Chasis",
      slug: "suspensiones",
      parent: 0,
      description: "Estabilidad extrema con suspensiones Pro y componentes de chasis.",
      image: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800",
      count: 14429,
      children: [
        { id: 301, name: "Amortiguadores Traseros", slug: "amortiguadores-traseros", parent: 3, description: "", image: "", count: 3200 },
        { id: 302, name: "Cartuchos Horquilla", slug: "cartuchos-horquilla", parent: 3, description: "", image: "", count: 4850 },
        { id: 303, name: "Amortiguadores Dirección", slug: "amortiguadores-direccion", parent: 3, description: "", image: "", count: 1840 },
        { id: 304, name: "Estriberas", slug: "estriberas", parent: 3, description: "", image: "", count: 4539 }
      ]
    },
    {
      id: 4,
      name: "Electrónica & ECU",
      slug: "electronica",
      parent: 0,
      description: "Gestión de motor, Quickshifters y telemetría de competición.",
      image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
      count: 3571,
      children: [
        { id: 401, name: "Centralitas (ECU)", slug: "centralitas", parent: 4, description: "", image: "", count: 520 },
        { id: 402, name: "Quickshifters", slug: "quickshifters", parent: 4, description: "", image: "", count: 830 },
        { id: 403, name: "Módulos ABS/TC", slug: "modulos-abs-tc", parent: 4, description: "", image: "", count: 420 },
        { id: 404, name: "Baterías Litio", slug: "baterias-litio", parent: 4, description: "", image: "", count: 1801 }
      ]
    },
    {
      id: 5,
      name: "Transmisión & Desarrollo",
      slug: "transmision",
      parent: 0,
      description: "Kits de arrastre reforzados, piñones y coronas aligeradas.",
      image: "https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800",
      count: 21163,
      children: [
        { id: 501, name: "Kits Cadena Completos", slug: "kits-cadena", parent: 5, description: "", image: "", count: 9480 },
        { id: 502, name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre", parent: 5, description: "", image: "", count: 5630 },
        { id: 503, name: "Piñones", slug: "pinones", parent: 5, description: "", image: "", count: 2840 },
        { id: 504, name: "Coronas Ergal", slug: "coronas", parent: 5, description: "", image: "", count: 3213 }
      ]
    },
    {
      id: 6,
      name: "Mantenimiento & Fluidos",
      slug: "mantenimiento",
      parent: 0,
      description: "Filtros de alto flujo y lubricantes de máxima protección.",
      image: "https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=800",
      count: 21616,
      children: [
        { id: 601, name: "Filtros Aire Racing", slug: "filtros-aire", parent: 6, description: "", image: "", count: 5420 },
        { id: 602, name: "Filtros Aceite", slug: "filtros-aceite", parent: 6, description: "", image: "", count: 4850 },
        { id: 603, name: "Aceites Motor Pro", slug: "aceites-motor", parent: 6, description: "", image: "", count: 7430 },
        { id: 604, name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos", parent: 6, description: "", image: "", count: 3916 }
      ]
    },
    {
      id: 7,
      name: "Neumáticos & Paddock",
      slug: "neumaticos",
      parent: 0,
      description: "Gomas de alto agarre, calentadores y equipamiento de garaje.",
      image: "https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=800",
      count: 6069,
      children: [
        { id: 701, name: "Neumáticos Slick/Sport", slug: "neumaticos-slick", parent: 7, description: "", image: "", count: 3210 },
        { id: 702, name: "Calentadores", slug: "calentadores", parent: 7, description: "", image: "", count: 980 },
        { id: 703, name: "Caballetes", slug: "caballetes", parent: 7, description: "", image: "", count: 1240 },
        { id: 704, name: "Manómetros & Accesorios", slug: "manometros-accesorios", parent: 7, description: "", image: "", count: 639 }
      ]
    },
    {
      id: 8,
      name: "Cascos",
      slug: "cascos",
      parent: 0,
      description: "Cascos integrales, modulares, jet y off-road de las mejores marcas.",
      image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800",
      count: 3114,
      children: [
        { id: 801, name: "Cascos Integrales", slug: "cascos-integrales", parent: 8, description: "", image: "", count: 1240 },
        { id: 802, name: "Cascos Modulares", slug: "cascos-modulares", parent: 8, description: "", image: "", count: 850 },
        { id: 803, name: "Cascos Jet", slug: "cascos-jet", parent: 8, description: "", image: "", count: 620 },
        { id: 804, name: "Cascos Off-Road", slug: "cascos-off-road", parent: 8, description: "", image: "", count: 404 }
      ]
    },
    {
      id: 9,
      name: "Equipación Piloto",
      slug: "equipacion",
      parent: 0,
      description: "Monos de competición, chaquetas, guantes, botas y protecciones.",
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
      count: 6147,
      children: [
        { id: 901, name: "Chaquetas Moto", slug: "chaquetas-moto", parent: 9, description: "", image: "", count: 2450 },
        { id: 902, name: "Monos", slug: "monos", parent: 9, description: "", image: "", count: 1240 },
        { id: 903, name: "Guantes de Competición", slug: "guantes-competicion", parent: 9, description: "", image: "", count: 1480 },
        { id: 904, name: "Botas Racing", slug: "botas-racing", parent: 9, description: "", image: "", count: 977 }
      ]
    },
    {
      id: 10,
      name: "Accesorios & Maletas",
      slug: "accesorios",
      parent: 0,
      description: "Sistemas de equipaje, soportes Quad Lock, intercomunicadores y cúpulas.",
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
      count: 13943,
      children: [
        { id: 1001, name: "Maletas & Baúles", slug: "maletas-baules", parent: 10, description: "", image: "", count: 4850 },
        { id: 1002, name: "Soportes Quad Lock", slug: "soportes-quad-lock", parent: 10, description: "", image: "", count: 3210 },
        { id: 1003, name: "Intercomunicadores", slug: "intercomunicadores", parent: 10, description: "", image: "", count: 2480 },
        { id: 1004, name: "Personalización & Espejos", slug: "personalizacion-espejos", parent: 10, description: "", image: "", count: 3403 }
      ]
    }
  ];

  const flatList: Category[] = [];
  for (const cat of mainCategories) {
    flatList.push(cat);
    if (cat.children) {
      for (const child of cat.children) {
        flatList.push(child);
      }
    }
  }
  return flatList;
};

// Helper: Fetch Single Product
export const fetchProductById = async (id: number | string): Promise<Product | null> => {
  try {
    const { data } = await makeRequest(`/wc/v3/products/${id}`);
    // Map single WooProduct to Product
    return mapToProduct(data);
  } catch (e) {
    console.error("Error fetching product " + id, e);
    return null;
  }
}

// Internal Helper
const mapToProduct = (p: any): Product => {
  let imageUrl = p.images?.length > 0 ? p.images[0].src : STORE_CONFIG.defaultProductImage;
  return {
    id: p.id,
    title: p.name,
    price: parseFloat(p.price || p.regular_price || "0"),
    regularPrice: parseFloat(p.regular_price || p.price || "0"),
    sku: p.sku || `REF-${p.id}`,
    image: imageUrl,
    images: p.images || [],
    inStock: p.stock_status === 'instock',
    category: p.categories?.length > 0 ? p.categories[0].name : 'General',
    categorySlug: p.categories?.length > 0 ? p.categories[0].slug : 'recambios',
    categoryId: p.categories?.length > 0 ? p.categories[0].id : 0,
    permalink: p.permalink,
    attributes: p.attributes || [],
    description: p.description,
    shortDescription: p.short_description
  };
}


export const fetchProducts = async (
  searchQuery?: string,
  categoryId?: number,
  page: number = 1,
  perPage: number = 20
): Promise<{ products: Product[], totalPages: number }> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");

  try {
    let path = `/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
    if (searchQuery) path += `&search=${encodeURIComponent(searchQuery)}`;
    if (categoryId) path += `&category=${categoryId}`;

    const { data, totalPages } = await makeRequest(path);
    return { products: (data as any[]).map(mapToProduct), totalPages };
  } catch (error) {
    throw error;
  }
};

// --- GAMIFICATION STUBS (To support forum.ts) ---

export const toggleLike = async (type: string, id: number, token: string): Promise<{ liked: boolean; likeCount: number }> => {
  // En una implementación real, esto llamaría a un endpoint de gamificación
  console.log(`[Mock] Toggling like for ${type} ${id}`);
  return { liked: true, likeCount: Math.floor(Math.random() * 10) + 1 };
};

export const registerActivity = async (action: string, id: number, token: string): Promise<void> => {
  console.log(`[Mock] Registered activity: ${action} on ${id}`);
};

export const fetchUserRank = async (userId: number): Promise<UserRank | null> => {
  // Rank mock
  return {
    level: 5,
    title: "Piloto Experto",
    xp: 2500,
    xpToNext: 5000,
    discount: 5,
    color: "#eab308",
    icon: "🏆"
  };
};
