import React from 'react';
import { Loader2, WifiOff, Package } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';
import { CATEGORIES } from '../storeData';
import { Pagination } from './Pagination';

interface ProductGridProps {
  loading: boolean;
  error: string | null;
  errorDetail: string | null;
  products: Product[];
  currentView: string;
  urlCategory?: string;
  query?: string;
  onClearFilters: () => void;
  onContactClick: () => void;
  onViewAllClick: () => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  loading, error, errorDetail, products, currentView, urlCategory, query,
  onClearFilters, onContactClick, onViewAllClick, onProductClick, onAddToCart,
  currentPage, totalPages, onPageChange
}) => {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-racing-orange animate-spin mb-4" />
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sincronizando garaje...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-20 bg-zinc-900/30 rounded-sm border border-zinc-800 p-8">
      <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-white font-bold mb-2">{error}</h3>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">{errorDetail}</p>
      <button onClick={onClearFilters} className="bg-racing-orange text-white px-6 py-2 rounded-sm font-bold uppercase text-xs">Reintentar</button>
    </div>
  );

  if (products.length === 0) return (
    <div className="text-center py-24 bg-white dark:bg-zinc-900/10 rounded-sm border border-zinc-200 dark:border-zinc-800 p-12 max-w-2xl mx-auto shadow-sm">
      <div className="bg-zinc-100 dark:bg-zinc-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
      </div>
      <h3 className="text-2xl font-black uppercase italic text-zinc-900 dark:text-white mb-4">No hemos encontrado piezas exactas</h3>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
        Nuestra base de datos es enorme, pero a veces el motor de búsqueda necesita un poco de ayuda. Prueba a buscar por marca o modelo general, o contacta con nuestros expertos.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onViewAllClick} className="bg-zinc-900 dark:bg-zinc-800 text-white px-8 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-black transition-colors">
          Ver todo el catálogo
        </button>
        <button onClick={onContactClick} className="border border-racing-orange text-racing-orange px-8 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-racing-orange hover:text-white transition-all">
          Contactar Experto
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={product?.id || `p-${index}`}
            priority={index < 4}
            product={product}
            onClick={() => product && onProductClick(product)}
            onAddToCart={() => product && onAddToCart(product)}
          />
        ))}
      </div>
      
      {currentView === 'catalog' && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          loading={loading} 
          onPageChange={onPageChange} 
        />
      )}

      {currentView === 'catalog' && urlCategory && !query && (
        <section className="mt-16 pt-16 border-t border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 uppercase italic">
              {CATEGORIES.find(c => c.id === urlCategory)?.name || urlCategory}
            </h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
              <p>
                {CATEGORIES.find(c => c.id === urlCategory)?.description}
              </p>
              <p className="mt-4">
                En <strong>Escapes y Más</strong> seleccionamos cuidadosamente cada componente para asegurar el máximo rendimiento de tu motocicleta.
                Trabajamos con las mejores marcas del mercado como Akrapovič, Mivv, Brembo y Öhlins para ofrecerte piezas originales con garantía oficial.
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
