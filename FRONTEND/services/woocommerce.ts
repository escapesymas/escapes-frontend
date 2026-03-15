
import { WOO_CONFIG, STORE_CONFIG } from '../storeData';
import { Product, WooProduct, OrderPayload, Order, User, WooCategory, Category, UserRank } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

export const isConfigValid = () => {
  // baseUrl can be empty string for relative URLs, only check it's defined
  return WOO_CONFIG.baseUrl !== undefined && WOO_CONFIG.consumerKey;
};

const getAuthHeaders = () => {
  // NOTE: Authorization is handled by server.js proxy, not needed here
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

export const makeRequest = async (path: string, options: RequestInit = {}) => {
  let baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");

  // Cache busting: Add timestamp to avoid caching issues with W3 Total Cache / WP REST Cache
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
  if (!isConfigValid()) throw new Error("Configuración incompleta");

  // Implementation of 24h caching to avoid redundant paginated fetches
  const CACHE_KEY = 'escapes_categories_cache';
  const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return data as Category[];
      }
    }
  } catch (e) { console.error("Cache read error", e); }

  try {
    let allWooCats: WooCategory[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const { data, totalPages: pages } = await makeRequest(`/wc/v3/products/categories?per_page=100&page=${page}`);
      allWooCats = [...allWooCats, ...(data as WooCategory[])];
      totalPages = pages;
      page++;
    } while (page <= totalPages);

    const categories = allWooCats.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent: c.parent,
      description: c.description,
      image: c.image ? c.image.src : '',
      count: c.count
    }));

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: categories,
        timestamp: Date.now()
      }));
    } catch (e) { console.error("Cache write error", e); }

    return categories;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene productos específicos por sus IDs
 */
export const fetchProductsByIds = async (ids: number[]): Promise<Product[]> => {
  if (!isConfigValid() || ids.length === 0) return [];

  try {
    const { data } = await makeRequest(`/wc/v3/products?include=${ids.join(',')}&per_page=${ids.length}`);
    return (data as any[]).map(p => ({
      id: p.id,
      title: p.name,
      slug: p.slug,
      price: parseFloat(p.price) || 0,
      regularPrice: parseFloat(p.regular_price) || parseFloat(p.price) || 0,
      image: p.images?.[0]?.src || '',
      category: p.categories?.[0]?.name || '',
      categorySlug: p.categories?.[0]?.slug || 'recambios',
      categoryId: p.categories?.[0]?.id || 0,
      description: p.short_description || p.description || '',
      stock: p.stock_quantity ?? (p.stock_status === 'instock' ? 99 : 0),
      inStock: p.stock_status === 'instock',
      sku: p.sku || '',
      attributes: p.attributes || [],
      images: p.images || [],
      averageRating: parseFloat(p.average_rating || "0"),
      ratingCount: p.rating_count || 0,
    }));
  } catch (error) {
    console.error('[WC] Failed to fetch products by IDs:', error);
    return [];
  }
};

// In-memory cache for search results to avoid redundant slow queries
const searchCache = new Map<string, { products: Product[], totalPages: number, totalProducts: number, timestamp: number }>();
const SEARCH_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

export const fetchProducts = async (
  searchQuery?: string,
  categoryId?: number,
  page: number = 1,
  perPage: number = 20,
  orderBy: string = 'date',
  order: string = 'desc',
  fast: boolean = false
): Promise<{ products: Product[], totalPages: number, totalProducts: number }> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");

  const BROKEN_IMG_URL = "https://backendescapes.com/wp-content/uploads/2026/01/Sprint20Filter20P1420Filtro20de20Aire20Yamaha20T-150202015-.jpg";

  const mapProduct = (p: WooProduct): Product => {
    let imageUrl = p.images.length > 0 ? p.images[0].src : '';
    if (!imageUrl || imageUrl === BROKEN_IMG_URL) {
      imageUrl = STORE_CONFIG.defaultProductImage;
    }
    return {
      id: p.id,
      title: p.name,
      slug: p.slug,
      price: parseFloat(p.price || p.regular_price || "0"),
      regularPrice: parseFloat(p.regular_price || p.price || "0"),
      sku: p.sku || `REF-${p.id}`,
      image: imageUrl,
      images: (p.images || []).map(img => ({ ...img, src: img.src })),
      inStock: p.stock_status === 'instock',
      category: p.categories.length > 0 ? p.categories[0].name : 'General',
      categorySlug: p.categories.length > 0 ? p.categories[0].slug : 'recambios',
      categoryId: p.categories.length > 0 ? p.categories[0].id : 0,
      permalink: p.permalink,
      attributes: p.attributes.map(attr => ({ name: attr.name, options: attr.options })),
      description: p.description,
      shortDescription: p.short_description,
      averageRating: parseFloat(p.average_rating || "0"),
      ratingCount: p.rating_count || 0,
    };
  };

  try {
    // If no search query, just fetch normally
    if (!searchQuery) {
      let path = `/wc/v3/products?per_page=${perPage}&page=${page}&status=publish&orderby=${orderBy}&order=${order}`;
      if (categoryId) path += `&category=${categoryId}`;

      const { data, totalPages, totalProducts } = await makeRequest(path);
      return { products: (data as WooProduct[]).map(mapProduct), totalPages, totalProducts };
    }

    // --- CACHE CHECK ---
    const cacheKey = `${searchQuery}_${categoryId || 0}_${page}_${perPage}_${orderBy}_${order}_${fast}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL)) {
      console.log(`[WC] Search cache hit for: ${searchQuery}`);
      return { products: cached.products, totalPages: cached.totalPages, totalProducts: cached.totalProducts };
    }

    // ENHANCED SEARCH: Search by title AND SKU in parallel
    const allProducts: Product[] = [];
    const seenIds = new Set<number>();
    let apiTotalPages = 1;
    let apiTotalProducts = 0;

    const titlePath = `/wc/v3/products?per_page=${perPage}&page=${page}&status=publish&orderby=${orderBy}&order=${order}&search=${encodeURIComponent(searchQuery)}${categoryId ? `&category=${categoryId}` : ''}`;
    const skuPath = `/wc/v3/products?per_page=${perPage}&status=publish&sku=${encodeURIComponent(searchQuery)}${categoryId ? `&category=${categoryId}` : ''}`;

    // Execute multiple search strategies in parallel to reduce wait time
    const results = await Promise.allSettled([
      makeRequest(titlePath),
      makeRequest(skuPath)
    ]);

    results.forEach(res => {
      if (res.status === 'fulfilled') {
        const { data, totalPages, totalProducts } = res.value;
        if (totalPages > apiTotalPages) apiTotalPages = totalPages;
        if (totalProducts > apiTotalProducts) apiTotalProducts = totalProducts;

        (data as WooProduct[]).forEach(p => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            allProducts.push(mapProduct(p));
          }
        });
      }
    });

    // 3. Fallback: only if we have very few results AND NOT IN FAST MODE, try the heavy description search
    if (!fast && allProducts.length < perPage / 2) {
      try {
        const extraPath = `/wc/v3/products?per_page=40&status=publish${categoryId ? `&category=${categoryId}` : ''}`;
        const { data: extraResults } = await makeRequest(extraPath);

        const searchLower = searchQuery.toLowerCase();
        (extraResults as WooProduct[]).forEach(p => {
          if (!seenIds.has(p.id)) {
            const matchesDesc = (p.description || '').toLowerCase().includes(searchLower);
            const matchesShortDesc = (p.short_description || '').toLowerCase().includes(searchLower);

            if (matchesDesc || matchesShortDesc) {
              seenIds.add(p.id);
              allProducts.push(mapProduct(p));
            }
          }
        });
      } catch { }
    }

    const result = {
      products: allProducts.slice(0, perPage),
      totalPages: Math.max(apiTotalPages, Math.ceil(allProducts.length / perPage)),
      totalProducts: Math.max(apiTotalProducts, allProducts.length)
    };

    // Save to cache
    searchCache.set(cacheKey, { ...result, timestamp: Date.now() });

    return result;
  } catch (error) {
    throw error;
  }
};

export const createOrder = async (orderData: OrderPayload | any): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    const { data } = await makeRequest('/wc/v3/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};



/**
 * Obtiene los pedidos pendientes de un cliente para recuperar carritos abandonados
 * Puede buscar por customerId o por email
 */
export const fetchPendingOrders = async (customerId: number, email?: string): Promise<Order[]> => {
  try {
    let query = '/wc/v3/orders?status=pending&per_page=5';

    if (customerId && customerId > 0) {
      query += `&customer=${customerId}`;
    } else if (email) {
      // Buscar por email en billing
      query += `&search=${encodeURIComponent(email)}`;
    } else {
      return [];
    }

    const { data } = await makeRequest(query);
    return data as Order[];
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
    const { data } = await makeRequest(`/wc/v3/customers?email=${encodeURIComponent(email)}`);
    const customers = data as any[];

    if (customers && customers.length > 0) {
      const customer = customers[0];
      // Check for saved avatar in metadata
      let avatarUrl = customer.avatar_url;
      if (customer.meta_data) {
        const customAvatar = customer.meta_data.find((m: any) => m.key === '_custom_avatar');
        if (customAvatar) {
          avatarUrl = customAvatar.value;
        }
      }

      const user = formatUserResponse(customer);
      user.avatarUrl = avatarUrl;
      return user;
    }
    return null;
  } catch (error) {
    console.error('[WC] Error fetching customer by email:', error);
    return null;
  }
};

export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
  try {
    const payload: any = {};

    // Only include fields that have values
    if (data.firstName) payload.first_name = data.firstName;
    if (data.lastName !== undefined) payload.last_name = data.lastName || '';
    if (data.email) payload.email = data.email;

    // Handle billing data - only include if there's actual data
    if (data.billing) {
      payload.billing = {
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        email: data.email || ''
      };

      // Add optional fields only if they have values
      if (data.billing.address_1) payload.billing.address_1 = data.billing.address_1;
      if (data.billing.city) payload.billing.city = data.billing.city;
      if (data.billing.postcode) payload.billing.postcode = data.billing.postcode;
      if (data.billing.phone) payload.billing.phone = data.billing.phone;
    }

    await makeRequest(`/wc/v3/customers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error('[WC] Error updating customer:', error);
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
    await makeRequest(`/wc/v3/customers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        meta_data: [
          {
            key: '_saved_cart',
            value: JSON.stringify(cartItems)
          },
          {
            key: '_saved_cart_date',
            value: new Date().toISOString()
          }
        ]
      })
    });
    console.log('[CART SYNC] Cart saved for user:', userId);
    return true;
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
    const { data } = await makeRequest(`/wc/v3/customers/${userId}`);
    const customer = data as any;

    if (customer.meta_data) {
      const savedCart = customer.meta_data.find((m: any) => m.key === '_saved_cart');
      if (savedCart && savedCart.value) {
        const parsed = JSON.parse(savedCart.value);
        console.log('[CART SYNC] Cart recovered for user:', userId, parsed);
        return parsed;
      }
    }
    return [];
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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
): Promise<boolean> => {
  try {
    await makeRequest(`/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    console.log(`[ORDER] Updated order ${orderId} to status: ${status}`);
    return true;
  } catch (error) {
    console.error('[ORDER] Failed to update status:', error);
    return false;
  }
};

/**
 * Obtiene los pedidos de un cliente
 */
export const fetchCustomerOrders = async (customerId: number, status: string = 'any'): Promise<Order[]> => {
  console.log('[ORDERS] 🔍 Fetching orders for customer ID:', customerId, '| Status filter:', status);

  // Validate customer ID
  if (!customerId || customerId === 0) {
    console.error('[ORDERS] ❌ Invalid customer ID:', customerId);
    throw new Error('ID de cliente inválido. Por favor, cierra sesión y vuelve a iniciar sesión.');
  }

  // Build endpoint
  let endpoint = `/wc/v3/orders?customer=${customerId}&per_page=50`;
  if (status !== 'any') {
    endpoint += `&status=${status}`;
  }

  console.log('[ORDERS] 📡 API endpoint:', endpoint);

  try {
    const { data } = await makeRequest(endpoint);
    console.log('[ORDERS] ✅ Received', Array.isArray(data) ? data.length : 0, 'orders');

    if (!Array.isArray(data)) {
      console.error('[ORDERS] ❌ API returned non-array:', data);
      throw new Error('Respuesta inesperada del servidor');
    }

    return data as Order[];
  } catch (error: any) {
    console.error('[ORDERS] ❌ Error fetching orders:', error);
    throw new Error(error.message || 'Error al cargar pedidos del servidor');
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
  try {
    // Usar la API de WordPress Media para buscar por título
    const { data } = await makeRequest('/wp/v2/media?search=AVATAR&per_page=20&media_type=image');

    return (data as any[]).map(media => ({
      id: media.id,
      url: media.source_url || media.guid?.rendered || '',
      title: media.title?.rendered || `Avatar ${media.id}`
    })).filter(a => a.url); // Solo devolver los que tienen URL
  } catch (error) {
    console.error('[AVATAR] Failed to fetch avatars from media library:', error);
    return [];
  }
};

/**
 * Actualiza el avatar del cliente en WooCommerce (guarda en metadata)
 * Guarda tanto _custom_avatar (URL) como wp_user_avatar (ID) para persistencia.
 */
export const updateCustomerAvatar = async (userId: number, avatarData: string | number): Promise<boolean> => {
  if (!userId || userId === 0) return false;

  const meta_data = [];

  if (typeof avatarData === 'number') {
    // Es un ID (Media Library)
    meta_data.push({ key: 'wp_user_avatar', value: avatarData });
  } else {
    // Es una URL (Legacy o Fallback)
    meta_data.push({ key: '_custom_avatar', value: avatarData });
    // Intenta guardar también en wp_user_avatar si parece un ID, o déjalo.
    // Si solo tenemos URL, no podemos deducir el ID fácilmente sin buscar.
  }

  try {
    await makeRequest(`/wc/v3/customers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ meta_data })
    });
    console.log('[AVATAR] Avatar updated for user:', userId);
    return true;
  } catch (error) {
    console.error('[AVATAR] Failed to update avatar:', error);
    return false;
  }
};

/**
 * Sube una foto personalizada para el cliente
 */
export const uploadFile = async (file: File): Promise<{ id: number; url: string }> => {
  let baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  // Use WP API Media endpoint
  const url = `${baseUrl}/wp-json/wp/v2/media`;

  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Disposition': `attachment; filename="${file.name}"`,
    'Cache-Control': 'no-cache'
  };

  try {
    const response = await fetch(url + `?_t=${new Date().getTime()}`, {
      method: 'POST',
      headers: headers,
      body: file
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Error al subir archivo');
    }

    const data = await response.json();
    console.log('[UPLOAD] Success:', data.id, data.source_url);
    return { id: data.id, url: data.source_url };
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

    // Usar nuestro endpoint local en server.js (o Vercel function)
    const response = await fetch(`/api/upload/avatar`, {
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
    // Usamos endpoints de WP o WC. WC Customers es más seguro si tenemos keys de tienda.
    const { data } = await makeRequest(`/wc/v3/customers?search=${encodeURIComponent(query)}&per_page=5`);
    const customers = data as any[];

    return customers.map(c => ({
      id: c.id,
      name: c.username || c.first_name + ' ' + c.last_name,
      avatar: c.avatar_url || ''
    }));
  } catch (error) {
    console.error('[SEARCH USERS] Error:', error);
    return [];
  }
};

// =====================
// PADDOCK GAMIFICATION
// =====================

/**
 * Obtiene el rango y stats de un usuario
 */
export const fetchUserRank = async (userId: number): Promise<UserRank> => {
  if (!userId || userId === 0) return {
    level: 1, title: 'Novato', xp: 0, xpToNext: 100, discount: 0, color: '#9CA3AF', icon: '🔰'
  };

  try {
    const { data } = await makeRequest(`/paddock/v1/user/${userId}/rank`);
    const rank = data as any;

    // Mapear colores e iconos según el título (fallback si el backend no lo envía)
    const getRankMeta = (title: string) => {
      switch (title) {
        case 'Novato': return { color: '#9CA3AF', icon: '🔰' };
        case 'Aficionado': return { color: '#60A5FA', icon: '🧢' };
        case 'Entusiasta': return { color: '#34D399', icon: '🔥' };
        case 'Experto': return { color: '#FBBF24', icon: '⚡' };
        case 'Pro Racer': return { color: '#F97316', icon: '🏆' };
        case 'Leyenda': return { color: '#EF4444', icon: '👑' };
        case 'Administrador': return { color: '#ef4444', icon: '🛡️' };
        default: return { color: '#9CA3AF', icon: '👤' };
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
      icon: meta.icon
    };
  } catch (error) {
    console.error('[PADDOCK] Error fetching rank:', error);
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
    let path = `/escapes/v1/compatible-products?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&page=${page}&per_page=${perPage}`;
    if (year && year !== 'General' && year !== '') path += `&year=${encodeURIComponent(year)}`;
    if (categoryId) path += `&category=${categoryId}`;

    const { data } = await makeRequest(path);
    
    // El motor de búsqueda flexible a veces no devuelve headers de conteo exactos, 
    // así que estimamos o usamos la longitud de la data
    const products = (data as any[]).map(p => ({
      id: p.id,
      title: p.name,
      slug: p.slug,
      price: parseFloat(p.price || "0"),
      regularPrice: parseFloat(p.regular_price || p.price || "0"),
      sku: p.sku || `REF-${p.id}`,
      image: p.images?.[0]?.src || '',
      images: (p.images || []).map((img: any) => ({ src: img.src, alt: p.name })),
      inStock: p.stock_status === 'instock',
      category: p.categories?.[0]?.name || 'General',
      categorySlug: p.categories?.[0]?.slug || 'recambios',
      categoryId: p.categories?.[0]?.id || 0,
      description: p.description,
      shortDescription: p.short_description
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
