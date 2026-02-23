import React from 'react';
import { Gift, ArrowRight, Sparkles } from 'lucide-react';

interface PromoBannerProps {
    onForumClick: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onForumClick }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-racing-orange via-orange-600 to-racing-orange animate-gradient-x">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Left side - Icon & Text */}
                    <div className="flex items-center gap-4 text-white flex-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                            <div className="relative bg-white/10 backdrop-blur-sm p-4 rounded-full border-2 border-white/30 animate-pulse">
                                <Gift className="w-8 h-8" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Promoción Exclusiva</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black uppercase italic leading-tight">
                                ¿Buscas descuento? 🎁
                            </h3>
                            <p className="text-sm md:text-base font-medium mt-1 text-white/90">
                                Hay un <span className="font-bold underline decoration-2">código secreto</span> escondido en el Paddock
                            </p>
                        </div>
                    </div>

                    {/* Right side - CTA Button */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={onForumClick}
                            className="group bg-white text-orange-700 px-8 py-4 rounded-sm font-black uppercase text-sm tracking-wider hover:bg-zinc-950 hover:text-white transition-all duration-300 shadow-2xl hover:shadow-white/20 flex items-center gap-2 border-2 border-white hover:border-racing-orange"
                        >
                            <span>Ir al Paddock</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Animated shine effect */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent animate-shine"></div>
            </div>

            <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes shine {
          to { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
