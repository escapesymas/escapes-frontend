import React from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart }) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const hasDiscount = product.regularPrice > product.price;

  return (
    <div 
      onClick={() => onClick?.(product)}
      className="group bg-racing-carbon border border-zinc-800 hover:border-racing-orange/50 transition-all duration-300 rounded-sm overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-white">
        {/* Placeholder overlay for stock effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 z-10" />
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {product.inStock && (
            <span className="bg-green-500/90 text-black text-xs font-bold px-2 py-1 uppercase rounded-sm flex items-center gap-1 backdrop-blur-sm w-fit">
              <CheckCircle className="w-3 h-3" /> En Stock
            </span>
          )}
        </div>
        
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 z-20 bg-racing-red text-white text-xs font-bold px-2 py-1 uppercase rounded-sm shadow-lg">
            Oferta
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
          {product.category}
        </span>
        <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-racing-orange transition-colors line-clamp-2">
          {product.title}
        </h3>
        
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-800">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                 <p className="text-racing-red text-xs font-bold line-through mb-0.5">
                   {formatPrice(product.regularPrice)}
                 </p>
                 <p className="text-2xl font-bold text-white leading-none">
                   {formatPrice(product.price)}
                 </p>
              </>
            ) : (
              <>
                <p className="text-zinc-400 text-xs mb-1">Precio unitario</p>
                <p className="text-2xl font-bold text-white leading-none">
                  {formatPrice(product.price)}
                </p>
              </>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening detail
              onAddToCart?.();
            }}
            className="bg-zinc-800 hover:bg-racing-orange text-white p-3 rounded-sm transition-colors duration-200"
            title="Añadir al carrito"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};