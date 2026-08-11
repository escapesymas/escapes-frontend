'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface BrandCarouselProps {
  /** Single brand ("RST") or list of brands (["RST", "SHARK", "Held"]).
   *  Multiple brands are joined with a comma and routed through the catalog
   *  endpoint's `brand=` param, which produces an IN/OR chain server-side. */
  brand: string | string[];
  title?: string;
  /** "random" picks from the matching pool with ORDER BY RANDOM() so the
   *  carousel shows category variety instead of the brand's dominant type. */
  sort?: 'random';
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
}

export default function BrandCarousel({ brand, title, sort, onAddToCart, onNotifyMe }: BrandCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const brandParam = Array.isArray(brand) ? brand.join(',') : brand;
  const carouselId = `carousel-${brandParam.replace(/[\s,]+/g, '-')}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        // Only products with a real image AND stock. The backend exposes
        // `in_stock=true` and `has_image=true` query params; passing them
        // keeps the carousel tidy (no "Imagen no disponible" placeholders).
        const params = new URLSearchParams({
          brand: brandParam,
          per_page: '12',
          in_stock: 'true',
          has_image: 'true',
        });
        if (sort === 'random') params.set('sort', 'random');
        const url = `/api/catalog/products?${params.toString()}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.products || []);
          if (!cancelled) {
            setProducts(list.filter((p: Product) => p.price > 0));
          }
        }
      } catch (err) {
        console.error('Error loading brand products:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [brandParam, sort]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(carouselId);
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4">
          {title || brand}
        </h3>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
          {title || brand}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        id={carouselId}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 gap-4 no-scrollbar"
      >
        {products.slice(0, 12).map((product) => (
          <div
            key={product.id}
            className="shrink-0 w-[78vw] sm:w-[42vw] md:w-[31vw] lg:w-[22vw] xl:w-[18vw] snap-start"
          >
            <ProductCard product={product} onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} />
          </div>
        ))}
      </div>
    </div>
  );
}