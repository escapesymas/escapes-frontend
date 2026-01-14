export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
}

const KEY = "escapesymas_session";
const WP = "https://backendescapes.com";

// =====================
// LOGIN (JWT)
// =====================

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${WP}/wp-json/jwt-auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: data.message || "Credenciales incorrectas"
    };
  }

  const session: Session = {
    token: data.token,
    user_email: data.user_email,
    user_display_name: data.user_display_name
  };

  saveSession(session);

  return {
    success: true,
    user: {
      email: data.user_email,
      name: data.user_display_name
    }
  };
}

// =====================
// REGISTER (via Vercel API)
// =====================

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error al registrarse");
  }

  return json;
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
