
import { WOO_CONFIG, STORE_CONFIG } from '../storeData';
import { Product, WooProduct, OrderPayload, Order, User, WooCategory, Category } from '../types';

export const isConfigValid = () => {
  return WOO_CONFIG.baseUrl && WOO_CONFIG.consumerKey;
};

const getAuthHeaders = () => {
  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const makeRequest = async (path: string, options: RequestInit = {}) => {
  let baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  let url = `${baseUrl}/wp-json${path}`;

  const headers = {
    ...getAuthHeaders(),
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
      throw new Error(`Error del Servidor (${response.status}): Respuesta no JSON.`);
    }

    // Capturamos el total de páginas de los headers
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return { data, totalPages };

  } catch (error: any) {
    console.error("[API FETCH ERROR]", error);
    throw error;
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  if (!isConfigValid()) throw new Error("Configuración incompleta");

  try {
    const { data } = await makeRequest('/wc/v3/products/categories?per_page=100&hide_empty=true');
    const wooCats = data as WooCategory[];
    return wooCats.map(c => ({
      id: c.id,
      name: c.name,
      parent: c.parent,
      description: c.description,
      image: c.image ? c.image.src : '',
      count: c.count
    }));
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
      categoryId: p.categories?.[0]?.id || 0,
      description: p.short_description || p.description || '',
      stock: p.stock_quantity ?? (p.stock_status === 'instock' ? 99 : 0),
      inStock: p.stock_status === 'instock',
      sku: p.sku || '',
      attributes: p.attributes || [],
      images: p.images || [],
    }));
  } catch (error) {
    console.error('[WC] Failed to fetch products by IDs:', error);
    return [];
  }
};

export const fetchProducts = async (
  searchQuery?: string,
  categoryId?: number,
  page: number = 1,
  perPage: number = 20,
  orderBy: string = 'date',
  order: string = 'desc'
): Promise<{ products: Product[], totalPages: number }> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");

  let path = `/wc/v3/products?per_page=${perPage}&page=${page}&status=publish&orderby=${orderBy}&order=${order}`;

  if (searchQuery) path += `&search=${encodeURIComponent(searchQuery)}`;
  if (categoryId) path += `&category=${categoryId}`;

  const BROKEN_IMG_URL = "https://backendescapes.com/wp-content/uploads/2026/01/Sprint20Filter20P1420Filtro20de20Aire20Yamaha20T-150202015-.jpg";

  try {
    const { data, totalPages } = await makeRequest(path);
    const wooProducts = data as WooProduct[];

    const products = wooProducts.map(p => {
      let imageUrl = p.images.length > 0 ? p.images[0].src : '';
      if (!imageUrl || imageUrl === BROKEN_IMG_URL) {
        imageUrl = STORE_CONFIG.defaultProductImage;
      }

      return {
        id: p.id,
        title: p.name,
        price: parseFloat(p.price || p.regular_price || "0"),
        regularPrice: parseFloat(p.regular_price || p.price || "0"),
        sku: p.sku || `REF-${p.id}`,
        image: imageUrl,
        inStock: p.stock_status === 'instock',
        category: p.categories.length > 0 ? p.categories[0].name : 'General',
        permalink: p.permalink,
        attributes: p.attributes.map(attr => ({ name: attr.name, options: attr.options })),
        description: p.description,
        shortDescription: p.short_description
      };
    });

    return { products, totalPages };
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

export const fetchCustomerOrders = async (customerId: number): Promise<Order[]> => {
  const { data } = await makeRequest(`/wc/v3/orders?customer=${customerId}`);
  return data as Order[];
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
 */
export const updateCustomerAvatar = async (userId: number, avatarUrl: string): Promise<boolean> => {
  if (!userId || userId === 0) return false;

  try {
    await makeRequest(`/wc/v3/customers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        meta_data: [
          {
            key: '_custom_avatar',
            value: avatarUrl
          }
        ]
      })
    });
    console.log('[AVATAR] Avatar updated for user:', userId);
    return true;
  } catch (error) {
    console.error('[AVATAR] Failed to update avatar:', error);
    return false;
  }
};
