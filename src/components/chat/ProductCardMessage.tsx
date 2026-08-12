'use client';

import { useState } from 'react';
import type { ChatProduct } from '../../lib/chatApi';

interface ProductCardMessageProps {
  product: ChatProduct;
  onAddToCart: (product: ChatProduct) => void;
  onView: (product: ChatProduct) => void;
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProductCardMessage({ product, onAddToCart, onView }: ProductCardMessageProps) {
  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  const price = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const isInStock = product.in_stock;

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm max-w-full">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 flex-shrink-0 bg-background rounded-lg overflow-hidden flex items-center justify-center">
          {product.image && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <svg
              className="w-8 h-8 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-accent">
              {product.brand || 'Genérico'}
            </span>
            {!isInStock && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-red-400">
                · Sin stock
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
            {product.name}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-foreground">
              {formatPrice(price)}€
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.price)}€
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-t border-card-border divide-x divide-card-border">
        <button
          onClick={handleAdd}
          disabled={!isInStock || added}
          className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          aria-label={`Añadir ${product.name} al carrito`}
        >
          {added ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Añadido
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {isInStock ? 'Añadir' : 'Sin stock'}
            </>
          )}
        </button>
        <button
          onClick={() => onView(product)}
          className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold text-muted-foreground hover:text-foreground hover:bg-background transition-colors flex items-center justify-center gap-1.5"
          aria-label={`Ver detalles de ${product.name}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Ver producto
        </button>
      </div>
    </div>
  );
}
