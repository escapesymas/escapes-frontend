import React from 'react';
import { Wrench, ArrowRight, Search, FileText } from 'lucide-react';

interface SearchImprovementsBannerProps {
    onClick: () => void;
}

export const SearchImprovementsBanner: React.FC<SearchImprovementsBannerProps> = ({ onClick }) => {
    return (
        <div
            onClick={onClick}
            className="relative overflow-hidden bg-zinc-900 border-b border-zinc-800 cursor-pointer group transition-all duration-300 hover:bg-black"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FF4500 25%, transparent 25%, transparent 75%, #FF4500 75%, #FF4500), repeating-linear-gradient(45deg, #FF4500 25%, #18181b 25%, #18181b 75%, #FF4500 75%, #FF4500)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Left side */}
                    <div className="flex items-center gap-4 text-white flex-1">
                        <div className="relative hidden sm:block">
                            <div className="absolute inset-0 bg-racing-orange/20 blur-xl rounded-full"></div>
                            <div className="relative bg-racing-orange/10 backdrop-blur-sm p-4 rounded-full border border-racing-orange/20">
                                <Wrench className="w-8 h-8 text-racing-orange" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-racing-orange bg-racing-orange/10 px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                                    <Search className="w-3 h-3" />
                                    Mejoras en curso
                                </span>
                            </div>
                            <h3 className="text-lg md:text-xl font-black uppercase italic leading-tight text-white mt-1">
                                Estamos actualizando nuestro <span className="text-racing-orange">buscador de motos y recambios</span>
                            </h3>
                            <p className="text-xs md:text-sm font-medium mt-1.5 text-zinc-400 max-w-2xl">
                                Si no encuentras tu moto o la pieza que necesitas en la web, no te preocupes. Escríbenos y te haremos un presupuesto a medida sin compromiso.
                            </p>
                        </div>
                    </div>

                    {/* Right side CTA */}
                    <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            className="w-full md:w-auto bg-white text-black px-8 py-3.5 rounded-sm font-black uppercase text-xs tracking-wider hover:bg-racing-orange hover:text-white transition-colors duration-300 shadow-xl flex items-center justify-center gap-2 group-hover:bg-racing-orange group-hover:text-white"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Pedir Presupuesto</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
