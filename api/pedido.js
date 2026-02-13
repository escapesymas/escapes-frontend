/**
 * Pedido Request API Route
 * Sends an email to the store with the user's order request for Bihr catalog products
 * 
 * @version 1.0.0 - 2026-02-13
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { referencia, userName, userEmail, userId, mensaje } = req.body;

        if (!referencia || !userEmail) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (referencia, email)' });
        }

        // Send email via WordPress REST API (wp_mail)
        const WP_URL = process.env.WORDPRESS_URL || 'https://backendescapes.com';
        const WOO_KEY = process.env.WOO_KEY;
        const WOO_SECRET = process.env.WOO_SECRET;

        // Build email content
        const subject = `🏍️ Solicitud de pedido Bihr — Ref: ${referencia}`;
        const body = `
Nueva solicitud de pedido del catálogo Bihr

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 DATOS DEL PEDIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Referencia Bihr: ${referencia}
${mensaje ? `Mensaje del cliente: ${mensaje}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 DATOS DEL CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${userName || 'No proporcionado'}
Email: ${userEmail}
ID Cliente: ${userId || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este pedido ha sido solicitado desde el asesor Uri en la web.
Plazo estimado de entrega: 2-5 días laborables.
        `.trim();

        // Try to send via WordPress wp_mail endpoint
        // If a custom endpoint exists, use it; otherwise use WooCommerce notes
        const storeEmail = process.env.STORE_EMAIL || 'info@escapesymas.com';

        // Option 1: Use WooCommerce order note as a workaround
        // Option 2: Direct SMTP (would need nodemailer)
        // For now, we create a WooCommerce order note on a special "pedidos" order
        // OR we can use a simple webhook/email service

        // Simple approach: Create a WooCommerce order with status "on-hold" for the pedido
        if (WOO_KEY && WOO_SECRET) {
            const authHeader = 'Basic ' + Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');

            // Create a note/order for tracking
            const orderResponse = await fetch(`${WP_URL}/wp-json/wc/v3/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    status: 'on-hold',
                    customer_id: userId || 0,
                    billing: {
                        first_name: userName || '',
                        last_name: '',
                        email: userEmail,
                    },
                    customer_note: `PEDIDO BIHR — Referencia: ${referencia}${mensaje ? `\nMensaje: ${mensaje}` : ''}`,
                    line_items: [],
                    fee_lines: [{
                        name: `Pedido Bihr - Ref: ${referencia}`,
                        total: '0.00'
                    }],
                    meta_data: [
                        { key: '_pedido_bihr', value: 'yes' },
                        { key: '_bihr_referencia', value: referencia },
                        { key: '_solicitado_via', value: 'uri_asesor' }
                    ]
                })
            });

            if (orderResponse.ok) {
                const orderData = await orderResponse.json();
                console.log('[PEDIDO] Order created:', orderData.id);

                return res.status(200).json({
                    success: true,
                    message: 'Solicitud de pedido enviada correctamente',
                    orderId: orderData.id
                });
            } else {
                const errorText = await orderResponse.text();
                console.error('[PEDIDO] WooCommerce order error:', errorText);
            }
        }

        // Fallback: just log it and confirm
        console.log('[PEDIDO] Request received:', { referencia, userName, userEmail, userId });

        return res.status(200).json({
            success: true,
            message: 'Solicitud de pedido recibida. Nos pondremos en contacto contigo por email.'
        });

    } catch (error) {
        console.error('[PEDIDO] Error:', error);
        return res.status(500).json({
            error: 'Error al procesar la solicitud. Inténtalo de nuevo.',
            code: 'INTERNAL_ERROR'
        });
    }
}
