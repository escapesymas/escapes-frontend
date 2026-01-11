import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import { Buffer } from 'buffer';

// Permitir certificados auto-firmados o con errores en el backend (necesario para algunos entornos de WP)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CONFIGURACIÓN DE CLAVES SEGURAS (Desde variables de entorno con fallback) ---
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';
const SUMUP_API_KEY = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';

// Middleware para parsear JSON con límite aumentado para imágenes base64 (Garantías)
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos del build de React
app.use(express.static(join(__dirname, 'dist')));

/**
 * Prepara las cabeceras para el proxy, inyectando la autenticación de WooCommerce
 * para que nunca esté expuesta en el navegador del cliente.
 */
const addProxyHeaders = (req) => {
  const headers = { ...req.headers };
  
  // Limpieza de cabeceras que pueden causar conflictos
  delete headers.host;
  delete headers['content-length'];
  delete headers.origin;
  delete headers.referer;
  delete headers.connection;

  // Inyectar credenciales de WooCommerce (Seguridad de Servidor a Servidor)
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
    
    // Transferir cabeceras de respuesta (excepto las que causan problemas de compresión)
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

// 1. Proxy Principal (Ruta Estándar /wp-json)
app.use('/wp-json', async (req, res) => {
  await handleProxyResponse(`https://backendescapes.com/wp-json${req.url}`, req, res);
});

// 2. Proxy de Rescate (Ruta Fallback para permalinks no configurados)
app.use('/wp-fallback', async (req, res) => {
  await handleProxyResponse(`https://backendescapes.com${req.url}`, req, res);
});

// --- ENDPOINTS DE API INTERNA ---

// 3. Endpoint Seguro para crear Checkout de SumUp
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

// 4. Endpoint para procesar Garantías y Devoluciones (SMTP)
app.post('/api/warranty', async (req, res) => {
  const { invoiceNumber, purchaseDate, buyerName, email, phone, products, images } = req.body;

  if (!invoiceNumber || !email) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  // Configuración del Transporter SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp.buzondecorreo.com",
    port: 465,
    secure: true, 
    auth: {
      user: "garantiasydevoluciones@escapesymas.com",
      pass: "Pedrito2011P!"
    }
  });

  const productRows = products.map(p => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.issue}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: '"Escapes y Más - Garantías" <garantiasydevoluciones@escapesymas.com>',
    to: "garantiasydevoluciones@escapesymas.com",
    replyTo: email,
    subject: `Nueva Solicitud: ${buyerName} - Ref: ${invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #EA580C;">Nueva Solicitud de Garantía / Devolución</h2>
        <p><strong>Cliente:</strong> ${buyerName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Nº Factura:</strong> ${invoiceNumber}</p>
        <p><strong>Fecha Compra:</strong> ${purchaseDate}</p>
        
        <h3>Productos Afectados:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Producto</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Incidencia</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          <em>Este correo ha sido generado automáticamente desde el formulario web de Escapes y Más.</em>
        </p>
      </div>
    `,
    attachments: images ? images.map((img, idx) => ({
      filename: `evidencia-${idx + 1}.jpg`,
      path: img 
    })) : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[SMTP] Correo enviado: %s", info.messageId);
    res.status(200).json({ success: true, message: "Solicitud enviada correctamente." });
  } catch (error) {
    console.error("[SMTP ERROR]:", error);
    res.status(500).json({ message: "Error al enviar el correo. Por favor contacta por teléfono." });
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