'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface EmptyCartViewProps {
  onContinueShopping?: () => void;
  recommended: Product[];
  loadingRecs: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  formatPrice: (amount: number) => string;
}

export default function EmptyCartView({ onContinueShopping, recommended, loadingRecs, addToCart, formatPrice }: EmptyCartViewProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in font-sans">
      <div className="bg-card border border-card-border p-6 rounded-full mb-6">
        <ShoppingBag className="w-12 h-12 text-text-muted" />
      </div>
      <h2 className="text-2xl font-mono font-bold text-foreground mb-2 uppercase italic">Tu carrito está vacío</h2>
      <p className="text-text-muted mb-8 max-w-md text-xs">
        Parece que aún no has añadido ninguna pieza para tu moto. Revisa nuestro catálogo para encontrar lo que necesitas.
      </p>

      <button
        onClick={() => onContinueShopping?.()}
        className="bg-accent text-slate-950 font-mono font-bold uppercase tracking-wide py-3 px-8 rounded-sm hover:bg-accent-hover transition-colors flex items-center gap-2 cursor-pointer mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la tienda
      </button>

      {recommended.length > 0 && (
        <div className="w-full max-w-4xl border-t border-card-border pt-12 text-left">
          <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-8 text-center italic">
            Productos Recomendados de Mantenimiento y Limpieza
          </h3>
          {loadingRecs ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-card-border p-4 rounded-sm animate-pulse">
                  <div className="aspect-square bg-slate-900 rounded-sm mb-3" />
                  <div className="h-3 bg-slate-800 rounded-sm w-3/4 mb-2" />
                  <div className="h-3 bg-slate-800 rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((product) => (
                <div
                  key={product.id}
                  className="bg-card border border-card-border p-3 rounded-sm flex flex-col justify-between hover:border-accent transition-all duration-300 shadow-sm group"
                >
                  <Link href={`/producto/${product.slug}`} className="space-y-2 cursor-pointer block">
                    <div className="aspect-square bg-slate-950 rounded-sm overflow-hidden flex items-center justify-center p-2 relative">
                      <Image
                        src={product.image || (product.images && product.images[0]?.src) || ''}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-foreground text-xs font-mono font-bold leading-tight line-clamp-2 h-8 group-hover:text-accent-text transition-colors">
                      {product.name}
                    </h4>
                  </Link>
                  <div className="mt-3 pt-2 border-t border-card-border flex items-center justify-between gap-1">
                    <span className="text-sm font-mono font-bold text-accent-text">
                      {formatPrice(product.price)}
                    </span>
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="bg-accent text-slate-950 text-[10px] font-mono font-bold uppercase py-1.5 px-2.5 rounded-sm hover:bg-accent-hover transition-all duration-200 cursor-pointer"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
