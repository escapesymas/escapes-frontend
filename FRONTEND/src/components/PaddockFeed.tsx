'use client';

import React from 'react';
import { MessageSquare, User, Trophy, ChevronRight } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  author: string;
  rank: string;
  excerpt: string;
  replies: number;
  xp: number;
  category: string;
  bikeTag?: string;
}

interface PaddockFeedProps {
  selectedBike?: string;
}

const THREADS: Thread[] = [
  {
    id: 'th-1',
    title: '¿Mejor mapa de inyección para escapes Akrapovič en R1?',
    author: 'Álvaro_MGP',
    rank: 'Nivel 4 · Entusiasta',
    excerpt: 'Acabo de montar el slip-on en mi R1 2023 y noto que petardea un poco al retener. ¿Recomendáis remapear la centralita o con la autocalibración es suficiente?',
    replies: 8,
    xp: 15,
    category: 'Mecánica',
    bikeTag: 'Yamaha YZF-R1'
  },
  {
    id: 'th-2',
    title: 'Homologación de escape LeoVince GP Duals en ITV de Madrid',
    author: 'Ruben_Z900',
    rank: 'Nivel 2 · Novato',
    excerpt: '¿Alguien ha pasado la ITV con el escape LeoVince GP Duals puesto recientemente en Madrid? Tengo la tarjeta de homologación pero me da reparo por los decibelios.',
    replies: 12,
    xp: 20,
    category: 'Legal',
    bikeTag: 'Kawasaki Z900'
  },
  {
    id: 'th-3',
    title: 'Diferencia de potencia real: Escape completo vs Slip-on',
    author: 'Alex_CBR',
    rank: 'Nivel 8 · Mecánico Pro',
    excerpt: 'Hemos metido en el banco de potencia una CBR 1000RR-R con línea completa Evolution Line y otra con slip-on de titanio. Os dejo las gráficas detalladas.',
    replies: 24,
    xp: 45,
    category: 'Telemetría',
    bikeTag: 'Honda CBR 1000RR-R'
  }
];

export default function PaddockFeed({ selectedBike }: PaddockFeedProps) {
  // Ordenar o priorizar hilos relacionados con la marca/moto seleccionada
  const sortedThreads = selectedBike
    ? [...THREADS].sort((a, b) => {
        const brand = selectedBike.split(' ')[0].toLowerCase();
        const aHasBrand = a.bikeTag?.toLowerCase().includes(brand);
        const bHasBrand = b.bikeTag?.toLowerCase().includes(brand);
        return (bHasBrand ? 1 : 0) - (aHasBrand ? 1 : 0);
      })
    : THREADS;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div>
          <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
            Foro Paddock &mdash; Hilos Candentes
          </h3>
          {selectedBike && (
            <p className="text-[9px] font-mono text-badge-text font-bold uppercase mt-0.5">
              Priorizando temas de {selectedBike.split(' ')[0]}
            </p>
          )}
        </div>
        <span className="text-[9px] font-mono font-bold uppercase text-accent-text hover:underline cursor-pointer">
          Ver Paddock
        </span>
      </div>

      {/* Grid deslizable en móvil, vertical en desktop */}
      <div className="flex overflow-x-auto snap-x scroll-smooth pb-4 px-4 md:px-0 gap-4 md:flex-col md:overflow-visible no-scrollbar">
        {sortedThreads.map((thread) => {
          const isRelated = selectedBike && thread.bikeTag?.toLowerCase().includes(selectedBike.split(' ')[0].toLowerCase());
          
          return (
            <div
              key={thread.id}
              className={`flex-shrink-0 snap-start w-[290px] md:w-full bg-card border rounded-md p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                isRelated 
                  ? 'border-badge-border/60 bg-badge/5' 
                  : 'border-card-border'
              }`}
            >
              <div>
                {/* Autor y Categoría */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-icon-box flex items-center justify-center border border-card-border">
                      <User className="w-3.5 h-3.5 text-accent-text" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-foreground leading-none">{thread.author}</span>
                      <span className="text-[8px] font-mono text-text-muted uppercase tracking-tighter leading-none mt-0.5">{thread.rank}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-tag text-tag-text border border-tag-border">
                    {thread.category}
                  </span>
                </div>

                {/* Título e Intro */}
                <h4 className="font-mono text-xs font-bold uppercase text-foreground hover:text-accent-text cursor-pointer line-clamp-1 mb-1.5 transition-colors">
                  {thread.title}
                </h4>
                <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed mb-3">
                  {thread.excerpt}
                </p>
              </div>

              {/* Footer con Stats */}
              <div className="pt-3 border-t border-card-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[9px] font-mono text-text-muted">
                  <span className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                    <MessageSquare className="w-3 h-3" /> {thread.replies} Respuestas
                  </span>
                  <span className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors">
                    <Trophy className="w-3 h-3" /> +{thread.xp} XP
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {thread.bikeTag && (
                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-card border border-card-border text-foreground">
                      {thread.bikeTag}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-accent" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
