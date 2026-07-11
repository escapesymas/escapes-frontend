'use client';

import React from 'react';
import { Truck, Percent, Trophy, ChevronRight } from 'lucide-react';
import { MARKETING_TIERS } from '../lib/constants';

interface CartProgressBarProps {
  subtotal: number;
}

export default function CartProgressBar({ subtotal }: CartProgressBarProps) {
  const tiers = [
    { threshold: MARKETING_TIERS.PLATA.min, label: 'Envío Gratis + 5%', icon: Truck, color: 'bg-zinc-500' },
    { threshold: MARKETING_TIERS.ORO.min, label: 'Descuento 10%', icon: Percent, color: 'bg-zinc-500' },
    { threshold: MARKETING_TIERS.PLATINO.min, label: 'Nivel Platino 15%', icon: Trophy, color: 'bg-accent' }
  ];

  // Logic to determine current status
  let nextTier = tiers.find(t => subtotal < t.threshold);
  if (!nextTier) {
    return (
      <div className="bg-accent/10 border border-accent/30 p-4 rounded mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-full shadow-lg shadow-yellow-900/40">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground uppercase italic">Nivel Máximo Alcanzado: PLATINO</p>
            <p className="text-xs text-accent-text font-bold uppercase tracking-widest">15% DTO + ENVÍO GRATIS APLICADO</p>
          </div>
        </div>
      </div>
    );
  }

  const remaining = nextTier.threshold - subtotal;
  const prevThreshold = tiers.indexOf(nextTier) === 0 ? 0 : tiers[tiers.indexOf(nextTier) - 1].threshold;
  const progress = Math.min(100, Math.max(0, ((subtotal - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100));

  return (
    <div className="bg-card border border-card-border p-5 rounded mb-8 relative overflow-hidden group">
      {/* Carbon fiber grid pattern effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-4">
          <div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-0.5">Próximo Nivel</p>
            <h4 className="text-foreground font-bold uppercase italic text-base flex items-center gap-2">
              {nextTier.label} <ChevronRight className="w-4 h-4 text-accent animate-pulse" />
            </h4>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-accent-text text-xl font-bold italic">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(remaining)}
            </p>
            <p className="text-text-muted text-[9px] font-bold uppercase tracking-widest">Para desbloquear</p>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="h-3.5 bg-slate-900 rounded-full w-full relative overflow-hidden mb-4 border border-card-border">
          <div
            className="h-full bg-gradient-to-r from-slate-700 via-slate-500 to-accent transition-all duration-1000 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l15 15-15 15L0 15z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '30px 30px',
              }}
            ></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-text-muted text-[10px] font-bold uppercase tracking-tight">
          <div className="flex items-center gap-1.5 grayscale opacity-75 hover:opacity-100 transition-all cursor-default">
            <div className={`p-1 rounded-full ${subtotal >= MARKETING_TIERS.PLATA.min ? 'bg-accent text-slate-950' : 'bg-slate-950 text-text-muted'}`}>
              <Truck className="w-3 h-3" />
            </div>
            <span className={subtotal >= MARKETING_TIERS.PLATA.min ? 'text-foreground' : ''}>Envío Gratis</span>
          </div>
          <div className="w-2 h-px bg-card-border"></div>
          <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-full ${subtotal >= MARKETING_TIERS.ORO.min ? 'bg-accent text-slate-950' : 'bg-slate-950 text-text-muted'}`}>
              <Percent className="w-3 h-3" />
            </div>
            <span className={subtotal >= MARKETING_TIERS.ORO.min ? 'text-foreground' : ''}>10% DTO</span>
          </div>
          <div className="w-2 h-px bg-card-border"></div>
          <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-full ${subtotal >= MARKETING_TIERS.PLATINO.min ? 'bg-accent text-slate-950' : 'bg-slate-950 text-text-muted'}`}>
              <Trophy className="w-3 h-3" />
            </div>
            <span className={subtotal >= MARKETING_TIERS.PLATINO.min ? 'text-foreground' : ''}>15% DTO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
