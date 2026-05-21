
import { STORE_CONFIG } from '../storeData';
import { Product, OrderPayload, Order, User, Category, UserRank } from '../types';

export const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : 'https://backendescapes.com';

export const isConfigValid = () => {
  return true;
};

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

export const makeRequest = async (path: string, options: RequestInit = {}) => {
  let baseUrl = API_BASE;

  const cacheBuster = `_t=${new Date().getTime()}`;
  const separator = path.includes('?') ? '&' : '?';
  let url = `${baseUrl}/wp-json${path}${separator}${cacheBuster}`;

  const headers = {
    ...getAuthHeaders(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...options.headers
  };

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 404) {
      const [route, query] = path.split('?');
      const fallbackUrl = `${baseUrl}/?rest_route=${route}${query ? '&' + query : ''}`;
      response = await fetch(fallbackUrl, { ...options, headers });
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      // Throw error with first 200 chars of body
      throw new Error(`Error del Servidor (${response.status}): Respuesta no JSON. Body: ${text.substring(0, 200)}`);
    }

    // Capturamos el total de páginas y productos de los headers
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1');
    const totalProducts = parseInt(response.headers.get('x-wp-total') || '0');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return { data, totalPages, totalProducts };

  } catch (error: any) {
    console.error("[API FETCH ERROR]", error);
    throw error;
  }
};

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

/**
 * Obtiene productos específicos por sus IDs
 */
export const fetchProductsByIds = async (ids: number[]): Promise<Product[]> => {
  if (ids.length === 0) return [];

  try {
    const res = await fetch(`${API_BASE}/api/catalog/products-by-skus?ids=${ids.join(',')}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data as any[]).map(p => ({
      id: p.id,
      title: p.title || p.name,
      slug: p.slug,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      regularPrice: typeof p.regularPrice === 'string' ? parseFloat(p.regularPrice) : p.regularPrice,
      sku: p.sku || '',
      image: p.image || p.images?.[0]?.src || '',
      images: p.images || [],
      inStock: p.inStock,
      stock: p.stock || 0,
      category: p.category || 'General',
      categorySlug: p.categorySlug || 'general',
      categoryId: p.categoryId || 0,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      attributes: p.attributes || [],
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0
    }));
  } catch (error) {
    console.error('[CATALOG] Failed to fetch products by IDs:', error);
    return [];
  }
};

// In-memory cache for search results to avoid redundant slow queries
const searchCache = new Map<string, { products: Product[], totalPages: number, totalProducts: number, timestamp: number }>();
const SEARCH_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// Limpieza de caché frontend
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > SEARCH_CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const fetchProducts = async (
  searchQuery?: string,
  categoryId?: number,
  page: number = 1,
  perPage: number = 20,
  orderBy: string = 'date',
  order: string = 'desc',
  fast: boolean = false,
  moto?: { brand: string, model: string, year?: string }
): Promise<{ products: Product[], totalPages: number, totalProducts: number }> => {

  // --- COMPATIBILIDAD CON MOTOS (100% NATIVA EN POSTGRESQL) ---
  if (moto && moto.brand && moto.model) {
    return fetchCompatibleProducts(moto.brand, moto.model, moto.year, categoryId, page, perPage);
  }

  try {
    let catalogUrl = `${API_BASE}/api/catalog/products?page=${page}&per_page=${perPage}`;
    if (searchQuery) catalogUrl += `&search=${encodeURIComponent(searchQuery)}`;
    if (categoryId) catalogUrl += `&category_id=${categoryId}`;

    const nativeRes = await fetch(catalogUrl);
    if (nativeRes.ok) {
      const nativeProducts = await nativeRes.json();
      const totalProducts = parseInt(nativeRes.headers.get('X-WP-Total') || '0');
      const totalPages = parseInt(nativeRes.headers.get('X-WP-TotalPages') || '1');

      return { products: nativeProducts, totalPages, totalProducts };
    }
  } catch (pgError) {
    console.error('[CATALOG ERROR] Failed to fetch native products:', pgError);
  }

  return { products: [], totalPages: 1, totalProducts: 0 };
};

export const createOrder = async (orderData: OrderPayload | any): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    // Traducir el OrderPayload de WooCommerce a nuestro esquema de PostgreSQL
    const userEmail = orderData.billing?.email || orderData.email || '';
    const cart = orderData.line_items?.map((item: any) => ({
      id: item.product_id || item.id,
      quantity: item.quantity
    })) || [];
    
    const shippingData = {
      firstName: orderData.billing?.first_name || 'Cliente',
      lastName: orderData.billing?.last_name || '',
      email: userEmail,
      address: orderData.billing?.address_1 || '',
      city: orderData.billing?.city || '',
      zip: orderData.billing?.postcode || '',
      phone: orderData.billing?.phone || ''
    };

    const paymentMethod = orderData.payment_method || 'sumup';
    const promoCode = orderData.promoCode || undefined;

    const response = await fetch(`${API_BASE}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userEmail,
        cart,
        shippingData,
        paymentMethod,
        promoCode
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}`);
    }

    return { success: true, id: result.orderId };
  } catch (error: any) {
    console.error('[DATABASE ORDER] Failed to create order in PostgreSQL:', error);
    return { success: false, error: error.message };
  }
};



/**
 * Obtiene los pedidos pendientes de un cliente para recuperar carritos abandonados
 * Puede buscar por customerId o por email
 */
export const fetchPendingOrders = async (customerId: number, email?: string): Promise<Order[]> => {
  try {
    let url = `${API_BASE}/api/orders?status=pending`;
    if (customerId && customerId > 0) {
      url += `&userId=${customerId}`;
    } else if (email) {
      url += `&email=${encodeURIComponent(email)}`;
    } else {
      return [];
    }

    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json() as Order[];
  } catch (error) {
    console.error('[ORDERS] Failed to fetch pending orders:', error);
    return [];
  }
};

// Helper to format WC customer to our User type
const formatUserResponse = (customer: any): User => {
  return {
    id: customer.id,
    username: customer.username,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    avatarUrl: customer.avatar_url,
    billing: {
      address_1: customer.billing?.address_1 || '',
      city: customer.billing?.city || '',
      postcode: customer.billing?.postcode || '',
      phone: customer.billing?.phone || ''
    }
  };
};

/**
 * Obtiene un cliente por su email
 */
export const fetchCustomerByEmail = async (email: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth?action=get-profile&email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const user = await res.json();
    return user as User;
  } catch (error) {
    console.error('[CATALOG] Error fetching customer by email:', error);
    return null;
  }
};

export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/auth?action=update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        billing: data.billing,
        garage: data.garage,
        avatarUrl: data.avatarUrl
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[CATALOG] Error updating customer:', error);
    return false;
  }
};

// =====================
// CART PERSISTENCE
// =====================

interface CartItemData {
  product_id: number;
  quantity: number;
}

/**
 * Guarda el carrito del usuario en los metadatos del cliente de WooCommerce
 */
export const saveUserCart = async (userId: number, cartItems: CartItemData[]): Promise<boolean> => {
  if (!userId || userId === 0) return false;

  try {
    const response = await fetch(`${API_BASE}/api/auth?action=save-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        cart: cartItems
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[CART SYNC] Failed to save cart:', error);
    return false;
  }
};

/**
 * Recupera el carrito guardado del usuario
 */
export const getUserCart = async (userId: number): Promise<CartItemData[]> => {
  if (!userId || userId === 0) return [];

  try {
    const response = await fetch(`${API_BASE}/api/auth?action=get-profile&id=${userId}`);
    if (!response.ok) return [];
    const profile = await response.json();
    return (profile.cart || []) as CartItemData[];
  } catch (error) {
    console.error('[CART SYNC] Failed to get cart:', error);
    return [];
  }
};

// =====================
// ORDER STATUS UPDATE
// =====================

/**
 * Actualiza el estado de un pedido existente
 */
export const updateOrderStatus = async (
  orderId: number,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  paymentId?: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/orders/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        paymentId: paymentId || `TX-${Date.now()}`,
        status
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Error ${response.status}`);
    }

    console.log(`[ORDER] Updated PostgreSQL order ${orderId} to status: ${status}`);
    return true;
  } catch (error) {
    console.error('[ORDER] Failed to update status in PostgreSQL:', error);
    return false;
  }
};

/**
 * Obtiene los pedidos de un cliente
 */
export const fetchCustomerOrders = async (
  customerId: number,
  status: string = 'any',
  email?: string
): Promise<Order[] | any[]> => {
  console.log('[ORDERS] 🔍 Fetching PostgreSQL orders. Email:', email, '| Status filter:', status);

  if (!email) {
    console.warn('[ORDERS] No email provided, attempting to recover from local storage');
    const localUserStr = localStorage.getItem('escapes_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        email = localUser.email || localUser.user_email;
      } catch {}
    }
  }

  if (!email) {
    console.error('[ORDERS] ❌ No user email found to fetch orders');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE}/api/orders/my-orders?userEmail=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const pgOrders = await response.json();

    // Traducir de esquema de PostgreSQL a WooCommerce para compatibilidad con el frontend React
    return pgOrders.map((order: any) => ({
      id: order.id,
      status: order.status,
      date_created: order.createdAt,
      total: order.total.toString(),
      line_items: order.items.map((item: any) => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        total: (item.price * item.quantity).toString(),
        product_id: item.productId
      }))
    })).filter((order: any) => status === 'any' || order.status === status);
  } catch (error: any) {
    console.error('[ORDERS] Failed to fetch PostgreSQL orders:', error);
    return [];
  }
};

// =====================
// AVATAR MANAGEMENT
// =====================

export interface AvatarOption {
  id: number;
  url: string;
  title: string;
}

/**
 * Busca imágenes en la media library de WordPress que contengan "AVATAR" en el título
 */
export const fetchAvatars = async (): Promise<AvatarOption[]> => {
  return [
    { id: 1, url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop', title: 'Moto Retro' },
    { id: 2, url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=150&auto=format&fit=crop', title: 'Rider Black' },
    { id: 3, url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=150&auto=format&fit=crop', title: 'Superbike' },
    { id: 4, url: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=150&auto=format&fit=crop', title: 'Chopper Custom' },
    { id: 5, url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=150&auto=format&fit=crop', title: 'Enduro Mud' },
    { id: 6, url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop', title: 'Helmet Carbon' }
  ];
};

/**
 * Actualiza el avatar del cliente en WooCommerce (guarda en metadata)
 * Guarda tanto _custom_avatar (URL) como wp_user_avatar (ID) para persistencia.
 */
export const updateCustomerAvatar = async (userId: number, avatarData: string | number): Promise<boolean> => {
  if (!userId || userId === 0) return false;

  let avatarUrl = "";
  if (typeof avatarData === 'string') {
    avatarUrl = avatarData;
  } else {
    avatarUrl = `/assets/avatars/avatar-${avatarData}.png`;
  }

  return updateCustomer(userId, { avatarUrl });
};

export const uploadFile = async (file: File): Promise<{ id: number; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/upload/generic`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al subir archivo');
    }

    const data = await response.json();
    return { id: data.id, url: data.url };
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    throw error;
  }
};

/**
 * Sube una foto personalizada para el cliente usando el plugin Escapes Avatars.
 * Requiere que el usuario esté autenticado (JWT).
 */
export const uploadCustomerPhoto = async (userId: number, file: File, token?: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('userId', userId.toString()); // Metadatos PRIMERO
    formData.append('avatar', file);

    // Usar nuestro endpoint local en server.js
    const response = await fetch(`${API_BASE}/api/upload/avatar`, {
      method: 'POST',
      // NO establecer Content-Type header manualmente con FormData, fetch lo hace automático con boundary
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.url) {
      return { success: true, url: data.url };
    } else {
      return { success: false, error: data.message || 'Error al subir avatar' };
    }
  } catch (error: any) {
    console.error('[AVATAR] Upload failed:', error);
    return { success: false, error: error.message || 'Error de conexión' };
  }
};

/**
 * Busca usuarios para menciones (Autocomplete)
 */
export const searchUsers = async (query: string): Promise<{ id: number; name: string; avatar: string }[]> => {
  if (!query || query.length < 2) return [];

  try {
    const res = await fetch(`${API_BASE}/api/auth?action=search-users&q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[SEARCH USERS] Error:', error);
    return [];
  }
};

// =====================
// PADDOCK GAMIFICATION
// =====================

/**
/**
 * Obtiene el rango y stats de un usuario — endpoint nativo PostgreSQL
 */
export const fetchUserRank = async (userId: number): Promise<UserRank> => {
  if (!userId || userId === 0) return {
    level: 1, title: 'Novato', xp: 0, xpToNext: 100, discount: 0, color: '#9CA3AF', icon: '🔰'
  };

  try {
    const res = await fetch(`${API_BASE}/api/user/${userId}/rank`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rank = await res.json();

    // Mapear colores e iconos según el título
    const getRankMeta = (title: string) => {
      switch (title) {
        case 'Novato':     return { color: '#9CA3AF', icon: '🔰' };
        case 'Aprendiz':   return { color: '#60A5FA', icon: '⚡' };
        case 'Piloto':     return { color: '#34D399', icon: '🏁' };
        case 'Experto':    return { color: '#FBBF24', icon: '🔥' };
        case 'Profesional': return { color: '#F97316', icon: '💨' };
        case 'Leyenda':    return { color: '#EF4444', icon: '👑' };
        default:           return { color: '#9CA3AF', icon: '👤' };
      }
    };

    const meta = getRankMeta(rank.title);

    return {
      level: rank.level,
      title: rank.title,
      xp: rank.xp,
      xpToNext: rank.next_xp,
      discount: rank.discount,
      color: meta.color,
      icon: meta.icon || rank.icon
    };
  } catch (error) {
    console.error('[RANK] Error fetching rank:', error);
    return {
      level: 1, title: 'Novato', xp: 0, xpToNext: 100, discount: 0, color: '#9CA3AF', icon: '🔰'
    };
  }
};

/**
 * Alterna el Like en un post o respuesta
 */
export const toggleLike = async (targetType: 'topic' | 'reply', targetId: number, token?: string): Promise<{ liked: boolean }> => {
  try {
    const headers: any = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const { data } = await makeRequest('/paddock/v1/like', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      headers
    });
    return data as { liked: boolean; likeCount: number; message?: string };
  } catch (error: any) {
    if (error.message?.includes('No puedes dar like')) {
      // Return special object to handle in UI?? Or just throw
      throw new Error('No puedes dar like a tu propio contenido');
    }
    console.error('[PADDOCK] Error toggling like:', error);
    throw error;
  }
};

/**
 * Registra actividad (crear post/respuesta) para ganar XP
 */
export const registerActivity = async (type: 'post' | 'reply', targetId: number, token?: string): Promise<void> => {
  try {
    const headers: any = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    await makeRequest('/paddock/v1/activity', {
      method: 'POST',
      body: JSON.stringify({ type, target_id: targetId }),
      headers
    });
  } catch (error) {
    console.error('[PADDOCK] Error registering activity:', error);
  }
};

/**
 * Obtiene la tabla de líderes
 */
export const fetchLeaderboard = async (limit: number = 10): Promise<any[]> => {
  try {
    const { data } = await makeRequest(`/paddock/v1/leaderboard?limit=${limit}`);
    return data as any[];
  } catch (error) {
    console.error('[PADDOCK] Error fetching leaderboard:', error);
    return [];
  }
};

/**
 * Obtiene categorías que contienen productos compatibles con una moto específica
 */
export const fetchCompatibleCategories = async (brand: string, model: string, year?: string): Promise<Category[]> => {
  try {
    let path = `/escapes/v1/compatible-categories?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
    if (year && year !== 'General' && year !== '') {
      path += `&year=${encodeURIComponent(year)}`;
    }

    const { data } = await makeRequest(path);
    
    const mapCat = (c: any): Category => ({
      id: parseInt(c.id),
      name: c.name,
      slug: c.slug,
      parent: parseInt(c.parent || 0),
      description: '',
      image: '',
      count: parseInt(c.count || 0),
      children: Array.isArray(c.children) ? c.children.map(mapCat) : []
    });

    return (data as any[]).map(mapCat);
  } catch (error) {
    console.error('[COMPATIBILITY] Error fetching compatible categories:', error);
    return [];
  }
};

/**
 * Obtiene la lista de motos compatibles para un producto específico
 */
export const fetchProductCompatibility = async (productId: number): Promise<{ brand: string, model: string, year?: string }[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/catalog/product-compatibility/${productId}`);
    if (!response.ok) throw new Error('Error al obtener compatibilidad');
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[COMPATIBILITY] Error fetching product compatibility:', error);
    return [];
  }
};

/**
 * Obtiene productos compatibles usando el motor optimizado
 */
export const fetchCompatibleProducts = async (
  brand: string, 
  model: string, 
  year?: string,
  categoryId?: number,
  page: number = 1,
  perPage: number = 20
): Promise<{ products: Product[], totalPages: number, totalProducts: number }> => {
  try {
    // 1. Get compatible SKUs from our high-performance SQLite DB on Vercel
    const skuPath = `${API_BASE}/api/vehicles?action=compatible-skus&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&page=${page}&per_page=${perPage}`;
    const yearParam = (year && year !== 'General' && year !== '') ? `&year=${encodeURIComponent(year)}` : '';
    
    const skuRes = await fetch(skuPath + yearParam);
    const skus: string[] = await skuRes.json();
    
    if (skus.length === 0) return { products: [], totalPages: 1, totalProducts: 0 };

    // 2. Fetch the actual products natively from PostgreSQL
    let fetchUrl = `${API_BASE}/api/catalog/products-by-skus?skus=${skus.slice(0, perPage).join(',')}`;
    if (categoryId) fetchUrl += `&category_id=${categoryId}`;

    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    const products = (data as any[]).map(p => ({
      id: p.id,
      title: p.title || p.name,
      slug: p.slug,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      regularPrice: typeof p.regularPrice === 'string' ? parseFloat(p.regularPrice) : p.regularPrice,
      sku: p.sku || `REF-${p.id}`,
      image: p.image || p.images?.[0]?.src || '',
      images: (p.images || []).map((img: any) => ({ src: img.src || img, alt: p.title || p.name })),
      inStock: p.inStock,
      category: p.category || 'General',
      categorySlug: p.categorySlug || 'recambios',
      categoryId: p.categoryId || 0,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      attributes: p.attributes || [],
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0
    }));

    return { 
      products, 
      totalPages: products.length < perPage ? page : page + 1, 
      totalProducts: products.length 
    };
  } catch (error) {
    console.error('[COMPATIBILITY] Error fetching products:', error);
    return { products: [], totalPages: 1, totalProducts: 0 };
  }
};

/**
 * VEHICLE DISCOVERY API (MASTER LIST)
 * Endpoints habilitados por Uri para el Selector de Moto
 */

export const fetchMasterBrands = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${API_BASE}/api/vehicles?action=brands`);
        const data = await res.json();
        return data as string[];
    } catch (error) {
        console.error('[MASTER-LIST] Error fetching brands:', error);
        return [];
    }
};

export const fetchMasterModels = async (brand: string): Promise<string[]> => {
    if (!brand) return [];
    try {
        const res = await fetch(`${API_BASE}/api/vehicles?action=models&brand=${encodeURIComponent(brand)}`);
        const data = await res.json();
        return data as string[];
    } catch (error) {
        console.error('[MASTER-LIST] Error fetching models:', error);
        return [];
    }
};

export const fetchMasterYears = async (brand: string, model: string): Promise<string[]> => {
    if (!brand || !model) return [];
    try {
        const res = await fetch(`${API_BASE}/api/vehicles?action=years&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
        const data = await res.json();
        return data as string[];
    } catch (error) {
        console.error('[MASTER-LIST] Error fetching years:', error);
        return [];
    }
};
