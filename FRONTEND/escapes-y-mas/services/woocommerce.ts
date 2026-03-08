
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
  if (!isConfigValid()) throw new Error("Configuración incompleta");
  try {
    const { data } = await makeRequest('/wc/v3/products/categories?per_page=100&hide_empty=true');
    const wooCats = data as WooCategory[];
    return wooCats.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent: c.parent,
      description: c.description,
      image: c.image ? c.image.src : '',
      count: c.count
    }));
  } catch (error) {
    throw error;
  }
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
