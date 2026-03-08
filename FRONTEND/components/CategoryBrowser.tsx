import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Layers, Loader2, FolderOpen } from 'lucide-react';
import { fetchCategories } from '../services/woocommerce';
import { Category } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

interface CategoryBrowserProps {
  onSelectCategory: (id: number, name: string) => void;
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
  const displayedCategories = categories.filter(c => c.parent === currentParentId);

  // Fallback images for key categories (Premium look)
  const CATEGORY_FALLBACKS: Record<string, string> = {
    'escapes': 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800',
    'frenos': 'https://images.unsplash.com/photo-1542046272-5c179477042c?auto=format&fit=crop&q=80&w=800',
    'neumaticos': 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=800',
    'mantenimiento': 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=800',
    'equipamiento': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    'electronica': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    'transmision': 'https://images.unsplash.com/photo-1592657434559-99469f3752e2?auto=format&fit=crop&q=80&w=800',
    'suspensiones': 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800'
  };

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
      onSelectCategory(cat.id, cat.name);
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
              onClick={() => currentParentCat && onSelectCategory(currentParentCat.id, currentParentCat.name)}
              className="mt-4 text-racing-orange hover:text-white font-bold uppercase text-sm"
            >
              Ver productos de {currentParentCat?.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedCategories.map((cat) => {
              const hasChildren = categories.some(c => c.parent === cat.id);

              // Use fallback if API image is missing or just a generic placeholder
              const rawImage = cat.image && !cat.image.includes('placeholder')
                ? cat.image
                : (CATEGORY_FALLBACKS[cat.slug] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800');

              // Optimize category background image
              const bgImage = optimizeImage(rawImage, { width: 600 });

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-racing-orange rounded-sm overflow-hidden transition-all duration-300 flex flex-col h-full cursor-pointer"
                >
                  {/* Image Area */}
                  <div
                    className="h-48 bg-cover bg-center relative overflow-hidden"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  >
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-300"></div>
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      <h3 className="text-2xl font-bold text-white uppercase italic mb-1 group-hover:translate-x-2 transition-transform duration-300">
                        {cat.name}
                      </h3>
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold bg-racing-orange text-white px-2 py-0.5 rounded-sm">
                          {cat.count} Productos
                        </span>
                        {hasChildren && <Layers className="w-4 h-4 text-zinc-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex-grow flex flex-col bg-zinc-950">
                    <p className="text-zinc-500 text-sm mb-4 flex-grow line-clamp-2">
                      {cat.description || `Explora nuestra selección de ${cat.name}.`}
                    </p>

                    <div
                      className="w-full mt-auto py-3 border border-zinc-800 group-hover:bg-zinc-900 text-zinc-300 group-hover:text-racing-orange font-bold uppercase text-sm rounded-sm transition-colors flex items-center justify-center gap-2"
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