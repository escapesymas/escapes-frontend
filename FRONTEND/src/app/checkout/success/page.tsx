"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
      <div className="max-w-xl w-full bg-[#ffffff] shadow-sm rounded-md p-8 md:p-12 border border-[#e2e8f0] text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold font-mono text-[#0f172a] tracking-tight mb-2">
          ¡Pago Completado!
        </h1>
        <p className="text-lg text-[#475569] mb-8">
          Tu pago se ha procesado correctamente y hemos recibido tu pedido. En breve te contactaremos con todos los detalles del envío.
        </p>

        {sessionId && (
          <div className="mb-8 p-4 bg-gray-50 rounded-md border border-gray-100 text-sm font-mono text-gray-500 break-all">
            Referencia de pago: {sessionId.substring(0, 20)}...
          </div>
        )}

        <Link 
          href="/" 
          className="inline-block bg-[#eab308] hover:bg-yellow-600 text-[#000000] font-bold font-mono uppercase tracking-wide py-3 px-8 rounded-md transition-colors shadow-sm"
        >
          Volver a la tienda
        </Link>
      </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={<div className="text-[#0f172a] font-mono animate-pulse">Cargando confirmación...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
