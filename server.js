import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos del build de React
app.use(express.static(join(__dirname, 'dist')));

// Endpoint Seguro para crear Checkout de SumUp
app.post('/api/checkout', async (req, res) => {
  const { amount, orderRef, currency, merchantEmail } = req.body;

  // Clave proporcionada. 
  // NOTA DE SEGURIDAD: Lo ideal es usar process.env.SUMUP_SECRET_KEY en un archivo .env,
  // pero la definimos aquí para asegurar que funcione inmediatamente según tu solicitud.
  const apiKey = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';

  if (!apiKey) {
    console.error("Falta la SUMUP_SECRET_KEY");
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
        return_url: `${req.protocol}://${req.get('host')}/?payment_success=true&order=${orderRef}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error SumUp API:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Error conectando con SumUp:", error);
    res.status(500).json({ message: "Error interno del servidor de pagos" });
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