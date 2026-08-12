'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-6 h-6 text-accent animate-spin mb-3" />
      <p className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider animate-pulse">Cargando perfil...</p>
    </div>
  );
}
