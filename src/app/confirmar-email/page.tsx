'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { apiConfirmEmailChange } from '../../lib/api';

/** Destino del enlace del correo al cambiar el email en «Mi perfil». */
function ConfirmEmailChangeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [state, setState] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // Espera a saber si hay sesión: con ella se refresca el perfil y se vuelve a él.
    if (isLoading || started.current) return;
    started.current = true;
    apiConfirmEmailChange(params.get('token') || '')
      .then(async ({ email }) => {
        setMessage(email);
        setState('ok');
        if (isAuthenticated) {
          await refreshProfile().catch(() => {});
          setTimeout(() => router.replace('/perfil'), 2000);
        }
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'No se pudo confirmar el email.');
      });
  }, [isLoading, isAuthenticated, params, refreshProfile, router]);

  return (
    <div className="bg-card border border-card-border rounded-md p-6 shadow-sm flex flex-col items-center text-center gap-3">
      {state === 'checking' && (
        <>
          <Loader2 className="w-7 h-7 text-accent animate-spin" />
          <p className="text-sm">Confirmando tu email nuevo…</p>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <h1 className="text-lg font-semibold">Email cambiado</h1>
          <p className="text-sm text-text-muted">
            A partir de ahora tu email es <strong className="text-foreground break-all">{message}</strong>.
            {isAuthenticated ? ' Volviendo a tu perfil…' : ' Úsalo para entrar en tu cuenta.'}
          </p>
          <Link href={isAuthenticated ? '/perfil' : '/login'} className="mt-2 px-4 py-2 rounded bg-accent text-slate-950 text-sm font-semibold">
            {isAuthenticated ? 'Ir a mi perfil' : 'Acceder'}
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h1 className="text-lg font-semibold">No hemos podido cambiar tu email</h1>
          <p className="text-sm text-text-muted">{message}</p>
          <Link href="/perfil" className="mt-2 px-4 py-2 rounded bg-accent text-slate-950 text-sm font-semibold">
            Ir a mi perfil
          </Link>
        </>
      )}
    </div>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main id="main-content" className="max-w-md mx-auto px-4 py-12">
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}>
          <ConfirmEmailChangeContent />
        </Suspense>
      </main>
    </div>
  );
}
