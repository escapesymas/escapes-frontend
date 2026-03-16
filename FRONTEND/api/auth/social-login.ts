import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROXY_TARGET_URL = process.env.WC_URL || 'https://backendescapes.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { provider, token } = req.body;

  if (!provider || !token) {
    return res.status(400).json({ error: "Faltan campos requeridos: provider, token" });
  }

  try {
    const wp = await fetch(`${PROXY_TARGET_URL}/wp-json/escapes/v1/social-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EscapesApp/1.0"
      },
      body: JSON.stringify({ provider, token }),
    });

    const data = await wp.json();

    if (!wp.ok) {
      const errorMessage = data.message || data.error || "Login social fallido";
      return res.status(wp.status).json({ error: errorMessage });
    }

    // Attempt to grab avatar from Woo if not provided by social login endpoint natively
    if (data.user_email) {
      const WOO_KEY = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
      const WOO_SECRET = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';
      
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
              if (customAvatar && customAvatar.value && !data.avatarUrl) {
                data.avatarUrl = customAvatar.value;
              }
            }
            if (!data.avatarUrl && customer.avatar_url) {
              data.avatarUrl = customer.avatar_url;
            }
          }
        }
      } catch (avatarError) {
        console.warn('[SOCIAL LOGIN] Failed to fetch avatar:', avatarError);
      }
    }

    res.status(200).json(data);
  } catch (err: any) {
    console.error(`[AUTH SOCIAL LOGIN ERROR] ${provider}:`, err.message);
    res.status(500).json({ error: `Error interno al iniciar sesión con ${provider}` });
  }
}
