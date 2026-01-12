
import { WOO_CONFIG } from '../storeData';
import { User } from '../types';

const STORAGE_KEY = 'moto_shop_session';

export const saveSession = (user: User) => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getSession = (): User | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const logoutSession = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanBaseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");

  try {
    const tokenResponse = await fetch(`${cleanBaseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.token) {
      if (username === 'demo' && password === 'demo') {
        return {
          success: true,
          user: {
            id: 999, username: 'demo_racer', email: 'piloto@demo.com',
            firstName: 'Marc', lastName: 'Márquez',
            avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            billing: { address_1: 'Circuit de Barcelona', city: 'Montmeló', postcode: '08160', phone: '+34 600' }
          }
        };
      }
      throw new Error(tokenData.message || 'Credenciales incorrectas');
    }

    const token = tokenData.token;
    let userIdFromToken = 0;
    try {
        const parts = token.split('.');
        if (parts.length > 1) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            if (payload.data?.user?.id) userIdFromToken = parseInt(payload.data.user.id);
        }
    } catch (e) {
        console.warn("Could not decode token payload", e);
    }

    let userData: any = null;
    try {
        const userResponse = await fetch(`${cleanBaseUrl}/wp-json/wc/v3/customers/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userResponse.ok) userData = await userResponse.json();
    } catch (err) {}

    if (!userData) {
        userData = {
            id: userIdFromToken || 0,
            username: tokenData.user_nicename || username,
            email: tokenData.user_email || '',
            first_name: tokenData.user_display_name || username,
            last_name: '',
            avatar_url: '',
            billing: {}
        };
    }

    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      firstName: userData.first_name || userData.username,
      lastName: userData.last_name || '',
      token: token,
      avatarUrl: userData.avatar_url,
      billing: {
        address_1: userData.billing?.address_1 || '',
        city: userData.billing?.city || '',
        postcode: userData.billing?.postcode || '',
        phone: userData.billing?.phone || ''
      }
    };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error de conexión' };
  }
};

export const registerUser = async (data: any): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/wp-json/wc/v3/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        password: data.password
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al crear la cuenta.');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
