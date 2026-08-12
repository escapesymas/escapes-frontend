'use client';

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  orderId: string | null;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function StripePaymentForm({ orderId, clientSecret, onSuccess, onError, onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    sessionStorage.setItem('stripe_pending_order', JSON.stringify({
      orderId,
      clientSecret,
    }));

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout/success',
      },
    });

    if (confirmError) {
      sessionStorage.removeItem('stripe_pending_order');
      setError(confirmError.message || 'Error al procesar el pago');
      onError(confirmError.message || 'Error al procesar el pago');
    }

    setLoading(false);
  };

  const handleCancel = () => {
    if (!loading) {
      sessionStorage.removeItem('stripe_pending_order');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-background border border-card-border/60 rounded p-4 mb-2 shadow-inner">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error en el pago</p>
            <p className="text-[10px] text-red-400/90">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 bg-transparent hover:bg-card-border/25 border border-card-border text-text-muted hover:text-foreground font-mono text-xs font-bold uppercase tracking-wider py-3 rounded transition-colors cursor-pointer text-center disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 bg-accent text-slate-950 font-mono font-bold uppercase tracking-wider py-3 rounded hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
          ) : (
            'Pagar Ahora'
          )}
        </button>
      </div>
    </form>
  );
}
