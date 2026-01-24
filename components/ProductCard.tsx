
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { STORE_CONFIG } from '../storeData';
import { optimizeImage } from '../utils/imageOptimizer';

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
  const isDefaultImage = product.image === STORE_CONFIG.defaultProductImage;

  const displayImage = optimizeImage(product.image, { width: 400, height: 400, fit: 'cover' });
  const avifImage = optimizeImage(product.image, { width: 400, height: 400, format: 'avif', fit: 'cover' });
  const webpImage = optimizeImage(product.image, { width: 400, height: 400, format: 'webp', fit: 'cover' });

  return (
    <div className="group bg-racing-carbon border border-zinc-800 hover:border-racing-orange/50 transition-all duration-300 rounded-sm overflow-hidden flex flex-col h-full">
      <Link to={`/${product.categorySlug ? product.categorySlug : 'recambios'}/${product.id}`} className="block relative aspect-square overflow-hidden bg-white">
        {!isDefaultImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        )}

        <picture>
          <source srcSet={avifImage} type="image/avif" />
          <source srcSet={webpImage} type="image/webp" />
          <img
            src={displayImage}
            alt={product.title}
            loading="lazy"
            width="400"
            height="400"
            className={`w-full h-full transition-transform duration-500 ${isDefaultImage
              ? 'object-contain p-4 md:p-8 group-hover:scale-110 opacity-100'
              : 'object-cover group-hover:scale-105'
              }`}
          />
        </picture>

        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
          {product.inStock && (
            <span className="bg-green-500/90 text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 uppercase rounded-sm flex items-center gap-1 backdrop-blur-sm w-fit shadow-md">
              <CheckCircle className="w-3 h-3" /> Stock
            </span>
          )}
        </div>

        {hasDiscount && (
          <span className="absolute top-2 right-2 z-20 bg-racing-red text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 uppercase rounded-sm shadow-lg">
            Oferta
          </span>
        )}
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <span className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 truncate">
          {product.category}
        </span>
        <Link to={`/${product.categorySlug ? product.categorySlug : 'recambios'}/${product.id}`}>
          <h3 className="text-white font-bold text-sm md:text-lg leading-tight mb-2 group-hover:text-racing-orange transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto pt-3 md:pt-4 flex items-end justify-between border-t border-zinc-800">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <p className="text-racing-red text-[10px] md:text-xs font-bold line-through mb-0.5">
                  {formatPrice(product.regularPrice)}
                </p>
                <p className="text-lg md:text-2xl font-bold text-white leading-none">
                  {formatPrice(product.price)}
                </p>
              </>
            ) : (
              <>
                <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Precio unitario</p>
                <p className="text-lg md:text-2xl font-bold text-white leading-none">
                  {formatPrice(product.price)}
                </p>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="bg-zinc-800 hover:bg-racing-orange text-white p-2 md:p-3 rounded-sm transition-colors duration-200 shadow-lg"
            title="Añadir al carrito"
            aria-label="Añadir al carrito"
          >
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
