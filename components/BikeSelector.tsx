
import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Bike, SlidersHorizontal } from 'lucide-react';
import { BikeSelection, BikeDataStructure } from '../types';
import { MODEL_YEARS } from '../storeData';

interface BikeSelectorProps {
  onSearch?: (selection: BikeSelection) => void;
  onTextSearch?: (query: string) => void;
  isLoading?: boolean;
  bikeData: BikeDataStructure;
}

export const BikeSelector: React.FC<BikeSelectorProps> = ({ onSearch, onTextSearch, isLoading = false, bikeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textQuery, setTextQuery] = useState('');

  const [selection, setSelection] = useState<BikeSelection>({
    brand: '',
    model: '',
    year: ''
  });

  const handleChange = (field: keyof BikeSelection, value: string) => {
    if (field === 'brand') {
      // Al cambiar marca, resetear modelo y año
      setSelection(prev => ({ ...prev, brand: value, model: '', year: '' }));
    } else if (field === 'model') {
      // Al cambiar modelo, resetear año
      setSelection(prev => ({ ...prev, model: value, year: '' }));
    } else {
      setSelection(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBikeSearchClick = () => {
    if (onSearch && selection.brand) {
      onSearch(selection);
    }
  };

  const handleTextSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTextSearch && textQuery.trim()) {
      onTextSearch(textQuery);
    }
  };

  const currentModels = selection.brand ? bikeData.models[selection.brand] || [] : [];

  // Calcular años disponibles para el modelo seleccionado
  const availableYears = selection.model
    ? (MODEL_YEARS[selection.model] || bikeData.years) // Si no hay mapping específico, usa genéricos
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto relative z-20 px-4">
      <div className="bg-racing-carbon border border-zinc-700 p-4 md:p-6 rounded-md shadow-2xl shadow-black/50">

        {/* BUSCADOR DE TEXTO (PRINCIPAL) */}
        <form onSubmit={handleTextSearchClick} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              aria-label="Buscar pieza"
              placeholder="Buscar pieza (Ej: Escape Akrapovic, Pastillas freno...)"
              className="w-full h-12 bg-zinc-900 border border-zinc-700 text-white px-4 pl-12 rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 font-medium"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          </div>
          <button
            type="submit"
            aria-label="Buscar"
            disabled={isLoading || !textQuery.trim()}
            className="h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase px-8 rounded-sm transition-colors border border-zinc-700 flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </form>

        {/* TOGGLE FILTRO MOTO */}
        <div className="border-t border-zinc-800 pt-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Ocultar filtro por moto" : "Mostrar filtro por moto"}
            className="flex items-center gap-2 text-racing-orange hover:text-white transition-colors text-xs font-bold uppercase tracking-widest w-full"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isOpen ? 'Ocultar filtro por moto' : 'Filtrar compatibilidad por moto'}
            {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </button>
        </div>

        {/* SELECTORES DE MOTO (DESPLEGABLE) */}
        {isOpen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mt-4 animate-fade-in">
            {/* Brand */}
            <div className="relative">
              <select
                aria-label="Seleccionar Marca"
                className="w-full h-12 bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium"
                value={selection.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
              >
                <option value="">Marca</option>
                {bikeData.brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Model */}
            <div className="relative">
              <select
                aria-label="Seleccionar Modelo"
                className="w-full h-12 bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selection.brand}
                value={selection.model}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                <option value="">Modelo</option>
                {currentModels.length > 0 ? (
                  currentModels.map((model: string) => (
                    <option key={model} value={model}>{model}</option>
                  ))
                ) : (
                  <option value="" disabled>Selecciona Marca</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Year */}
            <div className="relative">
              <select
                aria-label="Seleccionar Año"
                className="w-full h-12 bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selection.model}
                value={selection.year}
                onChange={(e) => handleChange('year', e.target.value)}
              >
                <option value="">Año</option>
                {availableYears.length > 0 ? (
                  availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <option value="" disabled>Selecciona Modelo</option>
                )}
                {/* Fallback option if needed */}
                {availableYears.length > 0 && <option value="General">Todos los años</option>}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Action Button */}
            <button
              onClick={handleBikeSearchClick}
              aria-label="Aplicar filtro de moto"
              disabled={isLoading || !selection.brand}
              className={`h-12 bg-racing-orange hover:bg-orange-700 text-white font-bold uppercase tracking-wide rounded-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLoading || !selection.brand ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Bike className="w-5 h-5" />
              )}
              <span>Filtrar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
