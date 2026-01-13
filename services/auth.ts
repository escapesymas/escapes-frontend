export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
}

const KEY = "escapesymas_session";

// =====================
// API
// =====================

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid register response");
  }
}

export async function loginUser(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid login response");
  }
}

// =====================
// Session
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
