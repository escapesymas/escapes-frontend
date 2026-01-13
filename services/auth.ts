export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
}

const KEY = "escapesymas_session";
const API = "https://backendescapes.com/wp-json";

// =====================
// AUTH API
// =====================

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API}/escapes/v1/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();

  try {
    const json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.message || "Error al registrarse");
    }

    return json;
  } catch (e) {
    console.error("REGISTER RAW RESPONSE:", text);
    throw new Error("Respuesta inválida del servidor");
  }
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${API}/jwt-auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();

  try {
    const json = JSON.parse(text);

    if (!res.ok) {
      throw new Error(json.message || "Error al iniciar sesión");
    }

    return json;
  } catch {
    console.error("LOGIN RAW RESPONSE:", text);
    throw new Error("Respuesta inválida del servidor");
  }
}

// =====================
// SESSION
// =====================

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutSession() {
  localStorage.removeItem(KEY);
}
