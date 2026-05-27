const API_BASE = '/api';

export async function fetchProducts(params?: {
  search?: string;
  category_id?: number;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category_id) searchParams.set('category_id', String(params.category_id));
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));

  const url = `${API_BASE}/catalog/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const res = await fetch(url);
  const total = Number(res.headers.get('X-WP-Total') || 0);
  const totalPages = Number(res.headers.get('X-WP-TotalPages') || 0);
  const products = await res.json();
  return { products, total, totalPages };
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
  const res = await fetch(`${API_BASE}/catalog/product/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProductBySku(sku: string) {
  const res = await fetch(`${API_BASE}/catalog/product-by-sku/${sku}/variants`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProductCompatibility(id: number) {
  const res = await fetch(`${API_BASE}/catalog/product-compatibility/${id}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/catalog/categories`);
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
  billing: any;
  garage: string[];
  cart: any[];
}

export async function apiLogin(username: string, password: string): Promise<SessionData> {
  const res = await fetch(`${API_BASE}/auth?action=login`, {
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
  const res = await fetch(`${API_BASE}/auth?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, firstName, lastName, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');
  return data as SessionData;
}

export async function apiGetProfile(email: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth?action=get-profile&email=${encodeURIComponent(email)}`);
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
    billing?: any;
    garage?: string[];
    avatarUrl?: string;
  }
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/auth?action=update-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar el perfil');
  return data;
}

export async function apiDeleteAccount(userId: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/auth?action=delete-account`, {
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
  const res = await fetch(`${API_BASE}/auth?action=change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña');
  return data;
}
