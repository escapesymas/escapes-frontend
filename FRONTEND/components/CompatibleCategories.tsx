import React from 'react';
import { ArrowRight, Box, Layers } from 'lucide-react';
import { Category } from '../types';

interface CompatibleCategoriesProps {
  categories: Category[];
  onSelectCategory: (id: number, name: string) => void;
  isLoading?: boolean;
  vehicleName: string;
}

export const CompatibleCategories: React.FC<CompatibleCategoriesProps> = ({ 
  categories, 
  onSelectCategory, 
  isLoading = false,
  vehicleName
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-sm"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/20 rounded-sm border border-dashed border-zinc-300 dark:border-zinc-800">
        <Box className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No hay categorías específicas</h3>
        <p className="text-zinc-500 max-w-md mx-auto">No hemos encontrado categorías con piezas exactas para {vehicleName}, pero puedes probar con una búsqueda general.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-8 w-1 bg-racing-orange"></div>
        <h2 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white">
          Categorías con piezas para <span className="text-racing-orange">{vehicleName}</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id, cat.name)}
            className="group relative bg-white dark:bg-racing-carbon border border-zinc-200 dark:border-zinc-800 hover:border-racing-orange transition-all p-6 rounded-sm cursor-pointer shadow-sm hover:shadow-xl dark:shadow-black/50"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Layers className="w-16 h-16 text-racing-orange" />
            </div>
            
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-racing-orange mb-2 block">
                {cat.count} Productos encontrados
              </span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 group-hover:translate-x-1 transition-transform">
                {cat.name}
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-racing-orange transition-colors">
                Ver Piezas <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
