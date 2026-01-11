
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

export const fetchProducts = async (
  searchQuery?: string, 
  categoryId?: number, 
  page: number = 1, 
  perPage: number = 20
): Promise<{ products: Product[], totalPages: number }> => {
  if (!isConfigValid()) throw new Error("Configuración inválida");
  
  let path = `/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
  
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

export const updateCustomer = async (userId: number, data: Partial<User>): Promise<boolean> => {
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
    return false;
  }
};
