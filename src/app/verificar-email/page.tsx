'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

/** Destino del enlace del correo de registro: confirma el email e inicia sesión. */
function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { verifyEmail } = useAuth();
  const [state, setState] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get('token') || '';
    verifyEmail(token)
      .then(() => {
        setState('ok');
        setTimeout(() => router.replace('/perfil'), 1500);
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'No se pudo confirmar el email.');
      });
  }, [params, verifyEmail, router]);

  return (
    <div className="bg-card border border-card-border rounded-md p-6 shadow-sm flex flex-col items-center text-center gap-3">
      {state === 'checking' && (
        <>
          <Loader2 className="w-7 h-7 text-accent animate-spin" />
          <p className="text-sm">Confirmando tu email…</p>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <h1 className="text-lg font-semibold">Email confirmado</h1>
          <p className="text-sm text-text-muted">Tu cuenta ya está activa. Entrando en tu perfil…</p>
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h1 className="text-lg font-semibold">No hemos podido confirmar tu email</h1>
          <p className="text-sm text-text-muted">{message}</p>
          <Link href="/login" className="mt-2 px-4 py-2 rounded bg-accent text-slate-950 text-sm font-semibold">
            Ir a «Acceder» y pedir otro enlace
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onCartClick={() => { window.location.href = '/?tab=cart'; }} />
      <main className="max-w-md mx-auto px-4 py-12">
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
