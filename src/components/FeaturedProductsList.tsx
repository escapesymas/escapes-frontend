'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, ArrowRight, PlusCircle } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface FeaturedProductsListProps {
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
  ScrollReveal: React.ComponentType<{
    children: React.ReactNode;
    className?: string;
    delay?: number;
    animation?: 'fade-up' | 'zoom';
  }>;
}

export default function FeaturedProductsList({
  onAddToCart,
  onNotifyMe,
  ScrollReveal,
}: FeaturedProductsListProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(16);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch up to 48 products from top helmets & apparel brands (SHARK, ARAI, RST, LS2, HELD, ALPINESTARS, SCORPION)
        const params = new URLSearchParams({
          brand: 'SHARK,ARAI,RST,LS2,HELD,ALPINESTARS,SCORPION',
          per_page: '48',
          in_stock: 'true',
          has_image: 'true',
          sort: 'random',
        });
        const res = await fetch(`/api/catalog/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.products || [];
          if (!cancelled) {
            // Filter strictly for helmets & apparel (excluding hardware/brackets)
            const cleanList = list.filter((p: Product) => {
              if (!p.price || p.price <= 0) return false;
              const nameLower = (p.name || '').toLowerCase();
              const categoryLower = (p.category || '').toLowerCase();

              // Exclude technical hardware/brackets
              if (
                nameLower.includes('fijaciones') ||
                nameLower.includes('soporte') ||
                nameLower.includes('kit fijacion') ||
                nameLower.includes('tornillo')
              ) {
                return false;
              }
              return (
                categoryLower.includes('casco') ||
                categoryLower.includes('equipamiento') ||
                categoryLower.includes('ropa') ||
                nameLower.includes('casco') ||
                nameLower.includes('chaqueta') ||
                nameLower.includes('guantes') ||
                nameLower.includes('mono') ||
                nameLower.includes('pantalon') ||
                nameLower.includes('cazadora') ||
                nameLower.includes('bota')
              );
            });
            setAllProducts(cleanList);
          }
        }
      } catch (err) {
        console.error('Error fetching featured gear products:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = allProducts.slice(0, visibleCount);
  const hasMore = visibleCount < allProducts.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 w-full text-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
          Cargando equipamiento destacado...
        </span>
      </div>
    );
  }

  if (allProducts.length === 0) return null;

  return (
    <section className="flex flex-col items-center justify-center gap-8 pt-4 w-full mx-auto text-center">
      <ScrollReveal animation="fade-up">
        <div className="flex flex-col items-center justify-center text-center gap-2 mb-2 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-accent-text bg-accent/10 border border-accent/20 px-3.5 py-1 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Protección & Estilo Motero
          </span>
          <h2 className="font-mono font-black uppercase text-2xl sm:text-3xl text-foreground tracking-tight">
            EQUIPAMIENTO DESTACADO — CASCOS Y ROPA
          </h2>
          <p className="text-text-muted text-xs sm:text-sm max-w-md font-sans leading-relaxed mx-auto">
            Cascos homologados ECE 22.06, chaquetas con protecciones, guantes y equipamiento de primeras marcas.
          </p>
        </div>
      </ScrollReveal>

      {/* Lista de tarjetas centradas horizontalmente que emergen con ScrollReveal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full justify-items-center items-stretch mx-auto">
        {visibleProducts.map((product, index) => (
          <ScrollReveal key={product.id} animation="fade-up" delay={(index % 4) * 100} className="w-full flex justify-center">
            <div className="h-full flex flex-col w-full max-w-[280px] sm:max-w-none mx-auto">
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onNotifyMe={onNotifyMe}
                priority={index < 4}
              />
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Botón centrado para cargar más productos o explorar catálogo */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full mx-auto text-center">
        {hasMore && (
          <ScrollReveal animation="fade-up">
            <button
              onClick={handleShowMore}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card/60 hover:bg-card border border-card-border hover:border-accent/60 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:text-accent transition-all duration-300 shadow-sm cursor-pointer mx-auto"
            >
              <PlusCircle className="w-4 h-4 text-accent" />
              <span>Mostrar más productos ({allProducts.length - visibleCount} restantes)</span>
            </button>
          </ScrollReveal>
        )}

        <ScrollReveal animation="fade-up">
          <a
            href="/universales/cascos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-slate-950 hover:bg-accent-hover rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl no-underline cursor-pointer mx-auto"
          >
            <span>Ver todo el catálogo de Equipamiento</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
