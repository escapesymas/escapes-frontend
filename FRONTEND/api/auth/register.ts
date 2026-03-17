import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROXY_TARGET_URL = process.env.WC_URL || 'https://backendescapes.com';
const WOO_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, email, password } = req.body;

  // Validar campos requeridos
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos: username, email, password" });
  }

  try {
    const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

    // Usar la API de WooCommerce para crear clientes (no la API de WordPress)
    const wcRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "User-Agent": "EscapesApp/1.0"
      },
      body: JSON.stringify({
        email,
        username,
        password,
        first_name: username,
        billing: {
          email: email
        }
      }),
    });

    const wcData = await wcRes.json();
    console.log("[AUTH REGISTER] WooCommerce response:", wcRes.status, wcData);

    if (!wcRes.ok) {
      const errorMessage = wcData.message || wcData.error || "Error al crear cliente";
      console.error("[AUTH REGISTER ERROR] WooCommerce:", errorMessage);
      return res.status(wcRes.status).json({ error: errorMessage });
    }

    // Cliente creado exitosamente, ahora hacer login para obtener token JWT
    const loginRes = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EscapesApp/1.0"
      },
      body: JSON.stringify({ username, password }),
    });

    const loginData = await loginRes.json();
    console.log("[AUTH REGISTER] JWT response:", loginRes.status);

    if (!loginRes.ok) {
      // Cliente creado pero login falló - devolver datos parciales
      console.warn("[AUTH REGISTER] Cliente creado pero JWT falló");
      return res.status(200).json({
        token: "",
        user_email: email,
        user_display_name: wcData.first_name || username,
        user_id: wcData.id,
        warning: "Cliente creado pero no se pudo obtener token automáticamente. Por favor, inicia sesión."
      });
    }

    res.status(200).json(loginData);
  } catch (err) {
    console.error("[AUTH REGISTER ERROR]:", err);
    res.status(500).json({ error: "Error interno al registrar usuario" });
  }
}
