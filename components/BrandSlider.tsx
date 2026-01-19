import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface Brand {
    name: string;
    logo: string;
}

export function BrandSlider() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            .catch(err => {
                console.error("Error loading brands:", err);
                setError("No se pudieron cargar las marcas.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (error || brands.length === 0) return null;

    // Duplicate brands to ensure seamless infinite scroll if there are few items
    const displayBrands = brands.length < 10 ? [...brands, ...brands, ...brands, ...brands] : [...brands, ...brands];

    return (
        <section className="py-12 bg-zinc-950 border-y border-zinc-900 overflow-hidden relative group">
            <div className="container mx-auto px-4 mb-8">
                <h2 className="text-2xl font-bold text-white uppercase italic border-l-4 border-racing-orange pl-4">
                    Nuestras Marcas
                </h2>
            </div>

            <div className="relative w-full flex overflow-hidden">
                {/* Gradient masks for smooth fade edges */}
                <div className="absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

                <div className="flex animate-marquee hover:pause-animation gap-12 min-w-full">
                    {displayBrands.map((brand, index) => (
                        <div
                            key={`${brand.name}-${index}`}
                            className="flex-shrink-0 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 transform hover:scale-110 cursor-pointer"
                        >
                            <img
                                src={`/brands/${brand.logo}`}
                                alt={brand.name}
                                width={150}
                                height={64}
                                className="h-16 w-auto max-w-[150px] object-contain"
                                style={{ filter: 'brightness(0) invert(1)' }}
                                title={brand.name}
                                loading="lazy"
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
          animation: marquee 40s linear infinite;
        }
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
        </section>
    );
}
