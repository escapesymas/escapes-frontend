
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import { Buffer } from 'buffer';

// Permitir certificados auto-firmados o con errores en el backend (necesario para algunos entornos de WP)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CONFIGURACIÓN DE CLAVES SEGURAS ---
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';
const SUMUP_API_KEY = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';
const PROXY_TARGET_URL = 'https://backendescapes.com';

// Middleware para parsear JSON - IMPORTANTE: Límite alto para Base64
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Servir archivos estáticos del build de React
app.use(express.static(join(__dirname, 'dist')));

/**
 * Prepara las cabeceras para el proxy
 */
const addProxyHeaders = (req) => {
  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers.origin;
  delete headers.referer;
  delete headers.connection;

  const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

  return {
    ...headers,
    'host': 'backendescapes.com',
    'Authorization': `Basic ${auth}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
};

/**
 * Manejador genérico de respuestas del Proxy
 */
const handleProxyResponse = async (targetUrl, req, res) => {
  try {
    const headers = addProxyHeaders(req);
    console.log(`[PROXY] --> ${req.method} ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(`[PROXY ERROR] a ${targetUrl}:`, err.message);
    res.status(502).json({ error: "Bad Gateway", details: "No se pudo conectar con el backend de WordPress." });
  }
};

// --- RUTAS DE PROXY ---
app.use('/wp-json', async (req, res) => {
  await handleProxyResponse(`${PROXY_TARGET_URL}/wp-json${req.url}`, req, res);
});

app.use('/wp-fallback', async (req, res) => {
  await handleProxyResponse(`${PROXY_TARGET_URL}${req.url}`, req, res);
});

// --- ENDPOINTS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos: username, email, password" });
  }

  try {
    const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

    // Usar la API de WooCommerce para crear clientes (no la API de WordPress)
    // Las credenciales de WooCommerce tienen permiso para crear clientes, no usuarios WP
    const wcRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
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
      // WooCommerce devolvió un error
      const errorMessage = wcData.message || wcData.error || "Error al crear cliente";
      console.error("[AUTH REGISTER ERROR] WooCommerce:", errorMessage);
      return res.status(wcRes.status).json({ error: errorMessage });
    }

    // Cliente creado exitosamente, ahora hacer login para obtener token JWT
    const loginRes = await fetch(`${PROXY_TARGET_URL}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const loginData = await loginRes.json();
    console.log("[AUTH REGISTER] JWT response:", loginRes.status);

    if (!loginRes.ok) {
      // Cliente creado pero login falló - devolver datos parciales con la info del cliente
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
    console.error("[AUTH REGISTER ERROR]:", err.message);
    res.status(500).json({ error: "Error interno al registrar usuario" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

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

    if (!wp.ok) {
      const errorMessage = data.message || data.error || "Login fallido";
      return res.status(wp.status).json({ error: errorMessage });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]:", err.message);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});

// --- ENDPOINTS DE API INTERNA ---
app.post('/api/checkout', async (req, res) => {
  const { amount, orderRef, currency, merchantEmail } = req.body;
  if (!SUMUP_API_KEY) return res.status(500).json({ message: "Configuración incompleta: Falta SUMUP_SECRET_KEY" });

  try {
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: orderRef,
        amount,
        currency: currency || 'EUR',
        pay_to_email: merchantEmail,
        description: `Pedido ${orderRef}`,
        return_url: `${req.protocol}://${req.get('host')}/?payment_success=true&order=${orderRef}`
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error interno en la pasarela de pagos" });
  }
});

// --- RUTA CATCH-ALL PARA SPA ---
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n================================================`);
  console.log(`  Escapes y Más - Servidor Iniciado`);
  console.log(`  Puerto: ${PORT}`);
  console.log(`  Backend: ${PROXY_TARGET_URL}`);
  console.log(`================================================\n`);
});
