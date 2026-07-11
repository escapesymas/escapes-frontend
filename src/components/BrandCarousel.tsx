'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface BrandCarouselProps {
  brand: string;
  title?: string;
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
}

export default function BrandCarousel({ brand, title, onAddToCart, onNotifyMe }: BrandCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const url = `/api/catalog/products?brand=${encodeURIComponent(brand)}&per_page=12`;
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
  }, [brand]);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${brand.replace(/\s+/g, '-')}`);
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
        id={`carousel-${brand.replace(/\s+/g, '-')}`}
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