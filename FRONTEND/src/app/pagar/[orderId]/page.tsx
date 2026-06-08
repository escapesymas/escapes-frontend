"use client";

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useParams } from 'next/navigation';

// Asegúrate de definir esta variable en el .env.local del frontend
// para que el ID público de Stripe coincida con el backend.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function PagarPedidoPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/api\/?$/, '');

    fetch(`${apiUrl}/api/checkout-session?orderId=${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || 'Error al cargar la pasarela de pago');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error de red al intentar conectar con el servidor de pagos.');
      });

    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <img 
            src="https://www.escapesymas.com/logo-cabecera-negro.svg" 
            alt="Escapes y Más" 
            className="mx-auto h-16 w-auto mb-4"
          />
          <h1 className="text-3xl font-bold font-mono text-[#0f172a] tracking-tight uppercase">
            Finalizar Pedido #{orderId}
          </h1>
          <p className="mt-2 text-lg text-[#475569]">
            Estás a un paso de recibir tu pedido. Por favor, completa el pago de forma segura a continuación.
          </p>
        </div>

        <div className="bg-[#ffffff] shadow-sm rounded-md p-4 md:p-10 border border-[#e2e8f0] min-h-[500px]">
          {error ? (
            <div className="text-[#0f172a] text-center font-medium p-4 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eab308]"></div>
              <p className="text-[#475569] font-medium animate-pulse">Conectando con pasarela bancaria segura...</p>
            </div>
          ) : (
            <div id="checkout">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center flex items-center justify-center space-x-2 text-sm text-[#475569]">
          <svg className="w-5 h-5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="font-mono text-xs uppercase">Los pagos son procesados de forma segura con cifrado TLS/SSL por Stripe.</span>
        </div>
      </div>
    </div>
  );
}
