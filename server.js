import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';

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
app.use('/wp-fallback', async (req, res) => {
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

// Endpoint para procesar Garantías y Devoluciones (SMTP Real)
app.post('/api/warranty', async (req, res) => {
  const { invoiceNumber, purchaseDate, buyerName, email, phone, products, images } = req.body;

  if (!invoiceNumber || !email) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  // Configuración del Transporter SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp.buzondecorreo.com",
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: "garantiasydevoluciones@escapesymas.com",
      pass: "Pedrito2011P!"
    }
  });

  // Preparar contenido HTML del correo
  const productRows = products.map(p => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.issue}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: '"Escapes y Más - Garantías" <garantiasydevoluciones@escapesymas.com>',
    to: "garantiasydevoluciones@escapesymas.com", // Se envía a sí mismo como indicaste
    replyTo: email, // Responder al cliente
    subject: `Nueva Solicitud: ${buyerName} - Ref: ${invoiceNumber}`,
    html: `
      <h2>Nueva Solicitud de Garantía / Devolución</h2>
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
      <p><em>Este correo ha sido generado automáticamente desde el formulario web.</em></p>
    `,
    attachments: images ? images.map((img, idx) => ({
      filename: `imagen-${idx + 1}.jpg`,
      path: img // Nodemailer maneja Data URIs automáticamente
    })) : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado: %s", info.messageId);
    res.status(200).json({ success: true, message: "Solicitud enviada correctamente." });
  } catch (error) {
    console.error("Error enviando email:", error);
    res.status(500).json({ message: "Error al enviar el correo. Por favor contacta por teléfono." });
  }
});

// Manejar cualquier otra ruta devolviendo el index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});