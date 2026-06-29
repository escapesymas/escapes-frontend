'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Product } from '../types';
import { fetchCategories, fetchProducts, fetchProductsBySkus } from '../lib/api';
import ProductCard from './ProductCard';

interface CompatibleProductsProps {
  selectedBike?: string;
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
}

export default function CompatibleProducts({ selectedBike, onAddToCart, onNotifyMe }: CompatibleProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<Record<string, boolean>>({});
  const [categoriesById, setCategoriesById] = useState<Record<number, { id: number; parentId: number; name: string; slug: string }>>({});

  useEffect(() => {
    fetchCategories().then(cats => {
      const map: Record<number, { id: number; parentId: number; name: string; slug: string }> = {};
      cats.forEach((c: any) => { map[c.id] = c; });
      setCategoriesById(map);
    }).catch(() => {});
  }, []);

  function findL1(catId: number): string {
    if (!categoriesById[catId]) return 'Otros Recambios';
    let current = categoriesById[catId];
    let depth = 0;
    while (current.parentId !== 0 && current.parentId && depth < 10) {
      current = categoriesById[current.parentId];
      if (!current) return 'Otros Recambios';
      depth++;
    }
    return current.name || 'Otros Recambios';
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError('');
      setCollapsedCategories({});
      setCollapsedSubcategories({});
      try {
        if (selectedBike) {
          const parts = selectedBike.split(' ');
          const brand = parts[0];
          const bikeWithoutBrand = parts.slice(1).join(' ');
          const model = bikeWithoutBrand.replace(/\s*\([^)]*\)\s*$/, '').trim();
          const yearMatch = bikeWithoutBrand.match(/\(([^)]+)\)/);
          const year = yearMatch ? yearMatch[1] : '';

          const skusUrl = `/api/vehicles?action=compatible-skus&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`;
          const skusRes = await fetch(skusUrl);
          const compatibleSkus = await skusRes.json();

          if (!cancelled && compatibleSkus && compatibleSkus.length > 0) {
            const data = await fetchProductsBySkus(compatibleSkus.slice(0, 100));
            if (!cancelled) {
              setProducts((data.products || []).filter((p: Product) => p.price > 0).map((p: Product) => ({ ...p, isCompatible: true })));
            }
          } else if (!cancelled) {
            setProducts([]);
          }
        } else if (!cancelled) {
          const data = await fetchProducts({ per_page: 8 });
          if (!cancelled) {
            setProducts((data.products || []).filter((p: Product) => p.price > 0).map((p: Product) => ({ ...p, isCompatible: false })));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading compatible products:', err);
          setError('No pudimos cargar los productos. Intenta de nuevo.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedBike]);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const toggleSubcategory = (subKey: string) => {
    setCollapsedSubcategories((prev) => ({ ...prev, [subKey]: !prev[subKey] }));
  };

  const retry = () => {
    setError('');
    setIsLoading(true);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4 px-4 md:px-0">
          {selectedBike ? 'Recambios Compatibles' : 'Recambios Destacados'}
        </h3>
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4 px-4 md:px-0">
          {selectedBike ? 'Recambios Compatibles' : 'Recambios Destacados'}
        </h3>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-6 h-6 text-text-muted" />
          <p className="text-xs text-text-muted font-mono">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase font-bold border border-accent text-accent rounded hover:bg-accent/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const nestedGrouped: Record<string, Record<string, Product[]>> = {};
  if (selectedBike) {
    products.forEach((product) => {
      const parentName = findL1(product.categoryId);
      const subName = product.category || 'General';
      if (!nestedGrouped[parentName]) nestedGrouped[parentName] = {};
      if (!nestedGrouped[parentName][subName]) nestedGrouped[parentName][subName] = [];
      nestedGrouped[parentName][subName].push(product);
    });
  }
  const hasGroupedProducts = Object.keys(nestedGrouped).length > 0;

  return (
    <div className="w-full">
      <div className="mb-4 px-4 md:px-0 flex items-baseline justify-between">
        <div>
          <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
            {selectedBike ? 'Recambios Compatibles' : 'Recambios Destacados'}
          </h3>
          {selectedBike && (
            <p className="text-[9px] font-mono text-badge-text font-bold uppercase mt-0.5">
              Filtrado para {selectedBike}
            </p>
          )}
        </div>
        {selectedBike && hasGroupedProducts && (
          <Link
            href="/universales"
            className="text-[10px] font-mono uppercase tracking-wider text-accent hover:underline"
          >
            Ver catálogo completo →
          </Link>
        )}
      </div>

      {selectedBike ? (
        !hasGroupedProducts ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-card border border-dashed border-card-border rounded-md px-4 text-center">
            <Wrench className="w-10 h-10 text-text-muted" />
            <div>
              <p className="text-xs text-foreground font-mono uppercase font-bold">
                Aún no tenemos recambios compatibles
              </p>
              <p className="text-[10px] text-text-muted font-mono mt-2 max-w-[320px] mx-auto">
                Estamos ampliando el catálogo. Mientras tanto, explora todo nuestro catálogo o usa el buscador por referencia.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Link
                href="/universales"
                className="px-4 py-2 text-xs font-mono uppercase font-bold rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Ver catálogo
              </Link>
              <Link
                href="/"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="px-4 py-2 text-xs font-mono uppercase font-bold rounded border border-card-border text-foreground hover:bg-icon-box transition-colors"
              >
                Cambiar moto
              </Link>
            </div>
          </div>
        ) : (
          Object.entries(nestedGrouped).map(([categoryName, subgroups]) => {
            const isCollapsed = !!collapsedCategories[categoryName];
            const totalCount = Object.values(subgroups).reduce((sum, list) => sum + list.length, 0);
            return (
              <div key={categoryName} className="mb-4 border border-card-border rounded-md bg-card overflow-hidden">
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-icon-box/20 transition-all text-xs uppercase font-bold text-foreground border-b border-card-border/60 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true"></span>
                    <span>{categoryName}</span>
                    <span className="text-[10px] text-text-muted font-normal lowercase">
                      ({totalCount} productos)
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-text-muted" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-accent" aria-hidden="true" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="p-3 flex flex-col gap-4">
                    {Object.entries(subgroups).map(([subName, subProducts]) => {
                      const subKey = `${categoryName}-${subName}`;
                      const isSubCollapsed = !!collapsedSubcategories[subKey];
                      return (
                        <div key={subName} className="border-b border-card-border/30 pb-3 last:border-b-0 last:pb-0">
                          <button
                            onClick={() => toggleSubcategory(subKey)}
                            className="flex items-center gap-2 mb-2 text-[10px] font-mono font-bold text-text-muted hover:text-foreground transition-colors text-left w-full uppercase tracking-wider"
                            aria-expanded={!isSubCollapsed}
                          >
                            {isSubCollapsed ? (
                              <ChevronDown className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                            )}
                            <span>{subName}</span>
                            <span className="text-[9px] font-normal font-sans lowercase text-text-muted">
                              ({subProducts.length})
                            </span>
                          </button>

                          {!isSubCollapsed && (
                            <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible no-scrollbar">
                              {subProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )
      ) : (
        <div>
          <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-4 md:px-0 gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible no-scrollbar">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} />
            ))}
          </div>
          <div className="mt-3 px-4 md:px-0 text-center">
            <Link
              href="/universales"
              className="text-[10px] font-mono uppercase tracking-wider text-accent hover:underline"
            >
              Ver más recambios →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}