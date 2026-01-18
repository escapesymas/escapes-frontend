import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

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

    console.log("[WARRANTY] Sending email to shop...");
    // Enviar correo a la tienda
    await transporter.sendMail({
      from: '"Portal Garantías" <web@backendescapes.com>',
      to: 'garantiasydevoluciones@escapesymas.com',
      replyTo: email,
      subject: `[GARANTÍA] ${invoiceNumber} - ${buyerName}`,
      html: htmlContent,
      attachments: attachments
    });

    console.log("[WARRANTY] Sending confirmation email to client...");
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

    console.log("[WARRANTY] ✅ Warranty emails sent successfully");
    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

  } catch (error) {
    console.error('[WARRANTY] ❌ Error:', error.message);
    console.error('[WARRANTY] Full error:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar el correo: ' + error.message });
  }
}
