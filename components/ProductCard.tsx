
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
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart, priority = false }) => {
  const [imgSrc, setImgSrc] = React.useState<string>("");
  const [imageError, setImageError] = React.useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const hasDiscount = product.regularPrice > product.price;
  const isDefaultImage = product.image === STORE_CONFIG.defaultProductImage;

  // Use optimized image initially, but allow fallback
  // SKIP optimization for default placeholder to avoid CORS/404 issues on external services
  const displayImage = isDefaultImage ? product.image : optimizeImage(product.image, { width: 250, height: 250, fit: 'cover' });
  const avifImage = isDefaultImage ? '' : optimizeImage(product.image, { width: 250, height: 250, format: 'avif', fit: 'cover' });
  const webpImage = isDefaultImage ? '' : optimizeImage(product.image, { width: 250, height: 250, format: 'webp', fit: 'cover' });

  // Reset state when product changes
  React.useEffect(() => {
    setImgSrc(displayImage);
    setImageError(false);
  }, [product.image]);

  return (
    <div className="group bg-white dark:bg-racing-carbon border border-zinc-200 dark:border-zinc-800 hover:border-racing-orange/50 transition-all duration-300 rounded-sm overflow-hidden flex flex-col h-full shadow-sm dark:shadow-none">
      <Link
        to={`/${product.categorySlug ? product.categorySlug : 'recambios'}/${product.id}`}
        className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-white"
        onClick={() => onClick?.(product)}
      >
        {!isDefaultImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        )}

        <picture>
          {!imageError && (
            <>
              <source srcSet={avifImage} type="image/avif" />
              <source srcSet={webpImage} type="image/webp" />
            </>
          )}
          <img
            src={imageError ? product.image : imgSrc}
            onError={() => {
              if (!imageError) {
                setImgSrc(product.image); // Fallback to original
                setImageError(true); // Stop using picture sources
              }
            }}
            alt={product.title}
            loading={priority ? "eager" : "lazy"}
            // @ts-ignore
            fetchPriority={priority ? "high" : "auto"}
            width="250"
            height="250"
            className={`w-full h-full transition-transform duration-500 ${isDefaultImage
              ? 'object-contain p-4 md:p-8 group-hover:scale-110 opacity-100'
              : 'object-cover group-hover:scale-105'
              }`}
          />
        </picture>

        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2">
          {product.inStock && (
            <span className="bg-green-500/90 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 uppercase rounded-sm flex items-center gap-1 backdrop-blur-sm w-fit shadow-md">
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
        <Link
          to={`/${product.categorySlug ? product.categorySlug : 'recambios'}/${product.id}`}
          onClick={() => onClick?.(product)}
        >
          <h3 className="text-zinc-900 dark:text-white font-bold text-sm md:text-lg leading-tight mb-2 group-hover:text-racing-orange transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto pt-3 md:pt-4 flex items-end justify-between border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <p className="text-racing-red text-[10px] md:text-xs font-bold line-through mb-0.5">
                  {formatPrice(product.regularPrice)}
                </p>
                <p className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                  {formatPrice(product.price)}
                </p>
              </>
            ) : (
              <>
                <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Precio unitario</p>
                <p className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-white leading-none">
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
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-racing-orange dark:hover:bg-racing-orange text-zinc-900 dark:text-white hover:text-white p-2 md:p-3 rounded-sm transition-colors duration-200 shadow-sm"
            title="Añadir al carrito"
            aria-label={`Añadir ${product.title} al carrito`}
          >
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
