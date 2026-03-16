import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROXY_TARGET_URL = process.env.WC_URL || 'https://backendescapes.com';
const WOO_KEY = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_SECRET = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

async function fetchAvatar(data: any) {
  if (WOO_KEY && WOO_SECRET && data.user_email) {
    try {
      const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
      const wooResponse = await fetch(
        `${PROXY_TARGET_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(data.user_email)}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (wooResponse.ok) {
        const customers = await wooResponse.json();
        if (customers && customers.length > 0) {
          const customer = customers[0];
          if (customer.meta_data) {
            const customAvatar = customer.meta_data.find((m: any) => m.key === '_custom_avatar');
            if (customAvatar && customAvatar.value) {
              data.avatarUrl = customAvatar.value;
            }
          }
          if (!data.avatarUrl && customer.avatar_url) {
            data.avatarUrl = customer.avatar_url;
          }
        }
      }
    } catch (e) {
      console.warn('[AUTH] Avatar fetch failed:', e);
    }
  }
}

async function login(req: VercelRequest, res: VercelResponse) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Faltan campos" });

  const wp = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ username, password }),
  });

  const data = await wp.json();
  if (!wp.ok) return res.status(wp.status).json({ error: data.message || data.error || "Login fallido" });

  await fetchAvatar(data);
  return res.status(200).json(data);
}

async function register(req: VercelRequest, res: VercelResponse) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Faltan campos" });

  const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
  const wcRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ email, username, password, first_name: username, billing: { email } }),
  });

  const wcData = await wcRes.json();
  if (!wcRes.ok) return res.status(wcRes.status).json({ error: wcData.message || wcData.error || "Error al crear cliente" });

  const loginRes = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ username, password }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) return res.status(200).json({
    token: "", user_email: email, user_display_name: wcData.first_name || username, user_id: wcData.id,
    warning: "Cliente creado pero no se pudo obtener token automáticamente."
  });

  await fetchAvatar(loginData);
  return res.status(200).json(loginData);
}

async function socialLogin(req: VercelRequest, res: VercelResponse) {
  const { provider, token } = req.body;
  if (!provider || !token) return res.status(400).json({ error: "Faltan campos" });

  const wp = await fetch(`${PROXY_TARGET_URL}/wp-json/escapes/v1/social-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ provider, token }),
  });

  const data = await wp.json();
  if (!wp.ok) return res.status(wp.status).json({ error: data.message || data.error || "Login social fallido" });

  await fetchAvatar(data);
  return res.status(200).json(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  // Determine action from URL path or query
  const action = req.query.action || req.url?.split('/').pop()?.split('?')[0];

  switch (action) {
    case 'login': return login(req, res);
    case 'register': return register(req, res);
    case 'social-login': return socialLogin(req, res);
    default: return res.status(400).json({ error: "Acción no válida" });
  }
}
