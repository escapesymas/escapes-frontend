import React from 'react';
import { Clock, TrendingDown, Award, ShieldCheck } from 'lucide-react';

export const FeaturesBanner: React.FC = () => {
    const features = [
        {
            icon: Clock,
            title: 'Preparación en 24H',
            description: 'Pedidos listos en menos de 24 horas'
        },
        {
            icon: TrendingDown,
            title: 'Precios Competitivos',
            description: 'Descuentos por fidelidad disponibles'
        },
        {
            icon: Award,
            title: 'Primeras Marcas',
            description: 'Termignoni, Öhlins, MIVV y más'
        },
        {
            icon: ShieldCheck,
            title: 'Garantía Sin Complicaciones',
            description: 'Gestión de devoluciones simplificada'
        }
    ];

    return (
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-y border-zinc-800 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 hover:border-racing-orange/50 transition-all duration-300"
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-racing-orange/0 to-racing-orange/0 group-hover:from-racing-orange/5 group-hover:to-transparent transition-all duration-300"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-racing-orange/10 rounded-full flex items-center justify-center group-hover:bg-racing-orange/20 transition-colors">
                                                <Icon className="w-6 h-6 text-racing-orange" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm md:text-base mb-1 group-hover:text-racing-orange transition-colors">
                                                {feature.title}
                                            </h3>
                                            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
