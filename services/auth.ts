import { WOO_CONFIG } from '../storeData';
import { User } from '../types';

const STORAGE_KEY = 'moto_shop_session';

// --- Session Persistence Helpers ---

export const saveSession = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
};

export const getSession = (): User | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const logoutSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// FIX: This function was removed as it caused errors because WOO_CONFIG does not contain `consumerKey` and `consumerSecret`.
// Authentication is now handled by a server-side proxy, so client-side key handling is obsolete and insecure.
/*
const getAuthUrl = (endpoint: string) => {
  const cleanBaseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${cleanBaseUrl}${endpoint}${separator}consumer_key=${WOO_CONFIG.consumerKey}&consumer_secret=${WOO_CONFIG.consumerSecret}`;
};
*/

// --- API Logic ---

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanBaseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");

  try {
    // 1. Obtener Token JWT
    const tokenResponse = await fetch(`${cleanBaseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const tokenData = await tokenResponse.json();

    // Fallback Mock para Demo si falla la API o es usuario demo explícito
    if (!tokenResponse.ok || !tokenData.token) {
      if (username === 'demo' && password === 'demo') {
        return {
          success: true,
          user: {
            id: 999,
            username: 'demo_racer',
            email: 'piloto@demo.com',
            firstName: 'Marc',
            lastName: 'Márquez',
            avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            billing: {
              address_1: 'Circuit de Barcelona-Catalunya',
              city: 'Montmeló',
              postcode: '08160',
              phone: '+34 600 123 456'
            }
          }
        };
      }
      
      let errorMsg = tokenData.message || 'Credenciales incorrectas';
      if (tokenData.code === '[jwt_auth] invalid_username') errorMsg = 'Usuario no encontrado';
      if (tokenData.code === '[jwt_auth] incorrect_password') errorMsg = 'Contraseña incorrecta';
      
      throw new Error(errorMsg);
    }

    const token = tokenData.token;

    // Decode token to find user ID as a safety fallback
    let userIdFromToken = 0;
    try {
        // JWT payload is the second part
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        // Structure usually: data: { user: { id: "1" } }
        if (payload.data && payload.data.user && payload.data.user.id) {
            userIdFromToken = parseInt(payload.data.user.id);
        }
    } catch (e) {
        console.warn("Could not decode token payload", e);
    }

    // 2. Obtener datos del cliente usando el Token
    let userData: any = null;

    try {
        // Attempt 1: Try getting full Customer profile via 'me' endpoint
        const userResponse = await fetch(`${cleanBaseUrl}/wp-json/wc/v3/customers/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
            userData = await userResponse.json();
        } else {
            // Attempt 2: If 'me' failed (e.g. 404), try fetching by ID
            if (userIdFromToken) {
                 try {
                     const idResponse = await fetch(`${cleanBaseUrl}/wp-json/wc/v3/customers/${userIdFromToken}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                     });
                     if (idResponse.ok) {
                         userData = await idResponse.json();
                     }
                 } catch (ignore) {}
            }

            // Attempt 3: If still no data, fallback to generic WP User endpoint
            if (!userData) {
                if (userResponse.status !== 404) {
                    console.warn(`Customer fetch failed (${userResponse.status}). Fallback to WP User.`);
                }
                
                const wpUserResponse = await fetch(`${cleanBaseUrl}/wp-json/wp/v2/users/me`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (wpUserResponse.ok) {
                    const wpUserData = await wpUserResponse.json();
                    userData = {
                        id: wpUserData.id,
                        username: wpUserData.slug,
                        email: tokenData.user_email,
                        first_name: wpUserData.name,
                        last_name: '',
                        avatar_url: wpUserData.avatar_urls?.['96'],
                        billing: {} 
                    };
                }
            }
        }
    } catch (err) {
        console.error("Network error fetching profile, using token data fallback", err);
    }

    // 3. Fallback final
    if (!userData) {
        if (!userIdFromToken) console.warn("Logged in but could not retrieve User Profile");
        
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
      avatarUrl: userData.avatar_url || undefined,
      billing: {
        address_1: userData.billing?.address_1 || '',
        city: userData.billing?.city || '',
        postcode: userData.billing?.postcode || '',
        phone: userData.billing?.phone || ''
      }
    };

    return { success: true, user };

  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: error.message || 'Error de conexión con el servidor' };
  }
};

/**
 * Registers a new customer in WooCommerce
 */
export const registerUser = async (data: {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional depending on WP config, but usually required
}): Promise<{ success: boolean; error?: string }> => {
  
  try {
    // FIX: The URL is now a relative path handled by the server proxy, which adds authentication.
    // The previous `getAuthUrl` function caused an error and has been removed.
    const url = '/wp-json/wc/v3/customers';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        password: data.password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.code === 'registration-error-email-exists') {
        throw new Error('El email ya está registrado.');
      }
      if (result.code === 'registration-error-username-exists') {
        throw new Error('El nombre de usuario ya existe.');
      }
      throw new Error(result.message || 'Error al crear la cuenta.');
    }

    return { success: true };

  } catch (error: any) {
    console.error("Registration Error:", error);
    return { success: false, error: error.message || "Error de conexión." };
  }
};