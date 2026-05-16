import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../lib/db.js";
import { eq } from "drizzle-orm";

// PARCHE DE EMERGENCIA: Ignorar errores de SSL caducado en el backend
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PROXY_TARGET_URL = process.env.WC_URL || 'https://backendescapes.com';
const WOO_KEY = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_SECRET = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (action === 'login' || action === 'social-login') {
      return await handleLogin(req, res);
    } else if (action === 'register') {
      return await handleRegister(req, res);
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err: any) {
    console.error("[AUTH ERROR]:", err.message);
    res.status(500).json({ 
      error: "Error de sincronización PostgreSQL (VPS)", 
      message: err.message,
      hint: "Asegúrate de que Vercel tenga la nueva DATABASE_URL y haz un redeploy"
    });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { username, password, provider, token } = req.body;
  const isSocialLogin = !!(provider && token);

  const wpUrl = isSocialLogin 
    ? `${PROXY_TARGET_URL}/wp-json/escapes/v1/social-login`
    : `${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`;

  const wpResponse = await fetch(wpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify(isSocialLogin ? { provider, token } : { username, password }),
  });

  let ObjectData;
  try {
    const text = await wpResponse.text();
    try {
      ObjectData = JSON.parse(text);
    } catch (e: any) {
      return res.status(500).json({ error: "Respuesta no JSON de WP", detail: text.substring(0, 500) });
    }
  } catch(e: any) {
    return res.status(500).json({ error: "Error al leer respuesta de WP", detail: e.message });
  }

  if (!wpResponse.ok) {
    return res.status(wpResponse.status).json({ error: ObjectData.message || ObjectData.code || "Login failed" });
  }

  // Fetch avatar (keep existing logic from login.ts)
  if (ObjectData.user_email) {
    try {
      const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
      const wooResponse = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(ObjectData.user_email)}`, {
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
      });
      if (wooResponse.ok) {
        const customers = await wooResponse.json();
        if (customers?.[0]) {
          const customer = customers[0];
          const customAvatar = customer.meta_data?.find((m: any) => m.key === '_custom_avatar');
          if (customAvatar?.value) ObjectData.avatarUrl = customAvatar.value;
          else if (customer.avatar_url) ObjectData.avatarUrl = customer.avatar_url;
        }
      }
    } catch (e) { console.warn('[AUTH] Avatar fetch failed', e); }
  }

  // --- SINCRONIZACIÓN CON POSTGRESQL (FASE 1) ---
  try {
    if (ObjectData.user_email) {
      const email = ObjectData.user_email;
      const username = ObjectData.user_nicename || ObjectData.user_display_name || email.split('@')[0];
      
      const userRole = (email === 'info@escapesymas.com') ? 'admin' : 'customer';

      const [dbUser] = await db.insert(schema.users).values({
          wpId: ObjectData.user_id,
          username: ObjectData.user_nicename,
          email: email,
          firstName: ObjectData.user_display_name,
          avatarUrl: ObjectData.avatarUrl || null,
          role: userRole
      })
      .onConflictDoUpdate({
          target: schema.users.email,
          set: {
              username: ObjectData.user_nicename,
              firstName: ObjectData.user_display_name,
              avatarUrl: ObjectData.avatarUrl || null,
              role: userRole,
              updatedAt: new Date()
          }
      })
      .returning();

      console.log(`[DB] Usuario sincronizado en Postgres: ${email}`);

      // 3. Devolver datos combinados
      ObjectData.role = dbUser?.role || 'customer';
      ObjectData.id = dbUser?.id || ObjectData.user_id; 
      
      console.log(`[DB] Login exitoso con rol: ${ObjectData.role}`);
    }
  } catch (dbErr: any) {
    console.error("[DB ERROR] Sincronización de usuario fallida:", dbErr.message);
    ObjectData.db_sync = "failed";
  }

  return res.status(200).json(ObjectData);
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

  const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
  const wcRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ email, username, password, first_name: username, billing: { email } }),
  });

  let wcData;
  try {
    const text = await wcRes.text();
    try {
      wcData = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: "WooCommerce no devolvió JSON", detail: text.substring(0, 500) });
    }
  } catch(e: any) {
    return res.status(500).json({ error: "Error leyendo WooCommerce", detail: e.message });
  }

  if (!wcRes.ok) return res.status(wcRes.status).json({ error: wcData.message || wcData.code || "Registration failed" });

  // Auto-login after registration
  const loginRes = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "EscapesApp/1.0" },
    body: JSON.stringify({ username, password }),
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    return res.status(200).json({
      token: "",
      user_email: email,
      user_display_name: wcData.first_name || username,
      user_id: wcData.id,
      warning: "Account created. Please log in manually."
    });
  }

  return res.status(200).json(loginData);
}
