export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
}

const KEY = "escapesymas_session";

async function safeFetch(url: string, options: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();

  try {
    const json = JSON.parse(text);
    return { ok: res.ok, status: res.status, json };
  } catch {
    console.error("Invalid JSON from API:", text);
    return {
      ok: false,
      status: res.status,
      json: { error: "Respuesta inválida del servidor" }
    };
  }
}

// =====================
// API
// =====================

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const { ok, json } = await safeFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!ok) {
    throw new Error(json.error || "Registro fallido");
  }

  return json;
}

export async function loginUser(username: string, password: string) {
  const { ok, json } = await safeFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!ok) {
    throw new Error(json.error || "Lo
