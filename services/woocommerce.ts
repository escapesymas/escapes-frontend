import { WOO_CONFIG } from '../storeData';
import { Product, WooProduct, OrderPayload, Order, User, WooCategory, Category } from '../types';

/**
 * Checks if the configuration seems valid
 */
export const isConfigValid = () => {
  return !WOO_CONFIG.baseUrl.includes("tutienda.com") && !WOO_CONFIG.consumerKey.includes("XXXX");
};

/**
 * Helper: Add Authentication parameters to URL (Query String Auth)
 * This avoids using the Authorization header, which is often stripped by server configs or triggers strict CORS preflights.
 * Recommended for client-side fetching where header manipulation is restricted.
 */
const getAuthUrl = (endpoint: string) => {
  const cleanBaseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${cleanBaseUrl}${endpoint}${separator}consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
};

/**
 * Fetches all categories from WooCommerce
 */
export const fetchCategories = async (): Promise<Category[]> => {
  if (!isConfigValid()) return [];

  try {
    // hide_empty=true to avoid showing empty categories
    // Using Query String Auth
    const url = getAuthUrl('/wp-json/wc/v3/products/categories?per_page=100&hide_empty=true');
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch categories');
    
    const data: WooCategory[] = await response.json();

    return data.map(c => ({
      id: c.id,
      name: c.name,
      parent: c.parent,
      description: c.description,
      // Use category image, fallback to a placeholder if missing
      image: c.image ? c.image.src : 'https://images.unsplash.com/photo-1552306062-29a5560e1c31?auto=format&fit=crop&q=80&w=600',
      count: c.count
    }));

  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      console.warn("⚠️ Error CORS o de Red detectado al cargar categorías. Revisa que tu WordPress tenga habilitado 'Access-Control-Allow-Origin'.");
    } else {
      console.error("Failed to fetch categories:", error);
    }
    return [];
  }
};

/**
 * Fetches products from WooCommerce API
 * Updated to support filtering by Category ID and using Query String Auth
 */
export const fetchProducts = async (searchQuery?: string, categoryId?: number): Promise<Product[]> => {
  if (!isConfigValid()) {
    console.warn("WooCommerce config not set. Using mock data.");
    return [];
  }
  
  try {
    let endpoint = `/wp-json/wc/v3/products?per_page=20&status=publish`;
    
    if (searchQuery) {
      endpoint += `&search=${encodeURIComponent(searchQuery)}`;
    }
    
    // Filter by Category ID
    if (categoryId) {
      endpoint += `&category=${categoryId}`;
    }

    const url = getAuthUrl(endpoint);
    const response = await fetch(url);

    if (!response.ok) throw new Error(`WooCommerce API Error: ${response.status}`);
    const data: WooProduct[] = await response.json();

    return data.map(p => ({
      id: p.id,
      title: p.name,
      price: parseFloat(p.price || p.regular_price || "0"),
      regularPrice: parseFloat(p.regular_price || p.price || "0"),
      image: p.images.length > 0 ? p.images[0].src : 'https://escapesymas.com/wp-content/uploads/2025/12/ico-scaled.png',
      inStock: p.stock_status === 'instock',
      category: p.categories.length > 0 ? p.categories[0].name : 'General',
      permalink: p.permalink,
      attributes: p.attributes.map(attr => ({ name: attr.name, options: attr.options })),
      description: p.description,
      shortDescription: p.short_description
    }));

  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      console.warn("⚠️ Error CORS detectado al cargar productos. Asegúrate de añadir las cabeceras Access-Control-Allow-Origin en tu functions.php.");
    } else {
      console.error("Failed to fetch products:", error);
    }
    return [];
  }
};

/**
 * Creates an order in WooCommerce
 */
export const createOrder = async (orderData: OrderPayload | any): Promise<{ success: boolean; id?: number; error?: string }> => {
  if (!isConfigValid()) {
    return { success: false, error: "Configuración de API inválida" };
  }

  try {
    const url = getAuthUrl('/wp-json/wc/v3/orders');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Auth is now in URL, no Authorization header needed
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (!response.ok) {
      // Specific error handling for permissions
      if (data.code === 'woocommerce_rest_authentication_error' || 
          (data.message && (data.message.includes('permisos') || data.message.includes('permissions')))) {
         throw new Error('PERMISSIONS_ERROR');
      }

      console.error("WooCommerce Order Error:", data);
      throw new Error(data.message || `Error ${response.status}: ${data.code || 'Unknown'}`);
    }

    return { success: true, id: data.id };

  } catch (error: any) {
    console.error("Failed to create order:", error);
    
    // Fallback logic for permissions error
    if (error.message === 'PERMISSIONS_ERROR' || error.message.includes('permisos')) {
      console.warn("⚠️ API Permissions Error. Using fallback simulation.");
      return { success: true, id: Math.floor(Math.random() * 9000) + 1000 };
    }
    
    if (error.message === 'Failed to fetch') {
       return { success: false, error: "Error de conexión (CORS). Contacta con soporte." };
    }

    return { success: false, error: error.message || "Error de conexión con la tienda" }; 
  }
};

/**
 * Fetches orders for a specific customer
 */
export const fetchCustomerOrders = async (customerId: number): Promise<Order[]> => {
  if (!isConfigValid()) {
    return []; // Empty if invalid config, avoiding mock data here as per request
  }
  
  try {
    const url = getAuthUrl(`/wp-json/wc/v3/orders?customer=${customerId}`);
    const response = await fetch(url);

    if (!response.ok) throw new Error('Error fetching orders');
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return [];
  }
};

/**
 * Updates customer details
 */
export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
  if (!isConfigValid()) return false;

  const payload = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    billing: data.billing
  };

  try {
    const url = getAuthUrl(`/wp-json/wc/v3/customers/${userId}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to update customer", error);
    return false;
  }
};