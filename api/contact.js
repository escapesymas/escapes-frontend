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
}
