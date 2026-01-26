export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { amount, orderRef, currency, merchantEmail } = req.body;

  // Clave proporcionada para producción inmediata.
  const apiKey = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';

  if (!apiKey) {
    return res.status(500).json({ message: "Error de configuración del servidor: Falta API Key" });
  }

  try {
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: orderRef,
        amount: amount,
        currency: currency || 'EUR',
        pay_to_email: merchantEmail,
        description: `Pedido ${orderRef}`,
        return_url: `https://${req.headers.host}/?payment_success=true&order=${orderRef}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error SumUp API:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error conectando con SumUp:", error);
    return res.status(500).json({ message: "Error interno del servidor de pagos" });
  }
}