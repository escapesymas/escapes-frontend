'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Bell } from 'lucide-react';
import { Product, ProductImage as ProductImageType } from '../types';
import ProductImage from './ProductImage';
import RatingStars from './RatingStars';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
  priority?: boolean;
}

function pickImage(img: ProductImageType) {
  const src = img.srcCardDesktop || img.srcMobile || img.src || '';
  const mobileSrc = img.srcCardMobile || img.srcMobile || '';
  return { src, mobileSrc };
}

export default function ProductCard({ product, onAddToCart, onNotifyMe, priority = false }: ProductCardProps) {
  const isOutOfStock = product.inStock === false || product.stock === 0;
  const images = product.images?.length ? product.images : [{ src: product.image, alt: product.name } as ProductImageType];
  const [imgIdx, setImgIdx] = useState(0);
  const current = pickImage(images[imgIdx]);

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx(idx);
  };

  return (
    <a
      key={product.id}
      href={`/producto/${product.slug}`}
      className="bg-card border rounded-md overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer snap-start shrink-0 w-[75vw] md:w-auto"
      style={{ borderColor: product.isCompatible ? 'var(--badge-border)' : 'var(--card-border)' }}
    >
      <div className="p-4 bg-image-wrapper flex items-center justify-center relative min-h-[160px] overflow-hidden">
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-card border border-card-border text-foreground shadow-sm">
            {product.brand}
          </span>
          {product.isCompatible && (
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-badge text-badge-text border border-badge-border flex items-center gap-0.5 shadow-sm">
              <Check className="w-3 h-3 stroke-[3]" /> Compatible
            </span>
          )}
        </div>

        {product.ratingCount > 0 && (
          <div className="absolute bottom-2 left-2 z-10 bg-card/90 backdrop-blur-sm border border-card-border rounded px-1.5 py-0.5 shadow-sm">
            <RatingStars rating={product.averageRating || 0} count={product.ratingCount} size="xs" showCount={true} />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-600/90 text-white border border-red-400/50 shadow-sm">
              Agotado
            </span>
          </div>
        )}

        {!isOutOfStock && product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white border border-red-300 shadow-sm animate-pulse">
              {product.stock <= 2 ? '¡Último!' : `¡Quedan ${product.stock}!`}
            </span>
          </div>
        )}

        {!isOutOfStock && product.stock > 5 && product.stock <= 20 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-white border border-amber-300 shadow-sm">
              Pocas unidades
            </span>
          </div>
        )}

        {product.dropshipping && !isOutOfStock && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-300/50 shadow-sm">
              Envío 3-5 días
            </span>
          </div>
        )}
        {!product.dropshipping && !isOutOfStock && product.stock > 0 && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-900 border border-emerald-300/50 shadow-sm">
              Envío 24h
            </span>
          </div>
        )}

        <ProductImage
          src={current.src}
          srcMobile={current.mobileSrc || undefined}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          wrapperClassName="w-full h-full absolute inset-0"
          priority={priority}
        />

        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-20" role="tablist" aria-label="Selector de imagen">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => handleDotClick(e, i)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer shadow-sm ${
                  i === imgIdx ? 'bg-accent scale-110 ring-1 ring-white' : 'bg-white/80 hover:bg-white/95'
                }`}
                role="tab"
                aria-label={`Imagen ${i + 1} de ${images.length}`}
                aria-selected={i === imgIdx}
                aria-current={i === imgIdx ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div className="mb-4">
          <h4 className="font-mono text-xs font-bold uppercase text-foreground line-clamp-1 mb-1">
            {product.name}
          </h4>
          <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
          {product.supplier_code && (
            <p className="text-[9px] font-mono text-text-muted mt-2">
              Ref: <span className="text-foreground/80">{product.supplier_code}</span>
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-card-border/60 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-mono text-text-muted uppercase font-bold block">Precio</span>
            <span className="text-sm font-mono font-bold text-foreground">
              {product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </span>
          </div>

          {isOutOfStock ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onNotifyMe(product);
              }}
              className="p-2 rounded bg-card border border-card-border text-foreground hover:bg-icon-box/40 active:scale-95 transition-all shadow-sm cursor-pointer"
              aria-label="Avísame cuando vuelva a estar disponible"
            >
              <Bell className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="p-2 rounded bg-accent text-slate-950 hover:bg-accent-hover active:scale-95 transition-all shadow-sm cursor-pointer"
              aria-label="Añadir al carrito"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </a>
  );
}
