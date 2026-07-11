"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'ok' | 'error' | 'pending';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);

  useEffect(() => {
    if (!paymentIntentId) {
      router.replace('/');
      return;
    }

    if (redirectStatus && redirectStatus !== 'succeeded') {
      setStatus('pending');
      setErrorMsg(
        redirectStatus === 'processing'
          ? 'Tu pago está siendo procesado. Te avisaremos por email cuando se confirme.'
          : `El pago está en estado: ${redirectStatus}. Te avisaremos por email cuando se confirme.`
      );
      return;
    }

    if (sessionStorage.getItem(`finalize_done_${paymentIntentId}`)) {
      setAlreadyProcessed(true);
      setStatus('ok');
      setOrderId(parseInt(sessionStorage.getItem(`finalize_done_${paymentIntentId}`) || '0'));
      clearCart();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/orders/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: paymentIntentId,
            status: 'processing',
          }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (res.ok) {
          setOrderId(data.orderId || data.id);
          sessionStorage.setItem(`finalize_done_${paymentIntentId}`, String(data.orderId || data.id));
          setStatus('ok');
          clearCart();
        } else if (res.status === 409 || (data.error && /already|processed/i.test(data.error))) {
          setAlreadyProcessed(true);
          setStatus('ok');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Error al procesar el pago');
        }
      } catch (err: any) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(err?.message || 'Error de red al procesar el pago');
      }
    })();

    return () => { cancelled = true; };
  }, [paymentIntentId, redirectStatus, router, clearCart]);

  if (status === 'loading') {
    return (
      <div data-testid="success-loading" className="max-w-xl w-full bg-white shadow-sm rounded-md p-8 md:p-12 border border-slate-200 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
          <Loader2 className="h-10 w-10 text-yellow-600 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight mb-2">
          Procesando tu pago...
        </h1>
        <p className="text-sm text-slate-500">
          Estamos confirmando tu pedido con Stripe. Esto suele tardar unos segundos.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div data-testid="success-error" className="max-w-xl w-full bg-white shadow-sm rounded-md p-8 md:p-12 border border-red-200 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight mb-2">
          Hubo un problema
        </h1>
        <p className="text-sm text-slate-600 mb-6 font-mono break-words">{errorMsg}</p>
        <p className="text-xs text-slate-500 mb-8">
          Si tu pago se completó, recibirás un email de confirmación en breve. No te preocupes, no se ha realizado ningún cargo adicional.
        </p>
        <Link
          href="/"
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold font-mono uppercase tracking-wide py-3 px-8 rounded-md transition-colors shadow-sm"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div data-testid="success-pending" className="max-w-xl w-full bg-white shadow-sm rounded-md p-8 md:p-12 border border-blue-200 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
          <Loader2 className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight mb-2">
          Pago en proceso
        </h1>
        <p className="text-sm text-slate-600 mb-8">{errorMsg}</p>
        <Link
          href="/"
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold font-mono uppercase tracking-wide py-3 px-8 rounded-md transition-colors shadow-sm"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="success-ok" className="max-w-xl w-full bg-white shadow-sm rounded-md p-8 md:p-12 border border-slate-200 text-center">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight mb-2">
        ¡Pago Completado!
      </h1>
      <p className="text-lg text-slate-600 mb-4">
        Tu pedido{orderId ? ` #${orderId}` : ''} se ha confirmado correctamente.
      </p>
      <p className="text-sm text-slate-500 mb-8">
        Te enviaremos un email con los detalles del envío. ¡Gracias por tu compra!
      </p>

      {alreadyProcessed && (
        <div className="mb-6 p-3 bg-blue-50 rounded border border-blue-200 text-xs font-mono text-blue-700">
          Este pedido ya fue procesado anteriormente.
        </div>
      )}

      <Link
        href="/"
        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold font-mono uppercase tracking-wide py-3 px-8 rounded-md transition-colors shadow-sm"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={<div className="text-slate-900 font-mono animate-pulse">Cargando confirmación...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}