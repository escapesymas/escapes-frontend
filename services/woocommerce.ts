import { WOO_CONFIG, STORE_CONFIG } from '../storeData';
import { Product, WooProduct, OrderPayload, Order, User, WooCategory, Category } from '../types';

export const isConfigValid = () => {
  return WOO_CONFIG.baseUrl && WOO_CONFIG.consumerKey;
};

/**
 * Helper: Genera Headers con Basic Auth
 * Esto es más seguro y evita problemas con algunos firewalls que bloquean query params largos.
 */
const getAuthHeaders = () => {
  // Codificamos las credenciales en Base64 para el estándar Basic Auth
  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * CORE: Realiza peticiones a la API con validación robusta y sistema de rescate
 */
const makeRequest = async (path: string, options: RequestInit = {}) => {
  const isBrowser = typeof window !== 'undefined';
  
  // Limpiamos la URL base
  let baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");

  // Si estamos en entorno navegador y usamos proxy (vite.config), ajustamos si es necesario.
  // Sin embargo, para esta refactorización, usaremos la URL completa para asegurar el fallback correcto.
  
  // 1. Construir URL Principal (Pretty Permalinks)
  // Ej: https://tudominio.com/wp-json/wc/v3/products
  let url = `${baseUrl}/wp-json${path}`;

  // Combinar headers
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  try {
    console.log(`[API] Request: ${url}`);
    
    let response = await fetch(url, { ...options, headers });

    // 2. PROTOCOLO DE RESCATE (FALLBACK)
    // Si la ruta amigable falla con 404, intentamos la ruta paramétrica nativa de WP.
    if (response.status === 404) {
      console.warn(`[API] 404 en ruta estándar. Activando Fallback (?rest_route=)...`);
      
      // Descomponemos el path para mantener query strings (ej: ?search=...)
      const [route, query] = path.split('?');
      
      // Construimos la URL de rescate: /?rest_route=/wc/v3/products&search=...
      const fallbackUrl = `${baseUrl}/?rest_route=${route}${query ? '&' + query : ''}`;
      
      console.log(`[API] Fallback URL: ${fallbackUrl}`);
      response = await fetch(fallbackUrl, { ...options, headers });
    }

    // 3. VALIDACIÓN DE CONTENT-TYPE (Robustez)
    // Antes de hacer .json(), verificamos que el servidor no nos haya devuelto una página de error HTML.
    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      // Si llegamos aquí, el servidor devolvió HTML (error 500, página de maintenance, firewall, etc.)
      const text = await response.text();
      console.error(`[API CRITICAL] La respuesta no es JSON. Status: ${response.status}`);
      console.error(`[API URL] ${response.url}`);
      // Mostramos los primeros 200 caracteres para debug
      console.error(`[API RESPONSE PREVIEW] ${text.substring(0, 200)}...`);
      
      throw new Error(`Error del Servidor (${response.status}): Recibimos HTML en lugar de datos. Verifica Permalinks o Firewall.`);
    }

    // 4. Procesar JSON
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    
    return data;

  } catch (error: any) {
    console.error("[API FETCH ERROR]", error);
    throw error;
  }
};

/**
 * Fetches all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  if (!isConfigValid()) throw new Error("Configuración incompleta");
  
  try {
    const data: WooCategory[] = await makeRequest('/wc/v3/products/categories?per_page=100&hide_empty=true');
    return data.map(c => ({
      id: c.id,
      name: c.name,
      parent: c.parent,
      description: c.description,
      image: c.image ? c.image.src : '',
      count: c.count
    }));
  } catch (error) {
    console.error("Categories Fetch Error:", error);
    throw error;
  }
};

/**
 * Fetches products
 */
export const fetchProducts = async (searchQuery?: string, categoryId?: number): Promise<Product[]> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");
  
  let path = `/wc/v3/products?per_page=20&status=publish`;
  
  if (searchQuery) path += `&search=${encodeURIComponent(searchQuery)}`;
  if (categoryId) path += `&category=${categoryId}`;

  // URL específica que se debe tratar como "sin imagen"
  const BROKEN_IMG_URL = "https://backendescapes.com/wp-content/uploads/2026/01/Sprint20Filter20P1420Filtro20de20Aire20Yamaha20T-150202015-.jpg";

  try {
    const data: WooProduct[] = await makeRequest(path);

    return data.map(p => {
      // Lógica de validación de imagen
      let imageUrl = p.images.length > 0 ? p.images[0].src : '';
      
      // Si la imagen coincide con la rota o está vacía, usamos el placeholder
      if (!imageUrl || imageUrl === BROKEN_IMG_URL) {
        imageUrl = STORE_CONFIG.defaultProductImage;
      }

      return {
        id: p.id,
        title: p.name,
        price: parseFloat(p.price || p.regular_price || "0"),
        regularPrice: parseFloat(p.regular_price || p.price || "0"),
        image: imageUrl,
        inStock: p.stock_status === 'instock',
        category: p.categories.length > 0 ? p.categories[0].name : 'General',
        permalink: p.permalink,
        attributes: p.attributes.map(attr => ({ name: attr.name, options: attr.options })),
        description: p.description,
        shortDescription: p.short_description
      };
    });
  } catch (error) {
    console.error("Products Fetch Error:", error);
    throw error;
  }
};

/**
 * Creates an order
 */
export const createOrder = async (orderData: OrderPayload | any): Promise<{ success: boolean; id?: number; error?: string }> => {
  if (!isConfigValid()) return { success: false, error: "Configuración inválida" };

  try {
    const data = await makeRequest('/wc/v3/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Fetches orders for customer
 */
export const fetchCustomerOrders = async (customerId: number): Promise<Order[]> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");
  return await makeRequest(`/wc/v3/orders?customer=${customerId}`);
};

/**
 * Updates customer details
 */
export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
  if (!isConfigValid()) return false;
  
  try {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      billing: data.billing
    };
    await makeRequest(`/wc/v3/customers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error("Customer Update Error:", error);
    return false;
  }
};