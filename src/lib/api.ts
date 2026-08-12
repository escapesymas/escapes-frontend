import { FilterOptions } from '../types';

const API_BASE = typeof window !== 'undefined' && window.location.port === '3000'
  ? 'http://localhost:3001/api'
  : '/api';

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path.startsWith('/') ? path : '/' + path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export async function fetchProducts(params?: {
  search?: string;
  category_id?: number;
  page?: number;
  per_page?: number;
  universal?: boolean;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  attrs?: Record<string, string>;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category_id) searchParams.set('category_id', String(params.category_id));
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  if (params?.universal) searchParams.set('universal', 'true');
  if (params?.brand) searchParams.set('brand', params.brand);
  if (params?.min_price !== undefined) searchParams.set('min_price', String(params.min_price));
  if (params?.max_price !== undefined) searchParams.set('max_price', String(params.max_price));
  if (params?.in_stock) searchParams.set('in_stock', 'true');
  if (params?.attrs && Object.keys(params.attrs).length > 0) {
    searchParams.set('attrs', JSON.stringify(params.attrs));
  }

  const url = `${API_BASE}/catalog/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const res = await fetch(url);
  const total = Number(res.headers.get('X-WP-Total') || 0);
  const totalPages = Number(res.headers.get('X-WP-TotalPages') || 0);
  const products = await res.json();
  return { products, total, totalPages };
}

export async function fetchFilterOptions(params?: {
  category_id?: number;
  search?: string;
  universal?: boolean;
}): Promise<FilterOptions> {
  const searchParams = new URLSearchParams();
  if (params?.category_id) searchParams.set('category_id', String(params.category_id));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.universal) searchParams.set('universal', 'true');

  const url = `${API_BASE}/catalog/filters?${searchParams.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return { brands: [], price_min: 0, price_max: 1000, attributes: {} };
  return res.json();
}

export async function fetchProductsBySkus(skus: string[], category_id?: number) {
  if (skus.length === 0) return { products: [], total: 0, totalPages: 0 };
  const searchParams = new URLSearchParams();
  searchParams.set('skus', skus.join(','));
  if (category_id) searchParams.set('category_id', String(category_id));
  
  const url = `${API_BASE}/catalog/products-by-skus?${searchParams.toString()}`;
  const res = await fetch(url);
  const products = await res.json();
  return { products, total: products.length, totalPages: 1 };
}

export async function fetchProduct(id: number) {
  const res = await apiFetch(`/catalog/product/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProductBySlug(slug: string) {
  const res = await apiFetch(`/catalog/product-by-slug/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProductBySku(sku: string) {
  const res = await apiFetch(`/catalog/product-by-sku/${sku}/variants`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProductCompatibility(id: number) {
  const res = await apiFetch(`/catalog/product-compatibility/${id}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCategories() {
  const res = await apiFetch(`/catalog/categories`);
  if (!res.ok) return [];
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionData {
  token: string;
  user_id: number;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  avatarUrl: string;
  role: string;
}

export interface UserBilling {
  address_1?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  nif?: string;
  addresses?: unknown[];
  [key: string]: unknown;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: string;
  rank: string;
  xp: number;
  billing: UserBilling;
  garage: string[];
  cart: Record<string, unknown>[];
}

export async function apiLogin(username: string, password: string): Promise<SessionData> {
  const res = await apiFetch(`/auth?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  return data as SessionData;
}

export async function apiRegister(
  username: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<SessionData> {
  const res = await apiFetch(`/auth?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, firstName, lastName, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');
  return data as SessionData;
}

export async function apiGetProfile(email: string): Promise<UserProfile> {
  const res = await apiFetch(`/auth?action=get-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar el perfil');
  return data as UserProfile;
}

export async function apiUpdateProfile(
  userId: number,
  params: {
    firstName?: string;
    lastName?: string;
    email?: string;
    billing?: UserBilling;
    garage?: string[];
    avatarUrl?: string;
  }
): Promise<{ success: boolean }> {
  const res = await apiFetch(`/auth?action=update-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar el perfil');
  return data;
}

export async function apiDeleteAccount(userId: number): Promise<{ success: boolean }> {
  const res = await apiFetch(`/auth?action=delete-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar la cuenta');
  return data;
}

export async function apiChangePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean }> {
  const res = await apiFetch(`/auth?action=change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña');
  return data;
}

export interface OrderSummary {
  id: number;
  status: string;
  total: number;
  payment_method: string;
  billing: Record<string, unknown>;
  created_at: string;
}

export interface OrderItemDetail {
  id: number;
  productId: number;
  productName: string;
  image: string;
  quantity: number;
  price: number;
}

export interface OrderDetail {
  id: number;
  total: number;
  status: string;
  paymentId: string;
  shippingData: Record<string, unknown>;
  createdAt: string;
  items: OrderItemDetail[];
}

export async function apiGetOrders(userId: number): Promise<OrderSummary[]> {
  const res = await apiFetch(`/orders?userId=${userId}&status=`);
  if (!res.ok) return [];
  return res.json();
}

export async function apiGetMyOrders(userEmail: string): Promise<OrderDetail[]> {
  const res = await apiFetch(`/orders/my-orders?userEmail=${encodeURIComponent(userEmail)}`);
  if (!res.ok) return [];
  return res.json();
}
