'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (action: 'accept_all' | 'reject_all') => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ action, ts: new Date().toISOString() })
      );
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border shadow-lg p-4 md:p-5"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 text-xs font-sans text-foreground/85 leading-relaxed">
          <p>
            Usamos cookies para que el sitio funcione (carrito, sesión, seguridad) y, si tú lo autorizas,
            también para análisis que nos ayuda a mejorarlo. Puedes aceptar todas, rechazar las opcionales
            o configurar tu elección. Más información en nuestra{' '}
            <Link href="/politica-cookies" className="text-accent hover:underline">
              política de cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => save('reject_all')}
            className="px-4 py-2 text-xs font-mono uppercase font-bold rounded border border-card-border text-foreground hover:bg-background transition-colors"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => save('accept_all')}
            className="px-4 py-2 text-xs font-mono uppercase font-bold rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
