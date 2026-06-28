'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface OrderSuccessViewProps {
  orderId: string;
  total: string;
  address: string;
  city: string;
  onContinueShopping?: () => void;
  onReset: () => void;
}

export default function OrderSuccessView({ orderId, total, address, city, onContinueShopping, onReset }: OrderSuccessViewProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in font-sans">
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-full mb-6">
        <ShieldCheck className="w-12 h-12 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-mono font-bold text-foreground mb-2 uppercase italic">¡Pedido Completado!</h2>
      <p className="text-text-muted mb-4 max-w-md text-sm">
        Tu pedido <span className="text-foreground font-bold font-mono">#{orderId}</span> ha sido recibido correctamente. Hemos enviado un correo con el resumen y la factura del pedido.
      </p>
      <div className="bg-card border border-card-border p-4 rounded text-left w-full max-w-md mb-8 font-mono text-xs text-text-muted space-y-1">
        <p><span className="font-bold text-foreground">Importe total:</span> {total}</p>
        <p><span className="font-bold text-foreground">Método de pago:</span> Stripe/Tarjeta</p>
        <p><span className="font-bold text-foreground">Dirección:</span> {address}, {city}</p>
      </div>
      <button
        onClick={() => { onReset(); if (onContinueShopping) onContinueShopping(); }}
        className="bg-accent text-slate-950 font-mono font-bold uppercase tracking-wide py-3 px-8 rounded-sm hover:bg-accent-hover transition-colors flex items-center gap-2 cursor-pointer"
      >
        Volver a la tienda
      </button>
    </div>
  );
}
