'use client';

import React from 'react';
import { User } from 'lucide-react';
import Link from 'next/link';

export default function ProfileUnauthenticated() {
  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 animate-fade-in pb-20">
      <div className="bg-card border border-card-border rounded-md shadow-sm p-8 flex flex-col items-center text-center gap-4">
        <div className="bg-icon-box border border-card-border w-16 h-16 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-accent-text" />
        </div>
        <div>
          <h2 className="text-lg font-mono font-bold text-foreground uppercase italic">Tu Perfil</h2>
          <p className="text-[10px] text-text-muted font-mono mt-2 leading-relaxed max-w-xs">
            Inicia sesión para ver tu garaje, historial de pedidos y participar en el Paddock.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login?tab=login"
            className="bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded hover:bg-accent-hover transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login?tab=register"
            className="border border-card-border text-foreground font-mono font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded hover:bg-card-border/25 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
