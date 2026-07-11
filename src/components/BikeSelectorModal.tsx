'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Sliders, CheckCircle2, Loader2, Search } from 'lucide-react';

interface BikeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBike: (bike: string) => void;
  currentBike?: string;
}

const API_BASE = '/api';

export default function BikeSelectorModal({
  isOpen,
  onClose,
  onSelectBike,
  currentBike,
}: BikeSelectorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Cargar marcas iniciales al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedBrand('');
      setSelectedModel('');
      setSelectedYear('');
      setSearchFilter('');
      let cancelled = false;
      const loadBrands = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE}/vehicles?action=brands`);
          const data = await res.json();
          if (!cancelled) setBrands(data);
        } catch (err) {
          if (!cancelled) console.error('Error fetching brands:', err);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      loadBrands();
      return () => { cancelled = true; };
    }
  }, [isOpen]);

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (selectedBrand) {
      let cancelled = false;
      const loadModels = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE}/vehicles?action=models&brand=${encodeURIComponent(selectedBrand)}`);
          const data = await res.json();
          if (!cancelled) setModels(data);
        } catch (err) {
          if (!cancelled) console.error('Error fetching models:', err);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      loadModels();
      return () => { cancelled = true; };
    }
  }, [selectedBrand]);

  // Cargar años cuando cambia el modelo
  useEffect(() => {
    if (selectedBrand && selectedModel) {
      let cancelled = false;
      const loadYears = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE}/vehicles?action=years&brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`);
          const data = await res.json();
          if (!cancelled) setYears(data);
        } catch (err) {
          if (!cancelled) console.error('Error fetching years:', err);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      loadYears();
      return () => { cancelled = true; };
    }
  }, [selectedBrand, selectedModel]);

  if (!isOpen) return null;

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setSearchFilter('');
    setStep(2);
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setSearchFilter('');
    setStep(3);
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    const bikeString = `${selectedBrand} ${selectedModel} (${year})`;
    onSelectBike(bikeString);
    onClose();
  };

  const handleClear = () => {
    onSelectBike('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Drawer / Content Modal */}
      <div className="relative w-full md:max-w-md bg-card border-t md:border border-card-border md:rounded-md shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] z-10 transition-transform duration-300 transform translate-y-0">
        
        {/* Header */}
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Garaje &mdash; Configurar Moto
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-sm text-text-muted hover:text-foreground hover:bg-select-bg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (Telemetría de pasos) */}
        <div className="grid grid-cols-3 h-1 bg-select-bg">
          <div className={`h-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-transparent'}`} />
          <div className={`h-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-transparent'}`} />
          <div className={`h-full transition-colors ${step >= 3 ? 'bg-accent' : 'bg-transparent'}`} />
        </div>

        {/* Info panel si ya hay moto */}
        {currentBike && step === 1 && (
          <div className="p-4 mx-4 mt-4 bg-badge text-badge-text border border-badge-border rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-badge-text" />
              <span className="text-[10px] font-mono font-bold uppercase">Moto activa: {currentBike}</span>
            </div>
            <button 
              onClick={handleClear}
              className="text-[9px] font-mono font-bold uppercase underline text-red-500 hover:text-red-400"
            >
              Quitar
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-4 overflow-y-auto flex-grow min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Cargando catálogo...</span>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-2">
                    1. Selecciona la Marca
                  </h4>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Filtrar marcas..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-select-bg border border-card-border rounded text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleBrandSelect(brand)}
                        className="p-4 text-left border border-card-border hover:border-accent hover:bg-select-bg rounded font-mono text-xs font-bold text-foreground transition-all flex items-center justify-between"
                      >
                        <span>{brand}</span>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                      2. Selecciona el Modelo ({selectedBrand})
                    </h4>
                    <button 
                      onClick={() => { setStep(1); setSearchFilter(''); }} 
                      className="text-[9px] font-mono font-bold text-accent-text hover:underline"
                    >
                      Atrás
                    </button>
                  </div>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Filtrar modelos..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-select-bg border border-card-border rounded text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-1">
                    {filteredModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => handleModelSelect(model)}
                        className="p-3.5 text-left border border-card-border hover:border-accent hover:bg-select-bg rounded font-mono text-xs font-bold text-foreground transition-all flex items-center justify-between"
                      >
                        <span>{model}</span>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                      3. Selecciona el Año ({selectedBrand} {selectedModel})
                    </h4>
                    <button 
                      onClick={() => { setStep(2); setSearchFilter(''); }} 
                      className="text-[9px] font-mono font-bold text-accent-text hover:underline"
                    >
                      Atrás
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className="p-3 text-center border border-card-border hover:border-accent hover:bg-select-bg rounded font-mono text-xs font-bold text-foreground transition-all"
                      >
                        {year}
                      </button>
                    ))}
                    {years.length > 0 && (
                      <button
                        onClick={() => handleYearSelect('Todos')}
                        className="p-3 text-center border border-card-border hover:border-accent hover:bg-select-bg rounded font-mono text-xs font-bold text-foreground transition-all col-span-3"
                      >
                        Todos los años
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-card-border bg-select-bg text-center rounded-b-xl md:rounded-b-none">
          <p className="text-[9px] font-mono text-text-muted uppercase">
            Compatible con escapes Akrapovič, Mivv, Yoshimura y LeoVince
          </p>
        </div>
      </div>
    </div>
  );
}
