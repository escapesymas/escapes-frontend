import React, { useState } from 'react';
import { Bot, X, Send, Wrench } from 'lucide-react';

export const AIAdvisor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-racing-carbon border border-zinc-700 shadow-2xl rounded-sm overflow-hidden flex flex-col animate-fade-in-up">
          {/* Header */}
          <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-bold text-white text-sm uppercase tracking-wide">Mecánico Virtual IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="h-64 p-4 overflow-y-auto bg-zinc-900/50 space-y-4">
            <div className="bg-zinc-800 p-3 rounded-br-lg rounded-tl-lg rounded-tr-lg border border-zinc-700">
              <p className="text-sm text-zinc-200">
                ¡Hola! Soy tu asistente técnico de Escapes y Más. ¿Necesitas saber si ese escape Akrapovic es compatible con tu moto del 2021?
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-zinc-800 border-t border-zinc-700 flex gap-2">
            <input 
              type="text" 
              placeholder="Pregunta sobre compatibilidad..." 
              className="flex-1 bg-zinc-900 border border-zinc-600 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-racing-orange"
            />
            <button className="bg-racing-orange p-2 rounded-sm text-white hover:bg-orange-700">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 bg-racing-orange text-white rounded-full shadow-lg shadow-orange-900/40 hover:bg-white hover:text-racing-orange transition-all duration-300 transform hover:scale-105"
      >
        {isOpen ? <X className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
        
        {/* Tooltip Label */}
        {!isOpen && (
          <span className="absolute right-16 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            ¿Dudas técnicas?
          </span>
        )}
      </button>
    </div>
  );
};