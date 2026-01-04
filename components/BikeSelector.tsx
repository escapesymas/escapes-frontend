import React, { useState } from 'react';
import { Search, ChevronDown, Bike } from 'lucide-react';
import { BikeSelection, BikeDataStructure } from '../types';

interface BikeSelectorProps {
  onSearch?: (selection: BikeSelection) => void;
  isLoading?: boolean;
  bikeData: BikeDataStructure; // Now receives data dynamically
}

export const BikeSelector: React.FC<BikeSelectorProps> = ({ onSearch, isLoading = false, bikeData }) => {
  const [selection, setSelection] = useState<BikeSelection>({
    brand: '',
    model: '',
    year: ''
  });

  const handleChange = (field: keyof BikeSelection, value: string) => {
    // Reset model if brand changes
    if (field === 'brand') {
      setSelection(prev => ({ ...prev, brand: value, model: '' }));
    } else {
      setSelection(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSearchClick = () => {
    if (onSearch && selection.brand) {
      onSearch(selection);
    }
  };

  // Get models based on selected brand from the passed prop
  const currentModels = selection.brand ? bikeData.models[selection.brand] || [] : [];

  return (
    <div className="w-full max-w-4xl mx-auto -mt-16 relative z-20 px-4">
      <div className="bg-racing-carbon border border-zinc-700 p-6 rounded-md shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 mb-4 text-racing-orange font-bold uppercase tracking-wider text-sm">
          <Bike className="w-5 h-5" />
          <span>Buscador de Piezas Compatibles</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Brand */}
          <div className="relative">
            <select 
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
              className="w-full h-12 bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50"
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
                <option value="" disabled>Sin modelos</option>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Year */}
          <div className="relative">
            <select 
              className="w-full h-12 bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50"
              disabled={!selection.model}
              value={selection.year}
              onChange={(e) => handleChange('year', e.target.value)}
            >
              <option value="">Año</option>
              {bikeData.years.length > 0 ? (
                bikeData.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value="General">Todos</option>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Action Button */}
          <button 
            onClick={handleSearchClick}
            disabled={isLoading || !selection.brand}
            className={`h-12 bg-racing-orange hover:bg-orange-700 text-white font-bold uppercase tracking-wide rounded-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLoading || !selection.brand ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};