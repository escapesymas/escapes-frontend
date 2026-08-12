'use client';

import React from 'react';

export default function CheckoutSkeleton() {
  return (
    <div className="flex flex-col justify-center items-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      <p className="text-text-muted font-mono text-xs uppercase tracking-wider animate-pulse">
        Conectando con pasarela bancaria segura...
      </p>
    </div>
  );
}
