
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
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || 'ck_d3b44ee68cb5f6e3e222da8dde30ac733f1c859f';
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || 'cs_bc248d17e08ea49c04100e129b5798e6006c8fdd';
const SUMUP_API_KEY = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';
const PROXY_TARGET_URL = 'https://backendescapes.com';

// Middleware para parsear JSON - IMPORTANTE: Límite alto para Base64
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(express.urlencoded({ limit: '100mb', extended: true }));

// DEBUG: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[SERVER] Incoming: ${req.method} ${req.url}`);
  next();
});

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
  delete headers.cookie; // IMPORTANTE: Eliminar cookies para evitar que WP redirija al frontend

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

    console.log(`[PROXY] <-- ${response.status} ${response.statusText} | Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      // Clone the response to read body without consuming it for the pipe
      const clone = response.clone();
      const text = await clone.text();
      console.log(`[PROXY] Body Snippet: ${text.substring(0, 500)}`);
    }

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
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EscapesApp/1.0"
      },
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

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  console.log("[CONTACT] Received request from:", name, email);

  if (!name || !email || !message) {
    console.log("[CONTACT] Missing required fields");
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    console.log("[CONTACT] Creating transporter...");
    const transporter = nodemailer.createTransport({
      host: "smtp.buzondecorreo.com",
      port: 465,
      secure: true,
      auth: {
        user: "web@backendescapes.com",
        pass: "Pedrito2011P!"
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log("[CONTACT] Verifying transporter connection...");
    await transporter.verify();
    console.log("[CONTACT] Transporter verified successfully");

    const mailOptions = {
      from: '"Escapes y Más Web" <web@backendescapes.com>',
      to: "info@escapesymas.com",
      replyTo: email,
      subject: `Consulta de ${subject || 'General'}`,
      html: `
        <h3>Nueva Consulta desde la Web</h3>
        <p><strong>De:</strong> ${name} (${email})</p>
        <p><strong>Asunto:</strong> ${subject || 'General'}</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 5px solid #ff4500;">
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `
    };

    console.log("[CONTACT] Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("[CONTACT] ✅ Email sent successfully:", info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error("[CONTACT] ❌ Email error:", error.message);
    console.error("[CONTACT] Full error:", error);
    res.status(500).json({ error: "Error al enviar el correo: " + error.message });
  }
});

// --- CONFIGURACIÓN DE MULTER (SUBIDA DE ARCHIVOS) ---
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

// --- ENDPOINTS DE API INTERNA ---
app.post('/api/upload/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
  }

  const { userId } = req.body;
  const filePath = req.file.path;

  console.log(`[UPLOAD] Recibido archivo para userId: ${userId}, path: ${filePath}`);

  try {
    // 1. Leer el archivo desde disco
    const fileStream = fs.createReadStream(filePath);

    // 2. Preparar FormData para WordPress
    const form = new FormData();
    form.append('file', fileStream, req.file.originalname);
    form.append('title', `Avatar User ${userId}`);
    form.append('caption', 'Avatar subido desde el frontend');

    // 3. Autenticación Admin (Basic Auth con Consumer Key/Secret no funciona siempre para Media, usamos Basic con credenciales reales o Application Passwords si estuviera configurado. 
    //    Aquí usaremos las mismas credenciales que el proxy si son de admin, o idealmente un User/App Password).
    //    NOTA: Para WP REST API media, necesita Auth Basic con un usuario con caps 'upload_files'.
    //    Si WOO_CONSUMER_KEY es de admin, a veces funciona, pero lo estándar es Basic Auth de Usuario WP.
    //    Vamos a intentar usar la Key/Secret si son de admin (a veces falla).
    //    FALLBACK MEJORADO: Usar credenciales Hardcoded de Admin para este "Tunnel" si las de env no van.
    //    (En producción usar ENV VARS para WP_ADMIN_USER / WP_APP_PASSWORD)

    // Auth Header construction
    const auth = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64');

    const wpRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        // Note: form-data headers are handled by the library/fetch usually, or need getHeaders()
        ...form.getHeaders()
      },
      body: form // form-data library stream
    });

    // Limpiar archivo temporal
    fs.unlinkSync(filePath);

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      console.error('[UPLOAD] Error WP:', errText);
      throw new Error(`Error WP: ${wpRes.status} ${wpRes.statusText}`);
    }

    const mediaData = await wpRes.json();
    const avatarUrl = mediaData.source_url;
    const mediaId = mediaData.id;

    console.log('[UPLOAD] Imagen subida a WP ID:', mediaId);

    // 4. Actualizar metadatos del usuario WooCommerce
    // Necesitamos el endpoint de Customers de WC
    const updateRes = await fetch(`${PROXY_TARGET_URL}/wp-json/wc/v3/customers/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meta_data: [
          { key: '_custom_avatar', value: avatarUrl },
          { key: 'wp_user_avatar', value: mediaId } // Compatibility with some plugins
        ]
      })
    });

    if (!updateRes.ok) {
      console.error('[UPLOAD] Error actualizando usuario WC');
      // No fallamos la request entera, devolvemos la URL igual
    }

    return res.json({ success: true, url: avatarUrl, id: mediaId });

  } catch (error) {
    console.error('[UPLOAD] Error procesando subida:', error);
    // Intentar limpiar archivo si existe
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(500).json({ success: false, message: error.message });
  }
});

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
        return_url: `https://${req.get('host')}/?payment_success=true&order=${orderRef}`
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error interno en la pasarela de pagos" });
  }
});

app.post('/api/warranty', async (req, res) => {
  const { invoiceNumber, purchaseDate, installationDate, buyerName, email, phone, products, images } = req.body;

  console.log("[WARRANTY] Received request from:", buyerName, email);

  if (!invoiceNumber || !email || !buyerName) {
    console.log("[WARRANTY] Missing required fields");
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    console.log("[WARRANTY] Creating transporter...");
    // Configuración SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.buzondecorreo.com',
      port: 465,
      secure: true,
      auth: {
        user: 'web@backendescapes.com',
        pass: 'Pedrito2011P!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Preparar contenido del email
    const productRows = products.map(p => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.issue}</td>
    </tr>
  `).join('');

    const htmlContent = `
    <h2>Nueva Solicitud de Garantía</h2>
    <p><strong>Factura:</strong> ${invoiceNumber}</p>
    <p><strong>Fecha Compra:</strong> ${purchaseDate}</p>
    <p><strong>Fecha Instalación:</strong> ${installationDate || 'No indicada'}</p>
    <p><strong>Titular:</strong> ${buyerName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Teléfono:</strong> ${phone}</p>
    
    <h3>Productos e Incidencias</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Producto</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Incidencia</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
  `;

    // Preparar adjuntos (Imágenes Base64)
    const attachments = (images || []).map((img, index) => {
      // img es "data:image/png;base64,....."
      const split = img.split(',');
      const typeMatch = split[0].match(/:(.*?);/);
      const type = typeMatch ? typeMatch[1] : 'image/jpeg';
      const itemContent = split[1];
      const ext = type.split('/')[1] || 'jpg';

      return {
        filename: `evidencia_${index + 1}.${ext}`,
        content: itemContent,
        encoding: 'base64'
      };
    });

    try {
      // Enviar correo a la tienda
      await transporter.sendMail({
        from: '"Portal Garantías" <web@backendescapes.com>',
        to: 'garantiasydevoluciones@escapesymas.com',
        replyTo: email,
        subject: `[GARANTÍA] ${invoiceNumber} - ${buyerName}`,
        html: htmlContent,
        attachments: attachments
      });

      // Enviar confirmación al cliente
      await transporter.sendMail({
        from: '"Escapes y Más" <web@backendescapes.com>',
        to: email,
        replyTo: 'garantiasydevoluciones@escapesymas.com',
        subject: 'Hemos recibido tu solicitud de garantía',
        html: `
        <h3>Hola ${buyerName},</h3>
        <p>Hemos recibido tu solicitud de garantía asociada a la factura <strong>${invoiceNumber}</strong>.</p>
        <p>Nuestro equipo revisará la información y te contactará en breve.</p>
        <p>Gracias por confiar en Escapes y Más.</p>
      `
      });

      return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

    } catch (error) {
      console.error('Error enviando correo:', error);
      return res.status(500).json({ success: false, message: 'Error al enviar el correo: ' + error.message });
    }
  } catch (err) {
    console.error('[WARRANTY] Outer error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// --- RUTA CATCH-ALL PARA SPA ---
app.get('*', (req, res) => {
  console.log(`[SERVER] Fallback to index.html for: ${req.url}`);
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
