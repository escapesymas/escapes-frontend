import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Layers, Loader2, FolderOpen } from 'lucide-react';
import { fetchCategories } from '../services/apiService';
import { Category } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

interface CategoryBrowserProps {
  onSelectCategory: (id: number, name: string, slug: string) => void;
  onBack: () => void;
}

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({ onSelectCategory, onBack }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentParentId, setCurrentParentId] = useState<number>(0);
  const [history, setHistory] = useState<{ id: number, name: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter categories to show only children of current parent
  // We only show a category if it has products OR if it has subcategories
  const displayedCategories = categories.filter(cat => {
    if (cat.parent !== currentParentId) return false;

    const hasProducts = cat.count > 0;
    const hasChildren = categories.some(c => c.parent === cat.id);

    return hasProducts || hasChildren;
  });



  // Find current parent info for breadcrumb/title
  const currentParentCat = categories.find(c => c.id === currentParentId);

  const handleCategoryClick = (cat: Category) => {
    // Check if this category has children
    const hasChildren = categories.some(c => c.parent === cat.id);

    if (hasChildren) {
      // Drill down
      setHistory([...history, { id: currentParentId, name: currentParentCat?.name || 'Inicio' }]);
      setCurrentParentId(cat.id);
    } else {
      // It's a leaf node, select it
      onSelectCategory(cat.id, cat.name, cat.slug);
    }
  };

  const handleNavigateUp = () => {
    if (history.length === 0) {
      onBack(); // Exit component
    } else {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentParentId(prev.id);
    }
  };

  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="container mx-auto relative z-10">
          <button
            onClick={handleNavigateUp}
            className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors font-bold uppercase text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {history.length === 0 ? 'Volver al inicio' : 'Atrás'}
          </button>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white uppercase italic tracking-tight pr-4">
            {currentParentCat ? currentParentCat.name : 'Catálogo'} <span className="text-racing-orange">Completo</span>
          </h1>

          {/* Breadcrumbs */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm mt-4">
              <span className="opacity-50">Inicio</span>
              {history.slice(1).map((h, i) => (
                <React.Fragment key={i}>
                  <span>/</span>
                  <span className="opacity-70">{h.name}</span>
                </React.Fragment>
              ))}
              <span>/</span>
              <span className="text-racing-orange font-bold">{currentParentCat?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-racing-orange animate-spin" />
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800 border-dashed rounded-sm">
            <FolderOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No hay subcategorías aquí.</p>
            <button
              onClick={() => currentParentCat && onSelectCategory(currentParentCat.id, currentParentCat.name, currentParentCat.slug)}
              className="mt-4 text-racing-orange hover:text-white font-bold uppercase text-sm"
            >
              Ver productos de {currentParentCat?.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedCategories.map((cat) => {
              const hasChildren = categories.some(c => c.parent === cat.id);



              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-racing-orange rounded-sm transition-all duration-300 flex flex-col h-full cursor-pointer p-8 relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white uppercase italic mb-4 group-hover:translate-x-2 transition-transform duration-300">
                      {cat.name}
                    </h3>

                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold bg-racing-orange text-white px-3 py-1 rounded-sm">
                        {cat.count} Productos
                      </span>
                      {hasChildren && <Layers className="w-5 h-5 text-zinc-500 group-hover:text-racing-orange transition-colors" />}
                    </div>

                    <div
                      className="w-full py-3 border border-zinc-800 group-hover:bg-zinc-800 text-zinc-300 group-hover:text-racing-orange font-bold uppercase text-xs rounded-sm transition-all flex items-center justify-center gap-2"
                    >
                      {hasChildren ? 'Ver Subcategorías' : 'Ver Productos'} <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};