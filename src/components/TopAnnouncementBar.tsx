'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Gift, ShieldCheck } from 'lucide-react';

export default function TopAnnouncementBar() {
  const { isAuthenticated, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(true); // Default true until client checks sessionStorage

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('eym_dismiss_welcome_bar') === '1';
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('eym_dismiss_welcome_bar', '1');
    } catch {}
  };

  if (dismissed || isLoading) return null;

  return (
    <div
      role="region"
      aria-label="Aviso promocional"
      className="bg-card border-b border-card-border/80 text-foreground py-1.5 px-3 sm:px-4 text-[11px] font-mono transition-all relative z-50 shadow-sm"
    >
      <div className="container mx-auto max-w-6xl flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
          {!isAuthenticated ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-bold text-accent shrink-0">
                <Gift className="w-3.5 h-3.5 animate-pulse text-accent" />
                <span className="hidden sm:inline">Bienvenida:</span>
                <span>5% DTO en tu primera compra</span>
              </span>
              <span className="text-text-muted hidden md:inline">·</span>
              <span className="text-text-muted hidden md:inline">
                Usa el código <strong className="text-foreground tracking-wide bg-background/80 px-1.5 py-0.5 rounded border border-card-border">BIENVENIDA5</strong>
              </span>
              <Link
                href="/login?tab=register"
                className="ml-1 inline-flex items-center gap-1 text-accent font-bold hover:underline shrink-0"
              >
                <span>Crear cuenta gratis</span>
                <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 text-text-muted text-[11px]">
              <span className="inline-flex items-center gap-1 text-accent font-bold">
                <Sparkles className="w-3 h-3 text-accent" /> Envío gratis desde 200 €
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Garantía oficial en escapes homologados
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-text-muted hover:text-foreground transition-colors cursor-pointer shrink-0 rounded"
          aria-label="Cerrar aviso promocional"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
