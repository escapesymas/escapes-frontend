import React from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';

interface KlarnaBannerProps {
    onClick: () => void;
}

export const KlarnaBanner: React.FC<KlarnaBannerProps> = ({ onClick }) => {
    return (
        <div
            onClick={onClick}
            className="relative overflow-hidden bg-racing-carbon border-y border-zinc-800 cursor-pointer group transition-all duration-300 hover:bg-black"
        >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Left side */}
                    <div className="flex items-center gap-4 text-white flex-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FFB3C7]/20 blur-xl rounded-full"></div>
                            <div className="relative bg-[#FFB3C7]/10 backdrop-blur-sm p-4 rounded-full border border-[#FFB3C7]/20">
                                <CreditCard className="w-8 h-8 text-[#FFB3C7]" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#FFB3C7] bg-[#FFB3C7]/10 px-2 py-0.5 rounded-sm">Nuevo Método de Pago</span>
                            </div>
                            <h3 className="text-lg md:text-2xl font-black uppercase italic leading-tight flex flex-wrap items-end gap-2 mt-1">
                                Paga en 3 plazos con <span className="text-3xl md:text-4xl font-black tracking-tighter leading-none text-[#FFB3C7]">Klarna.</span>
                            </h3>
                            <p className="text-xs md:text-sm font-bold mt-1 text-zinc-400">
                                Sin intereses. Compra el escape hoy y divídelo en plazos cómodos.
                            </p>
                        </div>
                    </div>

                    {/* Right side CTA */}
                    <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            className="w-full md:w-auto bg-[#FFB3C7] text-black px-8 py-4 rounded-sm font-black uppercase text-sm tracking-wider hover:bg-white transition-all duration-300 shadow-xl shadow-[#FFB3C7]/10 flex items-center justify-center gap-2"
                        >
                            <span>Ver Catálogo</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Animated shine effect */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 -left-[100%] h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent animate-klarna-shine pointer-events-none"></div>
            </div>

            <style>{`
        @keyframes klarna-shine {
          0% { transform: translateX(0%); }
          100% { transform: translateX(400%); }
        }
        .animate-klarna-shine {
          animation: klarna-shine 4s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
