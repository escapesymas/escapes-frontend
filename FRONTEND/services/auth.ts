export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
  warning?: string;
  avatarUrl?: string;
}

const KEY = "escapesymas_session";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

async function safeFetch<T>(url: string, options: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    const json = JSON.parse(text);

    // Si la respuesta no es ok, extraer el mensaje de error del JSON
    if (!res.ok) {
      const errorMessage = json.error || json.message || "Error del servidor";
      return {
        ok: false,
        status: res.status,
        data: json as T,
        error: errorMessage,
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      data: json as T,
    };
  } catch {
    console.error("Invalid JSON from API:", text);
    return {
      ok: false,
      status: res.status,
      data: null,
      error: "Respuesta inválida del servidor",
    };
  }
}

// =====================
// API
// =====================

interface RegisterResult extends Session {
  user_id?: number;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const res = await safeFetch<RegisterResult>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok || !res.data) {
    // Extraer mensaje de error del servidor
    const errorData = res.data as any;
    throw new Error(errorData?.error || res.error || "Registro fallido");
  }

  return res.data;
}

export async function loginUser(username: string, password: string): Promise<Session> {
  const res = await safeFetch<Session>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok || !res.data) {
    throw new Error(res.error || "Login fallido");
  }

  return res.data;
}

// =====================
// Session
// =====================

export function saveSession(session: object) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function logoutSession() {
  localStorage.removeItem(KEY);
}
