import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware para parsear JSON con límite aumentado para imágenes base64
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos del build de React
app.use(express.static(join(__dirname, 'dist')));

// Configuración común de Headers para los Proxies
const addProxyHeaders = (proxyReq) => {
  const headers = { ...proxyReq.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers.origin;
  delete headers.referer;
  return {
    ...headers,
    host: 'backendescapes.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
};

const handleProxyResponse = async (targetUrl, req, res) => {
  try {
    const headers = addProxyHeaders(req);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });
    
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });
    
    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(`Proxy Error to ${targetUrl}:`, err);
    res.status(500).json({ error: "Proxy Error" });
  }
};

// 1. Proxy Principal (Ruta Estándar /wp-json)
app.use('/wp-json', async (req, res) => {
  await handleProxyResponse(`https://backendescapes.com/wp-json${req.url}`, req, res);
});

// 2. Proxy de Rescate (Ruta Fallback ?rest_route=)
// Esto permite conectar a la API aunque los permalinks de WP estén rotos.
app.use('/wp-fallback', async (req, res) => {
  // req.url aquí ya incluye la query string (e.g. /?rest_route=/wc/v3/...)
  await handleProxyResponse(`https://backendescapes.com${req.url}`, req, res);
});

// Endpoint Seguro para crear Checkout de SumUp
app.post('/api/checkout', async (req, res) => {
  const { amount, orderRef, currency, merchantEmail } = req.body;
  const apiKey = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';

  if (!apiKey) return res.status(500).json({ message: "Falta API Key" });

  try {
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    res.status(500).json({ message: "Error interno pagos" });
  }
});

// Endpoint para procesar Garantías (Simulación de Envío)
app.post('/api/warranty', (req, res) => {
  const { invoiceNumber, purchaseDate, buyerName, email, phone, products, images } = req.body;

  // Validación básica
  if (!invoiceNumber || !email) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  // Aquí iría la integración con Nodemailer o un servicio externo (SendGrid, Mailgun)
  // Como no tenemos credenciales SMTP configuradas, simulamos el éxito.
  
  console.log("--- SOLICITUD DE GARANTÍA RECIBIDA ---");
  console.log(`Para: garantias@escapesymas.com`);
  console.log(`Cliente: ${buyerName} (${email})`);
  console.log(`Factura: ${invoiceNumber}`);
  console.log(`Productos:`, products);
  console.log(`Imágenes adjuntas: ${images ? images.length : 0}`);
  console.log("---------------------------------------");

  // Simulamos un delay de red
  setTimeout(() => {
    res.status(200).json({ success: true, message: "Garantía procesada correctamente." });
  }, 1500);
});

// Manejar cualquier otra ruta devolviendo el index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});