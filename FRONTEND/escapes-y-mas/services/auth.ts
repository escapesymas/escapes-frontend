
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WOO_CONFIG } from './storeData';

export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
  warning?: string;
  avatarUrl?: string; // Enhanced session with avatar
}

const KEY = "escapesymas_mobile_session";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

async function safeFetch<T>(url: string, options: RequestInit): Promise<ApiResult<T>> {
  // Use absolute URL from WOO_CONFIG
  const baseUrl = WOO_CONFIG.baseUrl.replace(/\/$/, "");
  // If url starts with http or https, use it as is, otherwise resolve against baseUrl
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  try {
    const res = await fetch(fullUrl, options);
    const text = await res.text();
    const json = JSON.parse(text);

    if (!res.ok) {
      const errorMessage = json.error || json.message || "Error del servidor";
      return { ok: false, status: res.status, data: json as T, error: errorMessage };
    }

    return { ok: res.ok, status: res.status, data: json as T };
  } catch (e) {
    console.error("Fetch Error:", e);
    return { ok: false, status: 0, data: null, error: "Error de conexión" };
  }
}

// =====================
// API
// =====================

/**
 * Login using WordPress JWT Auth plugin
 * Mirrors the logic from api/auth/login.ts but client-side
 */
export async function loginUser(username: string, password: string): Promise<Session> {
  // 1. Authenticate with JWT
  // Expects /wp-json/jwt-auth/v1/token to exist on the WP site
  const res = await safeFetch<any>("/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.error || "Login fallido");
  }

  const sessionData = res.data;

  // 2. Fetch extra data (Avatar) if possible
  // We can do this in a separate call or just return basic session first
  // For now, let's try to fetch user details to get the avatar
  if (sessionData.user_email) {
    try {
      // Basic Auth header for WP REST API to get customer details
      const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);
      const customerRes = await safeFetch<any[]>(`/wp-json/wc/v3/customers?email=${encodeURIComponent(sessionData.user_email)}`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (customerRes.ok && customerRes.data && customerRes.data.length > 0) {
        const customer = customerRes.data[0];
        // Check custom avatar meta
        if (customer.meta_data) {
          const customAvatar = customer.meta_data.find((m: any) => m.key === '_custom_avatar');
          if (customAvatar && customAvatar.value) {
            sessionData.avatarUrl = customAvatar.value;
          }
        }
        // Fallback
        if (!sessionData.avatarUrl && customer.avatar_url) {
          sessionData.avatarUrl = customer.avatar_url;
        }
      }
    } catch (e) {
      console.warn("Could not fetch avatar during login", e);
    }
  }

  return sessionData as Session;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<Session> {
  // Use WC Customers API to register
  // Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/#create-a-customer
  const credentials = btoa(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`);

  const payload = {
    email: data.email,
    first_name: data.firstName || '',
    last_name: data.lastName || '',
    username: data.username,
    password: data.password
  };

  const res = await safeFetch<any>("/wp-json/wc/v3/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(res.error || "Registro fallido");
  }

  // Auto-login after register
  return loginUser(data.username, data.password);
}


// =====================
// Session Management (AsyncStorage)
// =====================

export async function saveSession(session: Session) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function logoutSession() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.error("Failed to logout", e);
  }
}
