import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROXY_TARGET_URL = 'https://backendescapes.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password } = req.body;

  // Validar campos requeridos
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos: username, password" });
  }

  try {
    const wp = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await wp.json();

    // Propagar el status de error correctamente
    if (!wp.ok) {
      const errorMessage = data.message || data.error || "Login fallido";
      return res.status(wp.status).json({ error: errorMessage });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]:", err);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
}
