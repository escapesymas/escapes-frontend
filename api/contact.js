import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; max-width: 600px;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 0;">
              <div style="height: 4px; background-color: #ea580c;"></div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;">
                    <img src="https://backendescapes.com/wp-content/uploads/2026/01/logo1-cab.png" alt="Escapes y Más" style="max-width: 200px; height: auto;">
                    <h1 style="color: #f4f4f5; font-size: 24px; font-weight: 800; margin: 20px 0 10px 0; text-transform: uppercase; font-style: italic; letter-spacing: 1px;">Nueva Consulta</h1>
                    <p style="color: #ea580c; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Desde la Web</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px; background-color: #18181b;">
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px 20px; background-color: #27272a; border-left: 4px solid #ea580c; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">De</p>
                    <p style="margin: 0; color: #f4f4f5; font-size: 16px; font-weight: 600;">${name}</p>
                    <p style="margin: 5px 0 0 0; color: #ea580c; font-size: 14px;">${email}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px 20px; background-color: #27272a; border-radius: 4px;">
                    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Asunto</p>
                    <p style="margin: 0; color: #f4f4f5; font-size: 15px; font-weight: 600;">${subject || 'General'}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 0 10px 0;">
                    <p style="margin: 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Mensaje</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #09090b; border: 1px solid #27272a; border-radius: 4px;">
                    <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #71717a; font-size: 12px;"><strong style="color: #ea580c;">ESCAPES Y MÁS</strong> — Equipamiento Pro para Pilotos Exigentes</p>
              <p style="margin: 0; color: #52525b; font-size: 11px;">© ${new Date().getFullYear()} Escapes y Más. Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
}
