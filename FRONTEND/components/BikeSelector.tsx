import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Bike, SlidersHorizontal, Disc, Settings2 } from 'lucide-react';
import { BikeSelection, BikeDataStructure, TireSelection } from '../types';
import { MODEL_YEARS, TIRE_WIDTHS, TIRE_PROFILES, TIRE_RIMS } from '../storeData';

interface BikeSelectorProps {
  onSearch?: (selection: BikeSelection) => void;
  onTireSearch?: (selection: TireSelection) => void;
  onTextSearch?: (query: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
  bikeData: BikeDataStructure;
}

export const BikeSelector: React.FC<BikeSelectorProps> = ({ onSearch, onTireSearch, onTextSearch, onReset, isLoading = false, bikeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textQuery, setTextQuery] = useState('');

  // Sincronizar estado interno con la URL si es posible
  const [searchParams] = useSearchParams();
  const motoParam = searchParams.get('moto');

  const emptySelection: BikeSelection = { brand: '', model: '', year: '' };

  const [selection, setSelection] = useState<BikeSelection>(() => {
    if (motoParam) {
      const decoded = decodeURIComponent(motoParam);
      const [brand, model, year] = decoded.includes('|') ? decoded.split('|') : decoded.split('-');
      return { brand: brand || '', model: model || '', year: year || '' };
    }
    return emptySelection;
  });

  const handleResetClick = () => {
    setSelection(emptySelection);
    setTireInput('');
    setTireSelection({ width: '', profile: '', rim: '' });
    setTextQuery('');
    if (onReset) onReset();
  };

  const [searchMode, setSearchMode] = useState<'moto' | 'tire'>('moto');
  const [tireInput, setTireInput] = useState('');
  const [tireSelection, setTireSelection] = useState<TireSelection>({
    width: '',
    profile: '',
    rim: ''
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

  const handleTireSearchClick = () => {
    if (onTireSearch && tireSelection.width && tireSelection.profile && tireSelection.rim) {
      onTireSearch(tireSelection);
    }
  };

  // Smart Tire Input Parsing
  const handleTireInputChange = (val: string) => {
    setTireInput(val);

    // Regex to detect: 120/70-17, 1207017, 120 70 17, 120/70ZR17, etc
    const regex = /(\d{2,3})[/\s-]?(\d{2,3})[/\s-]?[rR]?[zZ]?(\d{2})/;
    const match = val.match(regex);

    if (match) {
      setTireSelection({
        width: match[1],
        profile: match[2],
        rim: match[3]
      });
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
      <div className={`bg-white dark:bg-racing-carbon border border-zinc-200 dark:border-zinc-700 p-4 md:p-6 rounded-md shadow-lg transition-all duration-300 ${!motoParam && !isOpen ? 'scale-105' : 'scale-100'}`}>

        {/* BUSCADOR DE TEXTO (SIMPLIFICADO) */}
        {!motoParam && (
          <form onSubmit={handleTextSearchClick} className="flex flex-col md:flex-row gap-2 mb-4 animate-fade-in">
            <div className="relative flex-grow">
              <input
                type="text"
                aria-label="Buscar pieza"
                placeholder="¿Qué pieza buscas hoy?"
                className="w-full h-12 bg-gray-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white px-4 pl-12 rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 text-base"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !textQuery.trim()}
              className="h-12 bg-racing-orange text-white font-black uppercase text-sm px-8 rounded-sm transition-colors hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
              BUSCAR
            </button>
          </form>
        )}

        {/* TOGGLE FILTRO MOTO */}
        <div className={`${!motoParam ? 'border-t border-zinc-200 dark:border-zinc-800 pt-3' : ''}`}>
          {motoParam && !isOpen ? (
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-racing-orange/10 flex items-center justify-center">
                  <Bike className="w-5 h-5 text-racing-orange" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter leading-none mb-1">Vehículo Seleccionado</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white italic uppercase tracking-tight">
                    {selection.brand} {selection.model} {selection.year}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetClick}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-all mr-2"
                >
                  Resetear
                </button>
                <button
                  onClick={() => setIsOpen(true)}
                  className="text-xs font-black uppercase tracking-widest text-racing-orange border border-racing-orange/20 px-4 py-2 rounded-sm hover:bg-racing-orange hover:text-white transition-all"
                >
                  Cambiar Moto
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Ocultar filtro por moto" : "Mostrar filtro por moto"}
              className="flex items-center gap-2 text-racing-orange hover:text-zinc-900 dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest w-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isOpen ? 'Cerrar Selector' : 'Filtrar por mi Vehículo'}
              {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
          )}
        </div>

        {/* SELECTORES DE MOTO (DESPLEGABLE) */}
        {isOpen && (
          <div className="mt-6 animate-fade-in">
            {/* TABS DE MODO */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-sm border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setSearchMode('moto')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${searchMode === 'moto' ? 'bg-racing-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                  <Bike className="w-3 h-3" />
                  Por Modelo
                </button>
                <button
                  onClick={() => setSearchMode('tire')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${searchMode === 'tire' ? 'bg-racing-orange text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                  <Disc className="w-3 h-3" />
                  Por Medida
                </button>
              </div>
              
              <button 
                onClick={handleResetClick}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-all"
              >
                Limpiar Filtros
              </button>
            </div>

            {searchMode === 'moto' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {/* Brand */}
                <div className="relative">
                  <select
                    aria-label="Seleccionar Marca"
                    className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium"
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
                    className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-4 rounded-sm appearance-none focus:border-racing-orange focus:ring-1 focus:ring-racing-orange outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {availableYears.length > 0 && <option value="General">Todos los años</option>}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
                </div>

                {/* Action Button */}
                <button
                  onClick={handleBikeSearchClick}
                  aria-label="Aplicar filtro de moto"
                  disabled={!selection.brand || !selection.model}
                  className={`h-12 bg-racing-orange hover:bg-orange-700 text-white font-bold uppercase tracking-wide rounded-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!selection.brand || !selection.model ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Bike className="w-5 h-5" />
                  )}
                  <span>{isLoading ? 'Buscando...' : 'Buscar Piezas'}</span>
                </button>
              </div>
            ) : (
              /* MODO NEUMÁTICO */
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Smart Input */}
                  <div className="md:col-span-5 relative">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      Introducción rápida
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ej: 180/55-17 o 1805517"
                        className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 font-bold"
                        value={tireInput}
                        onChange={(e) => handleTireInputChange(e.target.value)}
                      />
                      <Settings2 className="absolute right-4 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="hidden md:flex md:col-span-1 justify-center items-center h-12">
                    <span className="text-zinc-600 font-bold">O</span>
                  </div>

                  {/* Guided Dropdowns */}
                  <div className="md:col-span-6 grid grid-cols-3 gap-2">
                    <div className="relative">
                      <select
                        className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-3 rounded-sm appearance-none focus:border-racing-orange outline-none font-medium text-sm"
                        value={tireSelection.width}
                        onChange={(e) => setTireSelection(prev => ({ ...prev, width: e.target.value }))}
                      >
                        <option value="">Ancho</option>
                        {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-3 rounded-sm appearance-none focus:border-racing-orange outline-none font-medium text-sm"
                        value={tireSelection.profile}
                        onChange={(e) => setTireSelection(prev => ({ ...prev, profile: e.target.value }))}
                      >
                        <option value="">Perfil</option>
                        {TIRE_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full h-12 bg-gray-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 px-3 rounded-sm appearance-none focus:border-racing-orange outline-none font-medium text-sm"
                        value={tireSelection.rim}
                        onChange={(e) => setTireSelection(prev => ({ ...prev, rim: e.target.value }))}
                      >
                        <option value="">Llanta</option>
                        {TIRE_RIMS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-sm border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none mb-1">Medida seleccionada</span>
                      <span className="text-xl font-black italic text-racing-orange">
                        {tireSelection.width && tireSelection.profile && tireSelection.rim
                          ? `${tireSelection.width} / ${tireSelection.profile} - ${tireSelection.rim}"`
                          : '--- / -- - --'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTireSearchClick}
                    disabled={isLoading || !tireSelection.width || !tireSelection.profile || !tireSelection.rim}
                    className={`h-12 bg-zinc-900 hover:bg-black text-white font-bold uppercase tracking-widest px-10 rounded-sm flex items-center justify-center gap-2 border border-zinc-700 transition-all active:scale-[0.98] ${isLoading || !tireSelection.width || !tireSelection.profile || !tireSelection.rim ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Disc className="w-5 h-5" />}
                    <span>Buscar Neumáticos</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
