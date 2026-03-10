import React from 'react';
import { Truck, Percent, Trophy, ChevronRight } from 'lucide-react';
import { MARKETING_TIERS } from '../storeData';

interface CartProgressBarProps {
    subtotal: number;
}

export const CartProgressBar: React.FC<CartProgressBarProps> = ({ subtotal }) => {
    const tiers = [
        { threshold: MARKETING_TIERS.PLATA.min, label: 'Envío Gratis + 10%', icon: Truck, color: 'bg-zinc-500' },
        { threshold: MARKETING_TIERS.ORO.min, label: 'Descuento 15%', icon: Trophy, color: 'bg-racing-orange' }
    ];

    // Logic to determine current status
    let nextTier = tiers.find(t => subtotal < t.threshold);
    if (!nextTier) return (
        <div className="bg-racing-orange/10 border border-racing-orange/30 p-4 rounded-sm mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-racing-orange p-2 rounded-full">
                    <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white uppercase italic">Nivel Oro Alcanzado</p>
                    <p className="text-xs text-racing-orange font-bold uppercase tracking-widest">15% DTO + ENVÍO GRATIS APLICADO</p>
                </div>
            </div>
        </div>
    );

    const remaining = nextTier.threshold - subtotal;
    const prevThreshold = tiers.indexOf(nextTier) === 0 ? 0 : tiers[tiers.indexOf(nextTier) - 1].threshold;
    const progress = Math.min(100, Math.max(0, ((subtotal - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100));

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Próximo Nivel</p>
                        <h4 className="text-white font-black uppercase italic text-lg flex items-center gap-2">
                            {nextTier.label} <ChevronRight className="w-4 h-4 text-racing-orange animate-pulse" />
                        </h4>
                    </div>
                    <div className="text-right">
                        <p className="text-racing-orange text-2xl font-black italic">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(remaining)}
                        </p>
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Para desbloquear</p>
                    </div>
                </div>

                {/* Progress Bar Track */}
                <div className="h-3 bg-zinc-800 rounded-full w-full relative overflow-hidden mb-4 border border-zinc-700/50">
                    <div
                        className="h-full bg-gradient-to-r from-zinc-600 to-racing-orange transition-all duration-1000 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-20"></div>
                        <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-r from-transparent to-white/20"></div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-tight">
                    <div className={`p-1 rounded-full ${subtotal >= MARKETING_TIERS.PLATA.min ? 'bg-racing-orange' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Truck className="w-3 h-3" />
                    </div>
                    <span className={subtotal >= MARKETING_TIERS.PLATA.min ? 'text-white' : ''}>Envío Gratis</span>
                    <div className="w-4 h-px bg-zinc-800 mx-1"></div>
                    <div className={`p-1 rounded-full ${subtotal >= MARKETING_TIERS.ORO.min ? 'bg-racing-orange' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Percent className="w-3 h-3" />
                    </div>
                    <span className={subtotal >= MARKETING_TIERS.ORO.min ? 'text-white' : ''}>15% Descuento</span>
                </div>
            </div>

            {/* Gloss Effect */}
            <div className="absolute -inset-x-full inset-y-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:animate-shine pointer-events-none"></div>
        </div>
    );
};
