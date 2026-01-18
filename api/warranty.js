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

    // Preparar tabla de productos
    const productRows = products.map(p => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #27272a; color: #d4d4d8; font-size: 14px;">${p.name}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 13px; line-height: 1.5;">${p.issue}</td>
      </tr>
    `).join('');

    // Email a la tienda
    const shopEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #09090b; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; max-width: 650px;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #27272a 0%, #18181b 100%); padding: 0;">
              <div style="height: 4px; background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);"></div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align: left;">
                          <img src="https://backendescapes.com/wp-content/uploads/2026/01/logo1-cab.png" alt="Escapes y Más" style="max-width: 180px; height: auto;">
                        </td>
                        <td style="text-align: right;">
                          <div style="background-color: #ea580c; color: #ffffff; padding: 8px 16px; border-radius: 4px; display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">⚠ Garantía</div>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #f4f4f5; font-size: 26px; font-weight: 800; margin: 25px 0 10px 0; text-transform: uppercase; font-style: italic;">Solicitud de Garantía</h1>
                    <p style="color: #71717a; font-size: 13px; margin: 0;">Ref: #${invoiceNumber} — ${buyerName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #27272a; border-left: 4px solid #ea580c; border-radius: 4px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 50%; padding-right: 20px; padding-bottom: 15px;">
                          <p style="margin: 0 0 5px 0; color: #71717a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Factura</p>
                          <p style="margin: 0; color: #f4f4f5; font-size: 16px; font-weight: 700;">#${invoiceNumber}</p>
                        </td>
                        <td style="width: 50%; padding-bottom: 15px;">
                          <p style="margin: 0 0 5px 0; color: #71717a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Fecha Compra</p>
                          <p style="margin: 0; color: #f4f4f5; font-size: 14px;">${purchaseDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="width: 50%; padding-right: 20px; padding-top: 15px; border-top: 1px solid #3f3f46;">
                          <p style="margin: 0 0 5px 0; color: #71717a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Cliente</p>
                          <p style="margin: 0; color: #f4f4f5; font-size: 14px;">${buyerName}</p>
                          <p style="margin: 3px 0 0 0; color: #ea580c; font-size: 13px;">${email}</p>
                          <p style="margin: 3px 0 0 0; color: #a1a1aa; font-size: 13px;">${phone}</p>
                        </td>
                        <td style="width: 50%; padding-top: 15px; border-top: 1px solid #3f3f46;">
                          <p style="margin: 0 0 5px 0; color: #71717a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Instalación</p>
                          <p style="margin: 0; color: #f4f4f5; font-size: 14px;">${installationDate || 'No indicada'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 15px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Productos e Incidencias</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 4px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #27272a;">
                    <th style="padding: 12px 15px; text-align: left; color: #f4f4f5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Producto</th>
                    <th style="padding: 12px 15px; text-align: left; color: #f4f4f5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Incidencia Reportada</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>

              ${images && images.length ? `<p style="margin: 30px 0 10px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">📸 ${images.length} Fotografía(s) adjunta(s)</p>` : ''}

            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #71717a; font-size: 12px;"><strong style="color: #ea580c;">ESCAPES Y MÁS</strong> — Portal de Garantías</p>
              <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} Escapes y Más. Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Email de confirmación al cliente
    const clientEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color: #09090b; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 0;">
              <div style="height: 4px; background-color: #10b981;"></div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;">
                    <div style="width: 60px; height: 60px; background-color: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 30px;">✓</div>
                    <h1 style="color: #f4f4f5; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; text-transform: uppercase; font-style: italic;">Solicitud Recibida</h1>
                    <p style="color: #10b981; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Garantía #${invoiceNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background-color: #18181b;">
              <p style="color: #f4f4f5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola <strong>${buyerName}</strong>,</p>
              <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Hemos recibido tu solicitud de garantía asociada a la factura <strong style="color: #ea580c;">#${invoiceNumber}</strong>.</p>
              <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">Nuestro equipo técnico revisará la información y te contactará en el email <strong style="color: #ea580c;">${email}</strong> en un plazo de 24-48 horas laborables.</p>
              <div style="background-color: #27272a; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5;">💡  <strong style="color: #f4f4f5;">Próximos pasos:</strong> Revisaremos los detalles de tu caso y te informaremos sobre el procedimiento a seguir.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #71717a; font-size: 12px;"><strong style="color: #ea580c;">ESCAPES Y MÁS</strong> — Gracias por confiar en nosotros</p>
              <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} Escapes y Más</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Preparar adjuntos (Imágenes Base64)
    const attachments = (images || []).map((img, index) => {
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
    await transporter.sendMail({
      from: '"Portal Garantías" <web@backendescapes.com>',
      to: 'garantiasydevoluciones@escapesymas.com',
      replyTo: email,
      subject: `[GARANTÍA] ${invoiceNumber} - ${buyerName}`,
      html: shopEmailHtml,
      attachments: attachments
    });

    console.log("[WARRANTY] Sending confirmation email to client...");
    await transporter.sendMail({
      from: '"Escapes y Más" <web@backendescapes.com>',
      to: email,
      replyTo: 'garantiasydevoluciones@escapesymas.com',
      subject: 'Hemos recibido tu solicitud de garantía',
      html: clientEmailHtml
    });

    console.log("[WARRANTY] ✅ Warranty emails sent successfully");
    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

  } catch (error) {
    console.error('[WARRANTY] ❌ Error:', error.message);
    console.error('[WARRANTY] Full error:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar el correo: ' + error.message });
  }
}
