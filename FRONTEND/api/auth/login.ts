import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROXY_TARGET_URL = process.env.WC_URL || 'https://backendescapes.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password, provider, token } = req.body;

  // Determinar si es un Login Social o Tradicional
  const isSocialLogin = !!(provider && token);
  const isStandardLogin = !!(username && password);

  if (!isSocialLogin && !isStandardLogin) {
    return res.status(400).json({ error: "Faltan campos requeridos para iniciar sesión." });
  }

  try {
    let wpResponse;
    
    // 1. Authenticate with WP (JWT plugin OR custom social endpoint)
    if (isSocialLogin) {
      wpResponse = await fetch(`${PROXY_TARGET_URL}/wp-json/escapes/v1/social-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "EscapesApp/1.0"
        },
        body: JSON.stringify({ provider, token }),
      });
    } else {
      wpResponse = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "EscapesApp/1.0"
        },
        body: JSON.stringify({ username, password }),
      });
    }

    const ObjectData = await wpResponse.json();

    // Propagar el status de error correctamente
    if (!wpResponse.ok) {
      const errorMessage = ObjectData.message || ObjectData.error || "Login fallido";
      return res.status(wpResponse.status).json({ error: errorMessage });
    }

    // 2. Fetch customer data from WooCommerce to get custom avatar
    const WOO_KEY = process.env.WC_CONSUMER_KEY || process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
    const WOO_SECRET = process.env.WC_CONSUMER_SECRET || process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

    if (WOO_KEY && WOO_SECRET && ObjectData.user_email) {
      try {
        const credentials = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
        const wooResponse = await fetch(
          `${PROXY_TARGET_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(ObjectData.user_email)}`,
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

            // Extract custom avatar from metadata
            if (customer.meta_data) {
              const customAvatar = customer.meta_data.find((m: any) => m.key === '_custom_avatar');
              if (customAvatar && customAvatar.value) {
                ObjectData.avatarUrl = customAvatar.value;
                console.log('[LOGIN] Custom avatar found:', customAvatar.value);
              }
            }

            // Fallback to default avatar_url if no custom avatar
            if (!ObjectData.avatarUrl && customer.avatar_url) {
              ObjectData.avatarUrl = customer.avatar_url;
            }
          }
        }
      } catch (avatarError) {
        // Non-critical error - continue with login without avatar
        console.warn('[LOGIN] Failed to fetch avatar:', avatarError);
      }
    }

    res.status(200).json(ObjectData);
  } catch (err: any) {
    console.error("[AUTH LOGIN ERROR]:", err.message);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
}
