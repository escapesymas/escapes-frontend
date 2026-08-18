'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Product } from '../types';
import { fetchCategories, fetchProducts, fetchProductsBySkus } from '../lib/api';
import { parseBike } from '../lib/constants';
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

  function getCategoryNames(product: Product): { parentName: string; subName: string } {
    const cat = categoriesById[product.categoryId];
    if (cat && cat.id !== 1 && cat.id !== 2) {
      if (cat.parentId === 1 || cat.parentId === 2) {
        return { parentName: cat.name, subName: getSubNameFromProduct(product, cat.name) };
      } else if (cat.parentId && categoriesById[cat.parentId]) {
        const parent = categoriesById[cat.parentId];
        return { parentName: parent.name, subName: cat.name };
      }
      return { parentName: cat.name, subName: 'General' };
    }

    const n = (product.name || '').toLowerCase();

    if (n.includes('escape') || n.includes('silenciador') || n.includes('colector') || n.includes('db-killer') || n.includes('db killer') || n.includes('catalizador')) {
      let sub = 'Escapes Completos';
      if (n.includes('silenciador')) sub = 'Silenciadores';
      else if (n.includes('colector')) sub = 'Colectores';
      else if (n.includes('db-killer') || n.includes('db killer')) sub = 'Accesorios de Escape';
      return { parentName: 'Escapes', subName: sub };
    }

    if (n.includes('retrovisor') || n.includes('espejo')) {
      let sub = 'Retrovisores';
      if (n.includes('contrapeso') || n.includes('manillar')) sub = 'Retrovisores de Manillar';
      else if (n.includes('oem') || n.includes('vicma')) sub = 'Retrovisores tipo OEM';
      return { parentName: 'Espejos Retrovisores', subName: sub };
    }

    if (n.includes('contrapeso') || n.includes('puño') || n.includes('puno') || n.includes('maneta') || n.includes('manillar') || n.includes('palanca') || n.includes('mando') || n.includes('lever')) {
      let sub = 'Manillares y Mandos';
      if (n.includes('contrapeso')) sub = 'Contrapesos de Manillar';
      else if (n.includes('puño') || n.includes('puno')) sub = 'Puños';
      else if (n.includes('maneta') || n.includes('lever') || n.includes('palanca')) sub = 'Manetas y Levas';
      return { parentName: 'Manillares y Mandos', subName: sub };
    }

    if (n.includes('freno') || n.includes('pastilla') || n.includes('zapata') || n.includes('disco') || n.includes('pinza') || n.includes('brake')) {
      let sub = 'Frenos';
      if (n.includes('pastilla') || n.includes('pad')) sub = 'Pastillas de Freno';
      else if (n.includes('zapata') || n.includes('shoe')) sub = 'Zapatas de Freno';
      else if (n.includes('disco') || n.includes('disc')) sub = 'Discos de Freno';
      return { parentName: 'Frenos', subName: sub };
    }

    if (n.includes('batería') || n.includes('bateria') || n.includes('claxon') || n.includes('intermitente') || n.includes('estator') || n.includes('regulador') || n.includes('faro') || n.includes('luz') || n.includes('stator')) {
      let sub = 'Baterías y Electricidad';
      if (n.includes('batería') || n.includes('bateria')) sub = 'Baterías';
      else if (n.includes('claxon')) sub = 'Claxons y Avisadores';
      else if (n.includes('estator') || n.includes('stator')) sub = 'Estatores y Encendido';
      else if (n.includes('luz') || n.includes('faro') || n.includes('intermitente')) sub = 'Iluminación e Intermitentes';
      return { parentName: 'Baterías y Electricidad', subName: sub };
    }

    if (n.includes('correa') || n.includes('cadena') || n.includes('piñón') || n.includes('pinon') || n.includes('corona') || n.includes('variador') || n.includes('embrague') || n.includes('transmision') || n.includes('transmisión')) {
      let sub = 'Transmisión';
      if (n.includes('correa')) sub = 'Correas de Transmisión';
      else if (n.includes('cadena')) sub = 'Cadenas de Transmisión';
      else if (n.includes('variador')) sub = 'Variadores';
      return { parentName: 'Transmisión', subName: sub };
    }

    if (n.includes('aceite') || n.includes('filtro') || n.includes('bujía') || n.includes('bujia') || n.includes('junta') || n.includes('pistón') || n.includes('piston') || n.includes('cilindro')) {
      let sub = 'Motor y Filtración';
      if (n.includes('aceite')) sub = 'Aceites y Químicos';
      else if (n.includes('filtro')) sub = 'Filtros';
      else if (n.includes('bujía') || n.includes('bujia')) sub = 'Bujías';
      return { parentName: 'Motor y Filtración', subName: sub };
    }

    if (n.includes('cúpula') || n.includes('cupula') || n.includes('parabrisas') || n.includes('carenado') || n.includes('quilla') || n.includes('guardabarros') || n.includes('plástica') || n.includes('plastica')) {
      return { parentName: 'Cúpulas y Carenados', subName: 'Carenados y Carrocería' };
    }

    if (n.includes('maleta') || n.includes('baúl') || n.includes('baul') || n.includes('alforja') || n.includes('mochila') || n.includes('soporte')) {
      return { parentName: 'Maletas y Alforjas', subName: 'Equipaje y Soportes' };
    }

    return { parentName: 'Otros Recambios', subName: 'General' };
  }

  function getSubNameFromProduct(product: Product, parentCategoryName: string): string {
    const n = (product.name || '').toLowerCase();
    if (parentCategoryName === 'Escapes') {
      if (n.includes('silenciador')) return 'Silenciadores';
      if (n.includes('colector')) return 'Colectores';
      if (n.includes('db-killer') || n.includes('db killer')) return 'Accesorios de Escape';
      return 'Escapes Completos';
    }
    if (parentCategoryName === 'Espejos Retrovisores') {
      if (n.includes('contrapeso') || n.includes('manillar')) return 'Retrovisores de Manillar';
      return 'Retrovisores tipo OEM';
    }
    if (parentCategoryName === 'Manillares y Mandos') {
      if (n.includes('contrapeso')) return 'Contrapesos de Manillar';
      if (n.includes('puño') || n.includes('puno')) return 'Puños';
      if (n.includes('maneta') || n.includes('lever')) return 'Manetas y Levas';
      return 'Mandos y Manillares';
    }
    if (parentCategoryName === 'Frenos') {
      if (n.includes('pastilla') || n.includes('pad')) return 'Pastillas de Freno';
      if (n.includes('zapata') || n.includes('shoe')) return 'Zapatas de Freno';
      if (n.includes('disco') || n.includes('disc')) return 'Discos de Freno';
      return 'Recambios de Freno';
    }
    if (parentCategoryName === 'Baterías y Electricidad') {
      if (n.includes('batería') || n.includes('bateria')) return 'Baterías';
      if (n.includes('claxon')) return 'Claxons y Avisadores';
      if (n.includes('estator') || n.includes('stator')) return 'Estatores y Encendido';
      return 'Electricidad General';
    }
    return product.category || 'General';
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
          const { brand, model, year } = parseBike(selectedBike);

          const prodUrl = `/api/vehicles?action=compatible-products&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`;
          const prodRes = await fetch(prodUrl);
          const data = await prodRes.json();

          if (!cancelled && Array.isArray(data)) {
            setProducts(data.filter((p: Product) => p.price > 0).map((p: Product) => ({ ...p, isCompatible: true })));
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

  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoading, selectedBike]);

  if (isLoading) {
    return (
      <div className="w-full">
        <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4 px-4 md:px-0">
          {selectedBike ? 'Recambios Compatibles' : 'Recambios Destacados'}
        </h3>
        <div className="flex flex-col justify-center items-center py-16 gap-3.5 min-h-[160px] bg-card/40 border border-card-border/40 rounded-lg my-2">
          <Loader2 className="w-7 h-7 text-accent animate-spin" />
          <div className="text-center px-4 transition-all duration-300">
            {loadingStep === 0 ? (
              <p className="text-xs font-mono font-semibold text-foreground tracking-wide animate-fade-in flex items-center justify-center gap-1.5">
                <span>Estamos asegurando la compatibilidad</span>
                <span className="inline-flex">...</span>
              </p>
            ) : (
              <p className="text-xs font-mono font-bold text-accent tracking-wide animate-fade-in flex items-center justify-center gap-1">
                <span>No te vayas 😉</span>
              </p>
            )}
          </div>
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
      const { parentName, subName } = getCategoryNames(product);
      if (!nestedGrouped[parentName]) nestedGrouped[parentName] = {};
      if (!nestedGrouped[parentName][subName]) nestedGrouped[parentName][subName] = [];
      nestedGrouped[parentName][subName].push(product);
    });
  }
  const preferredCategoryOrder = [
    'Escapes',
    'Espejos Retrovisores',
    'Manillares y Mandos',
    'Frenos',
    'Pastillas de freno',
    'Transmisión',
    'Motor y Filtración',
    'Baterías y Electricidad',
    'Plástica',
    'Chasis',
    'Cúpulas y Carenados',
    'Maletas y Alforjas',
    'Otros Recambios'
  ];

  const hasGroupedProducts = Object.keys(nestedGrouped).length > 0;

  const sortedCategories = Object.entries(nestedGrouped).sort(([catA], [catB]) => {
    const isEscapeA = catA.toLowerCase().includes('escape');
    const isEscapeB = catB.toLowerCase().includes('escape');
    if (isEscapeA && !isEscapeB) return -1;
    if (!isEscapeA && isEscapeB) return 1;

    const idxA = preferredCategoryOrder.indexOf(catA);
    const idxB = preferredCategoryOrder.indexOf(catB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return catA.localeCompare(catB);
  });

  return (
    <div className="w-full">
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
          sortedCategories.map(([categoryName, subgroups]) => {
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
                              {subProducts.map((product, idx) => (
                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} priority={idx < 4} />
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
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} priority={idx < 4} />
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