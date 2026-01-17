
import nodemailer from 'nodemailer';

async function verifyConnection() {
    console.log('Testing SMTP Connection...');

    const transporter = nodemailer.createTransport({
        host: 'smtp.buzondecorreo.com',
        port: 465,
        secure: true,
        auth: {
            user: 'garantiasydevoluciones@escapesymas.com',
            pass: 'Pedrito2011P!'
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Connection Successful! Credentials are valid.');

        /* Optional: Send a test email to yourself to confirm delivery
        const info = await transporter.sendMail({
            from: 'garantiasydevoluciones@escapesymas.com',
            to: 'garantiasydevoluciones@escapesymas.com',
            subject: 'Test SMTP',
            text: 'This is a test email to verify credentials.'
        });
        console.log('Test email sent: ' + info.messageId);
        */

    } catch (error) {
        console.error('❌ Connection Failed:', error);
    }
}

verifyConnection();
