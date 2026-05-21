import { Product, Category, Order, User, UserRank, AvatarOption } from '../types';
import { getSession } from './auth';

// Configuration
export const API_BASE = '/api';

/**
 * Legacy API helper to maintain compatibility with existing components
 */
export const makeRequest = async (path: string, options: RequestInit = {}): Promise<{ data: any }> => {
  // Gracefully intercept legacy Stripe payment intent request
  if (path.includes('create-payment-intent')) {
    return {
      data: {
        client_secret: 'mock_secret_123',
        publishable_key: 'pk_test_123',
        stripe_account: 'acct_123'
      }
    };
  }

  // Normalize path to point to /api/ on VPS backend
  let apiPath = path;
  if (path.startsWith('/wc/v3/')) {
    apiPath = `${API_BASE}/${path.substring(7)}`;
  } else if (!path.startsWith('/api/')) {
    apiPath = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  }

  const response = await fetch(apiPath, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }

  return { data };
};

/**
 * Fetch catalog products from Postgres
 */
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
  if (moto && moto.brand && moto.model) {
    return fetchCompatibleProducts(moto.brand, moto.model, moto.year, categoryId, page, perPage);
  }

  let url = `${API_BASE}/catalog/products?page=${page}&per_page=${perPage}`;
  if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
  if (categoryId) url += `&category_id=${categoryId}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Error fetching products: ${res.status}`);
  }

  // Expose headers logic for count
  const totalProducts = parseInt(res.headers.get('X-WP-Total') || '0') || data.length || 0;
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1') || 1;

  // Map to Product format if needed (server already returns mapped product)
  return {
    products: data,
    totalPages,
    totalProducts
  };
};

/**
 * Fetch product by ID
 */
export const fetchProductById = async (id: number): Promise<Product> => {
  const res = await fetch(`${API_BASE}/catalog/product/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error fetching product: ${res.status}`);
  }
  return data;
};

/**
 * Fetch categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  return [
    { id: 1, name: "Sistemas de Escape", slug: "escapes", parent: 0, count: 0, description: "Silenciosos, colectores y líneas completas de alto rendimiento.", image: "https://images.unsplash.com/photo-1532588237936-a14a3818bc79?auto=format&fit=crop&q=80&w=800" },
    { id: 2, name: "Frenos de Competición", slug: "frenos", parent: 0, count: 0, description: "Máxima potencia y control: bombas radiales, discos y pastillas.", image: "https://images.unsplash.com/photo-1563618147570-36034c4f0282?auto=format&fit=crop&q=80&w=800" },
    { id: 3, name: "Ciclista & Chasis", slug: "suspensiones", parent: 0, count: 0, description: "Estabilidad extrema con suspensiones Pro y componentes de chasis.", image: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800" },
    { id: 4, name: "Electrónica & ECU", slug: "electronica", parent: 0, count: 0, description: "Gestión de motor, Quickshifters y telemetría de competición.", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800" },
    { id: 5, name: "Transmisión & Desarrollo", slug: "transmision", parent: 0, count: 0, description: "Kits de arrastre reforzados, piñones y coronas aligeradas.", image: "https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800" },
    { id: 6, name: "Mantenimiento & Fluidos", slug: "mantenimiento", parent: 0, count: 0, description: "Filtros de alto flujo y lubricantes de máxima protección.", image: "https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=800" },
    { id: 7, name: "Neumáticos & Paddock", slug: "neumaticos", parent: 0, count: 0, description: "Gomas de alto agarre, calentadores y equipamiento de garaje.", image: "https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=800" },
    { id: 8, name: "Cascos", slug: "cascos", parent: 0, count: 0, description: "Cascos integrales, modulares y de motocross.", image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800" },
    { id: 9, name: "Equipación Piloto", slug: "equipacion", parent: 0, count: 0, description: "Monos, chaquetas, guantes y botas de circuito y carretera.", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800" },
    { id: 10, name: "Accesorios & Maletas", slug: "accesorios", parent: 0, count: 0, description: "Maletas, soportes y accesorios de viaje.", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800" }
  ];
};

/**
 * Fetch compatible categories for a vehicle brand and model
 */
export const fetchCompatibleCategories = async (brand: string, model: string, year?: string): Promise<Category[]> => {
  try {
    const skuPath = `${API_BASE}/vehicles?action=compatible-skus&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
    const yearParam = (year && year !== 'General' && year !== '') ? `&year=${encodeURIComponent(year)}` : '';
    
    const skuRes = await fetch(skuPath + yearParam);
    if (!skuRes.ok) return [];
    const skus: string[] = await skuRes.json();
    if (skus.length === 0) return [];

    // Sample the first 100 SKUs to quickly compute active categories
    const sampleSkus = skus.slice(0, 100);
    const prodRes = await fetch(`${API_BASE}/catalog/products-by-skus?skus=${encodeURIComponent(sampleSkus.join(','))}`);
    if (!prodRes.ok) return [];
    const products: Product[] = await prodRes.json();

    const categoryCounts: Record<number, number> = {};
    const categoriesMapped = await fetchCategories();

    products.forEach(p => {
      const catId = p.categoryId || 0;
      if (catId > 0) {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    });

    return categoriesMapped.map(c => ({
      ...c,
      count: categoryCounts[c.id] || 0
    })).filter(c => c.count > 0);
  } catch (error) {
    console.error('[API] Error fetching compatible categories:', error);
    return [];
  }
};

/**
 * Fetch products compatible with a vehicle brand/model/year
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
    const skuPath = `${API_BASE}/vehicles?action=compatible-skus&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
    const yearParam = (year && year !== 'General' && year !== '') ? `&year=${encodeURIComponent(year)}` : '';
    
    const skuRes = await fetch(skuPath + yearParam);
    if (!skuRes.ok) return { products: [], totalPages: 1, totalProducts: 0 };
    const skus: string[] = await skuRes.json();
    
    if (skus.length === 0) return { products: [], totalPages: 1, totalProducts: 0 };

    const startIdx = (page - 1) * perPage;
    const paginatedSkus = skus.slice(startIdx, startIdx + perPage);
    if (paginatedSkus.length === 0) return { products: [], totalPages: 1, totalProducts: 0 };

    let url = `${API_BASE}/catalog/products-by-skus?skus=${encodeURIComponent(paginatedSkus.join(','))}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    const prodRes = await fetch(url);
    const products: Product[] = await prodRes.json();

    const totalProducts = skus.length;
    const totalPages = Math.ceil(totalProducts / perPage);

    return {
      products,
      totalPages,
      totalProducts
    };
  } catch (error) {
    console.error('[API] Error fetching compatible products:', error);
    return { products: [], totalPages: 1, totalProducts: 0 };
  }
};

/**
 * Fetch products by IDs
 */
export const fetchProductsByIds = async (ids: number[]): Promise<Product[]> => {
  if (ids.length === 0) return [];
  try {
    const res = await fetch(`${API_BASE}/catalog/products-by-skus?ids=${ids.join(',')}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Error fetching products by IDs:', error);
    return [];
  }
};

/**
 * Create Order in PostgreSQL
 */
export const createOrder = async (orderData: any): Promise<{ success: boolean; id?: number; error?: string }> => {
  try {
    // Adapter to translate WooCommerce OrderPayload to new /api/orders/create payload
    const cart = orderData.line_items?.map((item: any) => ({
      id: item.product_id,
      quantity: item.quantity
    })) || [];

    const shippingData = {
      firstName: orderData.billing?.first_name || orderData.shipping?.first_name || '',
      lastName: orderData.billing?.last_name || orderData.shipping?.last_name || '',
      address: orderData.billing?.address_1 || orderData.shipping?.address_1 || '',
      city: orderData.billing?.city || orderData.shipping?.city || '',
      zip: orderData.billing?.postcode || orderData.shipping?.postcode || '',
      phone: orderData.billing?.phone || ''
    };

    const payload = {
      userEmail: orderData.billing?.email || '',
      cart,
      shippingData,
      paymentMethod: orderData.payment_method || 'sumup_gateway',
      promoCode: ''
    };

    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error creating order: ${res.status}`);
    }

    return { success: true, id: data.orderId || data.id };
  } catch (error: any) {
    console.error('[API] createOrder error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update Order status (calls /api/orders/finalize)
 */
export const updateOrderStatus = async (
  orderId: number,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/orders/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        status,
        paymentId: `update-status-${status}`
      })
    });
    return res.ok;
  } catch (error) {
    console.error('[API] updateOrderStatus failed:', error);
    return false;
  }
};

/**
 * Fetch orders for a logged-in user
 */
export const fetchCustomerOrders = async (customerId: number, status: string = 'any'): Promise<Order[]> => {
  const session = getSession();
  const userEmail = session?.email || session?.user_email;
  if (!userEmail) {
    throw new Error('No se pudo encontrar el email del usuario para cargar pedidos.');
  }

  const endpoint = `${API_BASE}/orders/my-orders?userEmail=${encodeURIComponent(userEmail)}`;
  const response = await fetch(endpoint);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al cargar los pedidos');
  }

  // Map to format that components expect:
  // Order { id, status, date_created, total, line_items: [{ id, name, quantity, total }] }
  return data.map((order: any) => ({
    id: order.id,
    status: order.status,
    date_created: order.createdAt,
    total: order.total.toString(),
    line_items: order.items.map((item: any) => ({
      id: item.id,
      name: item.name || `Producto #${item.product_id}`,
      quantity: item.quantity,
      total: ((item.price * item.quantity) / 100).toString()
    }))
  }));
};

/**
 * Fetch user details by email
 */
export const fetchCustomerByEmail = async (email: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/auth?action=get-profile&email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('[API] Error fetching customer by email:', error);
    return null;
  }
};

/**
 * Search users (for mentions/autocomplete)
 */
export const searchUsers = async (query: string): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/auth?action=search-users&q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Error searching users:', error);
    return [];
  }
};

/**
 * Update user profile
 */
export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/auth?action=update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        billing: data.billing,
        garage: data.garage,
        avatarUrl: data.avatarUrl
      })
    });
    return res.ok;
  } catch (error) {
    console.error('[API] updateCustomer error:', error);
    return false;
  }
};

/**
 * Save user cart to server
 */
export const saveUserCart = async (userId: number, cartItems: any[]): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/auth?action=save-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cart: cartItems })
    });
    return res.ok;
  } catch (error) {
    console.error('[API] saveUserCart error:', error);
    return false;
  }
};

/**
 * Get user cart from server
 */
export const getUserCart = async (userId: number): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/auth?action=get-profile&id=${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.cart || [];
  } catch (error) {
    console.error('[API] getUserCart error:', error);
    return [];
  }
};

/**
 * Fetch rank metadata for a user
 */
export const fetchUserRank = async (userId: number): Promise<UserRank> => {
  if (!userId || userId === 0) return {
    level: 1, title: 'Novato', xp: 0, xpToNext: 100, discount: 0, color: '#9CA3AF', icon: '🔰'
  };

  try {
    const res = await fetch(`${API_BASE}/user/${userId}/rank`);
    const rank = await res.json();
    
    const getRankMeta = (title: string) => {
      switch (title) {
        case 'Novato': return { color: '#9CA3AF', icon: '🔰' };
        case 'Aprendiz': return { color: '#60A5FA', icon: '🧢' };
        case 'Piloto': return { color: '#34D399', icon: '🏁' };
        case 'Experto': return { color: '#FBBF24', icon: '⚡' };
        case 'Profesional': return { color: '#F97316', icon: '🏆' };
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
      xpToNext: rank.next_xp || rank.xpRequired || 100,
      discount: rank.discount || 0,
      color: meta.color,
      icon: meta.icon
    };
  } catch (error) {
    console.error('[API] Error fetching rank:', error);
    return {
      level: 1, title: 'Novato', xp: 0, xpToNext: 100, discount: 0, color: '#9CA3AF', icon: '🔰'
    };
  }
};

/**
 * Forum thread liking
 */
export const toggleLike = async (targetType: 'topic' | 'reply', targetId: number, token?: string): Promise<{ liked: boolean }> => {
  try {
    const session = getSession();
    const currentUserId = session?.user_id || session?.id;

    if (!currentUserId) throw new Error("Debes iniciar sesión para dar like");

    const res = await fetch(`${API_BASE}/forum?action=toggle-like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetType: targetType === 'topic' ? 'post' : targetType,
        targetId,
        currentUserId
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al dar like');

    return { liked: data.liked };
  } catch (error) {
    console.error('[API] Error toggling like:', error);
    throw error;
  }
};

/**
 * No-op for activity registration (handled automatically on write by VPS backend)
 */
export const registerActivity = async (type: 'post' | 'reply', targetId: number, token?: string): Promise<void> => {
  // Backend automatically registers activity and rewards XP during write operations
};

/**
 * Mock leaderboard since not natively defined in index.ts routes
 */
export const fetchLeaderboard = async (limit: number = 10): Promise<any[]> => {
  return [];
};

/**
 * Fetch compatibility for product by id
 */
export const fetchProductCompatibility = async (productId: number): Promise<{ brand: string, model: string, year?: string }[]> => {
  try {
    const res = await fetch(`${API_BASE}/catalog/product-compatibility/${productId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Error fetching product compatibility:', error);
    return [];
  }
};

/**
 * Static avatars selection
 */
export const fetchAvatars = async (): Promise<AvatarOption[]> => {
  return [
    { id: 1, url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=150', title: 'Casco Racing Rojo' },
    { id: 2, url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=150', title: 'Moto Naked' },
    { id: 3, url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=150', title: 'Piloto Mono Cuero' },
    { id: 4, url: 'https://images.unsplash.com/photo-1502444390311-53697eb4b62d?auto=format&fit=crop&q=80&w=150', title: 'Piloto Pista' },
    { id: 5, url: 'https://images.unsplash.com/photo-1578844251758-2f71da645217?auto=format&fit=crop&q=80&w=150', title: 'Bandera Cuadros' },
  ];
};

/**
 * Update user avatar
 */
export const updateCustomerAvatar = async (userId: number, avatarData: string | number): Promise<boolean> => {
  if (!userId || userId === 0) return false;
  let avatarUrl = '';
  if (typeof avatarData === 'number') {
    const list = await fetchAvatars();
    avatarUrl = list.find(a => a.id === avatarData)?.url || '';
  } else {
    avatarUrl = avatarData;
  }
  return updateCustomer(userId, { avatarUrl });
};

/**
 * Upload profile picture to /api/upload/avatar
 */
export const uploadCustomerPhoto = async (userId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('userId', userId.toString());

  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error subiendo foto');
  return data.url;
};

export const fetchMasterBrands = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${API_BASE}/vehicles?action=brands`);
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
        const res = await fetch(`${API_BASE}/vehicles?action=models&brand=${encodeURIComponent(brand)}`);
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
        const res = await fetch(`${API_BASE}/vehicles?action=years&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
        const data = await res.json();
        return data as string[];
    } catch (error) {
        console.error('[MASTER-LIST] Error fetching years:', error);
        return [];
    }
};

export const uploadFile = async (file: File): Promise<{ id: number; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/generic`, {
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

export const fetchPendingOrders = async (customerId: number, email?: string): Promise<Order[]> => {
  try {
    let url = `${API_BASE}/orders?status=pending`;
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
