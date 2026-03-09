import React, { useEffect, useState } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';

interface Brand {
    name: string;
    logo: string;
}

export function BrandSlider() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/brands.txt')
            .then(response => {
                if (!response.ok) throw new Error("Failed to load brands configuration");
                return response.text();
            })
            .then(text => {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const parsedBrands = lines.map(line => {
                    const [name, logo] = line.split(',');
                    return {
                        name: name?.trim(),
                        logo: logo?.trim()
                    };
                }).filter(b => b.name && b.logo);
                setBrands(parsedBrands);
            })
            .catch(err => console.error("Error loading brands:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading || brands.length === 0) return null;

    // Duplicamos las marcas varias veces para asegurar un scroll infinito fluido en todas las resoluciones
    // Especialmente importante para móviles y pantallas 4k
    const displayBrands = [...brands, ...brands, ...brands, ...brands, ...brands, ...brands];

    return (
        <section className="py-8 md:py-12 bg-white dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-900 overflow-hidden relative group">
            <div className="container mx-auto px-4 mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase italic border-l-4 border-racing-orange pl-4">
                    Nuestras Marcas
                </h2>
            </div>

            <div className="relative w-full flex overflow-hidden mask-linear-fade">
                {/* Degradados laterales para suavizar la entrada/salida */}
                <div className="absolute inset-y-0 left-0 w-8 md:w-24 z-10 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-8 md:w-24 z-10 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none" />

                <div className="flex animate-marquee hover:pause-animation items-center">
                    {displayBrands.map((brand, index) => (
                        <div
                            key={`${brand.name}-${index}`}
                            className="flex-shrink-0 mx-6 md:mx-12 select-none"
                        >
                            <img
                                src={brand.logo.endsWith('.svg')
                                    ? `/brands/${brand.logo}`
                                    : optimizeImage(`/brands/${brand.logo}`, { width: 150, format: 'webp' })}
                                alt={brand.name}
                                width={140}
                                height={60}
                                className="h-10 md:h-14 w-auto max-w-[120px] md:max-w-[150px] object-contain transition-transform hover:scale-110"
                                loading="lazy"
                                title={brand.name}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 30s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
                /* Ajuste de velocidad para móviles */
                @media (max-width: 768px) {
                    .animate-marquee {
                        animation-duration: 20s;
                    }
                }
            `}</style>
        </section>
    );
}
