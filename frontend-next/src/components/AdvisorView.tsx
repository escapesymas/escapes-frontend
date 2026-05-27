'use client';

import React from 'react';
import { Cpu, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface AdvisorViewProps {
  selectedBike: string;
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
}

export default function AdvisorView({ selectedBike, messages, input, onInputChange, onSend }: AdvisorViewProps) {
  return (
    <div className="h-[70vh] flex flex-col bg-card border border-card-border rounded-md overflow-hidden shadow-sm animate-fade-in relative">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md p-6 text-center">
        <div className="p-5 bg-card border border-card-border rounded-md shadow-lg max-w-xs flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse">
            <Cpu className="w-6 h-6 text-accent-text" />
          </div>
          <div>
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 inline-block mb-1.5">
              PRÓXIMAMENTE
            </span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Asistente de Telemetría
            </h3>
            <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
              Estamos calibrando los mapas de inyección y entrenando el modelo de compatibilidad con datos de fabricante.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-card-border bg-select-bg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-accent-text" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase text-foreground">Asesor de Mecánica IA</h2>
            <p className="text-[9px] text-text-muted">Consulta técnica en tiempo real para tu escape</p>
          </div>
        </div>
        {selectedBike && (
          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-badge text-badge-text border border-badge-border">
            Enfoque: {selectedBike.split(' ')[0]}
          </span>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <span className="text-[8px] font-mono font-bold text-text-muted uppercase mb-1">
              {msg.role === 'user' ? 'Piloto' : 'Mecánico de IA'}
            </span>
            <div className={`p-3 rounded-md text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-slate-950 font-bold'
                : 'bg-background border border-card-border text-foreground'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSend} className="p-4 border-t border-card-border bg-select-bg flex gap-2">
        <input
          type="text"
          placeholder="Escribe tu consulta mecánica..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-grow h-11 bg-background border border-select-border text-xs px-4 rounded focus:border-accent focus:outline-none text-foreground font-mono"
        />
        <button
          type="submit"
          className="p-3 bg-accent text-slate-950 rounded hover:bg-accent-hover transition-all flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
