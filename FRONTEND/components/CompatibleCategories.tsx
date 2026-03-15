import React from 'react';
import { ArrowRight, Box, Plus, ChevronRight } from 'lucide-react';
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
          <div key={i} className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-sm"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/20 rounded-sm border border-dashed border-zinc-300 dark:border-zinc-800">
        <Box className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No hay piezas específicas</h3>
        <p className="text-zinc-500 max-w-md mx-auto">No hemos encontrado piezas exactas para {vehicleName}, pero puedes probar con una búsqueda general.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="h-8 w-1.5 bg-racing-orange"></div>
        <h2 className="text-2xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tight">
          Explorar por <span className="text-racing-orange">Categoría</span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {categories.map((parent) => (
          <div key={parent.id} className="flex flex-col bg-white dark:bg-racing-carbon/50 rounded-sm border border-zinc-100 dark:border-zinc-800/50 overflow-hidden shadow-sm">
            {/* Parent Header */}
            <div className="bg-zinc-50 dark:bg-zinc-900/80 p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase italic text-zinc-800 dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-racing-orange rounded-full"></div>
                {parent.name}
              </h3>
              <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-full uppercase tracking-tighter">
                {parent.count} Productos
              </span>
            </div>

            {/* Children List */}
            <div className="flex-grow p-2">
              {parent.children && parent.children.length > 0 ? (
                <div className="flex flex-col">
                  {parent.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSelectCategory(child.id, child.name)}
                      className="group flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-sm transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-racing-orange transition-colors">
                          {child.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
                          ({child.count})
                        </span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-300 group-hover:text-racing-orange group-hover:rotate-90 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <button
                    onClick={() => onSelectCategory(parent.id, parent.name)}
                    className="text-xs font-bold text-racing-orange hover:underline uppercase tracking-widest"
                  >
                    Ver todos los productos
                  </button>
                </div>
              )}
            </div>

            {/* Footer / All Link */}
            <button
              onClick={() => onSelectCategory(parent.id, parent.name)}
              className="p-4 border-t border-zinc-50 dark:border-zinc-800/30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-racing-orange transition-colors mt-auto"
            >
              <ArrowRight className="w-3 h-3" />
              Ver todo de {parent.name}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center border-t border-zinc-100 dark:border-zinc-800 pt-10">
        <p className="text-zinc-500 text-sm mb-4 uppercase tracking-widest font-bold">¿No encuentras lo que buscas?</p>
        <button 
           onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
           className="bg-zinc-900 dark:bg-zinc-800 text-white px-8 py-3 rounded-sm font-black uppercase text-xs tracking-[0.2em] hover:bg-racing-orange transition-all shadow-lg"
        >
          Nueva Búsqueda
        </button>
      </div>
    </div>
  );
};
