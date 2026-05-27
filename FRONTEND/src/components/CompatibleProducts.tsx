'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wrench, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import { fetchProducts, fetchProductsBySkus } from '../lib/api';
import ProductImage from './ProductImage';

const parentCategories: Record<number, string> = {
  1: "Escapes & Silenciadores",
  2: "Frenado & Discos",
  3: "Chasis, Horquillas & Suspensiones",
  4: "Electrónica, ECUs & Baterías",
  5: "Kits de Transmisión & Arrastre",
  6: "Filtros & Mantenimiento",
  7: "Neumáticos & Caballetes",
  8: "Cascos",
  9: "Equipación Piloto",
  10: "Accesorios & Equipaje"
};

interface CompatibleProductsProps {
  selectedBike?: string;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  return (
    <a
      href={`/producto/${product.id}`}
      className="flex-shrink-0 snap-start w-[280px] md:w-full bg-card border rounded-md overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer border-card-border hover:border-accent/40"
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

        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          wrapperClassName="w-full h-full absolute inset-0"
        />
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div className="mb-4">
          <h4 className="font-mono text-xs font-bold uppercase text-foreground line-clamp-1 mb-1">
            {product.name}
          </h4>
          <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        <div className="pt-3 border-t border-card-border/60 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-mono text-text-muted uppercase font-bold block">Precio</span>
            <span className="text-sm font-mono font-bold text-foreground">
              {product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </span>
          </div>

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
        </div>
      </div>
    </a>
  );
}

export default function CompatibleProducts({ selectedBike, onAddToCart }: CompatibleProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
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

          if (compatibleSkus && compatibleSkus.length > 0) {
            const data = await fetchProductsBySkus(compatibleSkus.slice(0, 100));
            setProducts((data.products || []).map((p: Product) => ({ ...p, isCompatible: true })));
            setFeaturedProducts([]);
          } else {
            setProducts([]);
            const data = await fetchProducts({ per_page: 8 });
            setFeaturedProducts((data.products || []).map((p: Product) => ({ ...p, isCompatible: false })));
          }
        } else {
          const data = await fetchProducts({ per_page: 8 });
          setProducts((data.products || []).map((p: Product) => ({ ...p, isCompatible: false })));
          setFeaturedProducts([]);
        }
      } catch (err) {
        console.error('Error loading compatible products:', err);
        setError('No pudimos cargar los productos. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedBike]);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const toggleSubcategory = (subKey: string) => {
    setCollapsedSubcategories((prev) => ({
      ...prev,
      [subKey]: !prev[subKey],
    }));
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
        </div>
      </div>
    );
  }

  // Nested grouping: Parent Category -> Subcategory -> Products
  const nestedGrouped: Record<string, Record<string, Product[]>> = {};
  if (selectedBike) {
    products.forEach((product) => {
      const catId = product.categoryId;
      const parentId = catId >= 100 ? Math.floor(catId / 100) : catId;
      const parentName = parentCategories[parentId] || "Otros Recambios";
      const subName = product.category || "General";

      if (!nestedGrouped[parentName]) {
        nestedGrouped[parentName] = {};
      }
      if (!nestedGrouped[parentName][subName]) {
        nestedGrouped[parentName][subName] = [];
      }
      nestedGrouped[parentName][subName].push(product);
    });
  }

  const hasGroupedProducts = Object.keys(nestedGrouped).length > 0;

  return (
    <div className="w-full">
      <div className="mb-6 px-4 md:px-0">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
          {selectedBike ? 'Recambios Compatibles' : 'Recambios Destacados'}
        </h3>
        {selectedBike && (
          <p className="text-[9px] font-mono text-badge-text font-bold uppercase mt-0.5">
            Filtrado para {selectedBike}
          </p>
        )}
      </div>

      {selectedBike ? (
        !hasGroupedProducts ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-card-border rounded-md px-4 text-center">
              <Wrench className="w-8 h-8 text-text-muted" />
              <p className="text-xs text-text-muted font-mono uppercase font-bold">
                No hay recambios compatibles
              </p>
              <p className="text-[10px] text-text-muted font-mono max-w-[280px]">
                No hemos encontrado recambios compatibles con tu moto en este momento.
              </p>
            </div>
            
            {featuredProducts.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4 px-4 md:px-0">
                  Otros productos destacados
                </h4>
                <div className="flex overflow-x-auto snap-x scroll-smooth pb-4 px-4 md:px-0 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible no-scrollbar">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          Object.entries(nestedGrouped).map(([categoryName, subgroups]) => {
            const isCollapsed = !!collapsedCategories[categoryName];
            const totalCount = Object.values(subgroups).reduce((sum, list) => sum + list.length, 0);

            return (
              <div key={categoryName} className="mb-6 border border-card-border rounded-md bg-card overflow-hidden">
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full flex items-center justify-between p-4 bg-card hover:bg-icon-box/20 transition-all font-mono text-xs uppercase font-bold text-foreground border-b border-card-border/60 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    <span>{categoryName}</span>
                    <span className="text-[10px] text-text-muted font-normal lowercase">
                      ({totalCount} productos)
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-accent" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="p-4 flex flex-col gap-6">
                    {Object.entries(subgroups).map(([subName, subProducts]) => {
                      const subKey = `${categoryName}-${subName}`;
                      const isSubCollapsed = !!collapsedSubcategories[subKey];
                      return (
                        <div key={subName} className="border-b border-card-border/30 pb-4 last:border-b-0 last:pb-0">
                          <button
                            onClick={() => toggleSubcategory(subKey)}
                            className="flex items-center gap-2 mb-3 text-[10px] font-mono font-bold text-text-muted hover:text-foreground transition-colors cursor-pointer text-left w-full uppercase tracking-wider"
                          >
                            {isSubCollapsed ? (
                              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5 text-accent" />
                            )}
                            <span>{subName}</span>
                            <span className="text-[9px] font-normal font-sans lowercase text-text-muted">
                              ({subProducts.length})
                            </span>
                          </button>
                          
                          {!isSubCollapsed && (
                            <div className="flex overflow-x-auto snap-x scroll-smooth pb-2 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible no-scrollbar">
                              {subProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
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
        <div className="flex overflow-x-auto snap-x scroll-smooth pb-4 px-4 md:px-0 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible no-scrollbar">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
