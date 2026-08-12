'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import PaddockFeed from './PaddockFeed';

interface PaddockViewProps {
  selectedBike: string;
}

export default function PaddockView({ selectedBike }: PaddockViewProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="p-6 bg-card border border-card-border rounded-md shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-icon-box flex items-center justify-center border border-card-border">
              <MessageSquare className="w-5 h-5 text-accent-text" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">Comunidad Paddock</h2>
              <p className="text-[10px] text-text-muted">Comparte experiencias de instalación, mapas de inyección y vídeos en circuito.</p>
            </div>
          </div>
          <button className="px-4 py-2.5 text-xs font-mono font-bold rounded bg-accent text-slate-950 hover:bg-accent-hover transition-all cursor-pointer">
            + Publicar Tema
          </button>
        </div>

        <div className="flex gap-2 pb-3 overflow-x-auto border-b border-card-border/60 no-scrollbar mb-4">
          <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-accent text-slate-950 cursor-pointer">Todo</span>
          <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-tag text-tag-text border border-tag-border cursor-pointer hover:border-accent">Mecánica</span>
          <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-tag text-tag-text border border-tag-border cursor-pointer hover:border-accent">Homologación</span>
          <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-tag text-tag-text border border-tag-border cursor-pointer hover:border-accent">Telemetría</span>
        </div>

        <PaddockFeed selectedBike={selectedBike} />
      </div>
    </div>
  );
}
