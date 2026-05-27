'use client';

import React from 'react';
import { Bike, Star, Trash2 } from 'lucide-react';

interface GarageViewProps {
  selectedBike: string;
  garageList?: string[];
  onOpenSelector: () => void;
  onClearBike: () => void;
  onRemoveBike?: (bike: string) => void;
  onSetActiveBike?: (bike: string) => void;
}

export default function GarageView({
  selectedBike,
  garageList = [],
  onOpenSelector,
  onClearBike,
  onRemoveBike,
  onSetActiveBike,
}: GarageViewProps) {
  
  // Filtrar el resto de motos guardadas que no son la activa
  const otherBikes = garageList.filter(bike => bike !== selectedBike);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="p-6 bg-card border border-card-border rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-icon-box flex items-center justify-center border border-card-border">
              <Bike className="w-5 h-5 text-accent-text" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">Mi Garaje Virtual</h2>
              <p className="text-[10px] text-text-muted">Administra tus motos y descubre recambios compatibles específicos.</p>
            </div>
          </div>

          {/* Botón para añadir moto rápido */}
          {garageList.length > 0 && (
            <button
              onClick={onOpenSelector}
              className="px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all cursor-pointer uppercase tracking-wider"
            >
              + Añadir Moto
            </button>
          )}
        </div>

        {/* MOTO ACTIVA */}
        {selectedBike ? (
          <div className="border border-accent/30 bg-accent/5 rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/20 border border-accent/40 rounded flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6 text-accent" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent text-slate-950 flex items-center gap-1 w-fit">
                  <Star className="w-3 h-3 fill-current" /> Activa en Selector
                </span>
                <h3 className="font-mono text-base font-bold uppercase text-foreground mt-1.5">
                  {selectedBike}
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">Compatible con escapes y sistemas de filtrado rápido.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onClearBike}
                className="px-4 py-2 text-xs font-mono font-bold rounded-sm border border-card-border text-red-500 hover:bg-red-500/5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        ) : garageList.length > 0 ? (
          <div className="border border-dashed border-card-border rounded p-5 text-center flex flex-col items-center mb-6">
            <h3 className="font-mono text-xs font-bold uppercase text-text-muted">Ninguna moto seleccionada como activa</h3>
            <p className="text-[9px] text-text-muted mt-1">Elige una de tus motos del historial a continuación para buscar piezas.</p>
          </div>
        ) : null}

        {/* HISTORIAL / OTRAS MOTOS */}
        {otherBikes.length > 0 && (
          <div className="mt-4">
            <h3 className="font-mono text-[10px] font-bold uppercase text-text-muted tracking-wider mb-3">
              Motos en Historial ({otherBikes.length})
            </h3>
            <div className="flex flex-col gap-3">
              {otherBikes.map((bike, index) => (
                <div
                  key={index}
                  className="border border-card-border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-text-muted/30 transition-all bg-background/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-card border border-card-border rounded flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5 text-text-muted" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase text-foreground">{bike}</h4>
                      <p className="text-[9px] text-text-muted">Guardada en tu garaje virtual.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    {onSetActiveBike && (
                      <button
                        onClick={() => onSetActiveBike(bike)}
                        className="px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm border border-card-border text-text-muted hover:text-foreground hover:bg-select-bg transition-all cursor-pointer uppercase"
                      >
                        Activar
                      </button>
                    )}
                    {onRemoveBike && (
                      <button
                        onClick={() => onRemoveBike(bike)}
                        className="p-1.5 text-text-muted hover:text-red-500 rounded hover:bg-red-500/5 transition-all cursor-pointer"
                        title="Eliminar de mi garaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GARAJE TOTALMENTE VACÍO */}
        {garageList.length === 0 && (
          <div className="border border-dashed border-card-border rounded p-8 text-center flex flex-col items-center">
            <Bike className="w-10 h-10 text-text-muted mb-3" />
            <h3 className="font-mono text-xs font-bold uppercase text-foreground mb-1">No tienes ninguna moto en tu garaje</h3>
            <p className="text-[10px] text-text-muted mb-6">Configura tu modelo para buscar recambios de inmediato.</p>
            <button
              onClick={onOpenSelector}
              className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all cursor-pointer"
            >
              Añadir Mi Primera Moto
            </button>
          </div>
        )}
      </div>

      {/* TAREAS DE MANTENIMIENTO */}
      {selectedBike && (
        <div className="p-6 bg-card border border-card-border rounded-md shadow-sm">
          <h3 className="font-mono text-xs font-bold uppercase text-foreground mb-4">
            Tareas de mantenimiento recomendadas
          </h3>
          <div className="flex flex-col gap-3">
            <div className="p-3 border border-card-border rounded flex justify-between items-center bg-background/50">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-mono font-bold text-foreground">Revisión de escape (Carbonilla y Juntas)</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">Pendiente</span>
            </div>
            <div className="p-3 border border-card-border rounded flex justify-between items-center bg-background/50">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-bold text-foreground">Cambio de Filtro de Aire de Competición</span>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-badge text-badge-text border border-badge-border">Al día</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
