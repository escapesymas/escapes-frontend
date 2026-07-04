'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Wrench, Loader2, ChevronLeft, ChevronRight, ShieldAlert, Package, ChevronRight as ChevronIcon, SlidersHorizontal, Wind, Disc3, Bike, Droplets, Truck, Shirt, Zap, CircleDot, Cog, Layers, Tag, HardDrive } from 'lucide-react';

import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import SearchBar from '../../../components/SearchBar';
import ProductCard from '../../../components/ProductCard';
import NotifyMeModal from '../../../components/NotifyMeModal';
import { useCart } from '../../../context/CartContext';
import { Category3, Product, FilterOptions } from '../../../types';

const L1_ICONS: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1001: { icon: ShieldAlert, color: 'text-violet-500' },
  1005: { icon: Shirt, color: 'text-pink-500' },
  1006: { icon: Package, color: 'text-amber-500' },
  1002: { icon: Wrench, color: 'text-blue-500' },
  1007: { icon: Wind, color: 'text-cyan-500' },
  1008: { icon: Disc3, color: 'text-red-500' },
  1004: { icon: Zap, color: 'text-yellow-500' },
  1012: { icon: Cog, color: 'text-orange-500' },
  1014: { icon: CircleDot, color: 'text-emerald-500' },
  1009: { icon: Wrench, color: 'text-stone-500' },
  1010: { icon: Droplets, color: 'text-teal-500' },
  1003: { icon: Bike, color: 'text-lime-500' },
  1016: { icon: Layers, color: 'text-fuchsia-500' },
  1011: { icon: Tag, color: 'text-indigo-500' },
  1013: { icon: Bike, color: 'text-sky-500' },
  1015: { icon: HardDrive, color: 'text-rose-500' },
  1017: { icon: Truck, color: 'text-slate-500' },
};

const DEFAULT_ICON = Package;
const DEFAULT_COLOR = 'text-gray-500';
const CYCLING_COLORS = [
  'text-violet-500', 'text-pink-500', 'text-amber-500', 'text-blue-500',
  'text-cyan-500', 'text-red-500', 'text-yellow-500', 'text-orange-500',
  'text-emerald-500', 'text-stone-500', 'text-cyan-500', 'text-lime-500',
  'text-fuchsia-500', 'text-indigo-500', 'text-sky-500', 'text-rose-500',
  'text-slate-500',
];

function CatalogContent({
  segments,
  initialCategories,
  initialProducts,
  initialFilterOptions,
  initialSearchTotal,
  initialSearchTotalPages,
  initialSearchParamsStr,
}: {
  segments: string[];
  initialCategories: Category3[];
  initialProducts: { products: Product[]; total: number; totalPages: number } | null;
  initialFilterOptions: FilterOptions | null;
  initialSearchTotal: number;
  initialSearchTotalPages: number;
  initialSearchParamsStr: string;
}) {
  const { addToCart } = useCart();
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [products, setProducts] = useState<Product[]>(initialProducts?.products || []);
  const [productsTotal, setProductsTotal] = useState<number>(initialSearchTotal);
  const [productsTotalPages, setProductsTotalPages] = useState<number>(initialSearchTotalPages);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const categories = initialCategories;
  const filterOptions = initialFilterOptions;

  const parentSlug = segments[0] || null;
  const subSlug = segments[1] || null;
  const isSearch = parentSlug === 'buscar';
  const searchQuery = isSearch ? decodeURIComponent(subSlug || '') : '';

  const selectedParentId = useMemo(() => {
    if (isSearch || !parentSlug) return null;
    return categories.find(c => c.slug === parentSlug)?.id || null;
  }, [parentSlug, categories, isSearch]);

  const selectedSubId = useMemo(() => {
    if (!subSlug || isSearch) return null;
    const cat = categories.find(c => c.slug === subSlug && c.parentId === selectedParentId);
    return cat?.id || null;
  }, [subSlug, categories, isSearch, selectedParentId]);

  const selectedSubCategory: Category3 | null = useMemo(() => {
    if (!selectedSubId) return null;
    return categories.find(c => c.id === selectedSubId) || null;
  }, [selectedSubId, categories]);

  const isCategoriesLoading = false;
  const searchResults = products;
  const searchTotal = productsTotal;
  const searchTotalPages = productsTotalPages;

  const getSearchParam = (key: string): string => {
    const p = new URLSearchParams(initialSearchParamsStr);
    return p.get(key) || '';
  };

  const maxPrice = (() => {
    const fp = getSearchParam('maxPrice');
    const parsed = fp ? Number(fp) : null;
    return parsed !== null ? parsed : (filterOptions?.price_max ?? 1000);
  })();

  const searchPage = Number(getSearchParam('page')) || 1;
  const selectedBrands: string[] = getSearchParam('brands') ? getSearchParam('brands').split(',').filter(Boolean) : [];
  const inStockOnly = getSearchParam('inStock') === '1';
  const selectedAttrs: Record<string, string> = (() => {
    try {
      const a = getSearchParam('attrs');
      return a ? JSON.parse(decodeURIComponent(a)) : {};
    } catch { return {}; }
  })();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem('tg_selected_bike');
    if (active) setSelectedBike(active);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const loadProducts = async () => {
      setIsProductsLoading(true);
      try {
        const paramsObj: Record<string, string> = { universal: 'true', per_page: '24' };
        const page = Number(getSearchParam('page')) || 1;
        paramsObj.page = String(page);
        const q = searchQuery || getSearchParam('q');
        if (q) paramsObj.search = q;
        const catId = selectedSubId || selectedParentId;
        if (catId) {
          paramsObj.category_id = String(catId);
        } else {
          const ps = segments[0];
          if (ps && ps !== 'buscar') {
            paramsObj.category_slug = ps;
          }
        }
        const brands = getSearchParam('brands');
        if (brands) paramsObj.brand = brands;
        const maxPrice = getSearchParam('maxPrice');
        if (maxPrice) paramsObj.max_price = maxPrice;
        if (getSearchParam('inStock') === '1') paramsObj.in_stock = '1';
        const attrs = getSearchParam('attrs');
        if (attrs) paramsObj.attrs = attrs;

        const qs = new URLSearchParams(paramsObj).toString();
        const res = await fetch(`/api/catalog/products?${qs}`, { signal: ctrl.signal });
        if (!res.ok) {
          setProducts([]);
          setProductsTotal(0);
          setProductsTotalPages(0);
          return;
        }
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
        const total = Number(res.headers.get('X-WP-Total') || data.total || 0);
        const totalPages = Number(res.headers.get('X-WP-TotalPages') || data.totalPages || 0);
        setProductsTotal(total);
        setProductsTotalPages(totalPages);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn('[CATALOG] Failed to load products:', e?.message || 'fetch error');
        }
      } finally {
        setIsProductsLoading(false);
      }
    };
    loadProducts();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join('/'), selectedParentId, selectedSubId, searchQuery, initialSearchParamsStr]);

  const basePath = useMemo(() => {
    if (segments.length === 0) return '/universales';
    return '/universales/' + segments.join('/');
  }, [segments]);

  const filterHref = (updates: Record<string, string | null | undefined | false>): string => {
    const params = new URLSearchParams(initialSearchParamsStr);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const mainCategories = useMemo(() => {
    const l1s = categories.filter(c => c.parentId === 0);
    return l1s.map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      label: cat.name,
      slug: cat.slug,
      icon: L1_ICONS[cat.id]?.icon || DEFAULT_ICON,
      color: L1_ICONS[cat.id]?.color || CYCLING_COLORS[idx % CYCLING_COLORS.length],
    }));
  }, [categories]);

  const visibleSubcategories = categories.filter(cat => cat.parentId === selectedParentId);

  const getParentLabel = (parentId: number): string => {
    const l1 = categories.find(c => c.id === parentId);
    return l1?.name || '';
  };

  const parentCategory = useMemo(() => {
    if (!parentSlug || isSearch) return null;
    return categories.find(c => c.slug === parentSlug) || null;
  }, [parentSlug, categories, isSearch]);

  const navigate = (url: string) => {
    window.location.href = url;
  };

  const handleSearch = (query: string) => {
    if (!query) {
      navigate('/universales');
    } else {
      navigate(`/universales/buscar/${encodeURIComponent(query)}`);
    }
  };

  const handleParentSelect = (slug: string) => {
    navigate(`/universales/${slug}`);
  };

  const handleSubSelect = (sub: Category3) => {
    if (parentSlug) {
      navigate(`/universales/${parentSlug}/${sub.slug}`);
    }
  };

  const handleResetNavigation = () => {
    navigate('/universales');
  };

  const handleBackToParent = () => {
    if (parentSlug && !isSearch) {
      navigate(`/universales/${parentSlug}`);
    }
  };

  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleNotifyMe = (product: Product) => {
    setNotifyProduct(product);
  };

  const attrsHref = (key: string, value: string): string => {
    const next = { ...selectedAttrs };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    const attrsStr = Object.keys(next).length > 0 ? encodeURIComponent(JSON.stringify(next)) : null;
    return filterHref({ attrs: attrsStr, page: '1' });
  };

  return (
    <div
      className="bg-background text-foreground flex flex-col font-sans"
      style={{ height: '100dvh' }}
    >
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => navigate('/?openSelector=true')}
        onCartClick={() => navigate('/?tab=cart')}
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
      />

      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-6 max-w-[1400px]">
          <div className="flex flex-col gap-6 animate-fade-in">
            <section className="relative overflow-hidden bg-card border border-card-border rounded-md py-6 px-6 shadow-sm">
              <div className="relative z-10 max-w-xl flex flex-col items-start text-left">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent-text bg-accent/10 border border-accent/20 px-3 py-1 rounded mb-3">
                  Uso general y accesorios
                </span>
                <h1 className="font-mono font-bold uppercase tracking-tight text-xl md:text-2xl mb-1 leading-tight text-foreground">
                  Productos <span className="text-accent-text">Universales</span>
                </h1>
                <p className="text-text-muted text-[11px] font-sans max-w-md leading-relaxed">
                  Aquí encontrarás todo tipo de equipación, cascos y accesorios generales aptos para cualquier moto sin necesidad de compatibilidad específica.
                </p>
              </div>
            </section>

            <section className="px-4 md:px-0 -mt-2">
              <SearchBar onSearch={handleSearch} isLoading={isProductsLoading} initialValue={searchQuery} />
            </section>

            <div className="flex items-center flex-wrap gap-1 px-4 md:px-0 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              <a href="/universales" className="hover:text-foreground font-bold transition-colors cursor-pointer">
                Catálogo Universal
              </a>
              {(parentSlug || searchQuery) && <ChevronIcon className="w-3 h-3" />}

              {isSearch ? (
                <span className="text-accent-text font-bold">Búsqueda: &ldquo;{searchQuery}&rdquo;</span>
              ) : (
                <>
                  {parentCategory && (
                    <a href={`/universales/${parentSlug}`} className="hover:text-foreground font-bold transition-colors cursor-pointer">
                      {parentCategory.name}
                    </a>
                  )}
                  {selectedSubCategory && (
                    <>
                      <ChevronIcon className="w-3 h-3" />
                      <span className="text-accent-text font-bold">{selectedSubCategory.name}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {isCategoriesLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : (
              <>
                {!parentSlug && !searchQuery && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider px-4 md:px-0">
                      Selecciona una categoría
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 md:px-0">
                      {mainCategories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <a
                            key={cat.id}
                            href={`/universales/${cat.slug}`}
                            className="p-8 bg-card border border-card-border hover:border-accent hover:bg-select-bg rounded-md flex flex-col items-center justify-center gap-4 transition-all cursor-pointer shadow-sm group text-center no-underline"
                          >
                            <div className="w-14 h-14 rounded-full bg-icon-box flex items-center justify-center border border-card-border group-hover:bg-accent/10 transition-colors">
                              <Icon className={`w-7 h-7 ${cat.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                              {cat.label}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {parentSlug && !selectedSubCategory && !isSearch && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-4 md:px-0">
                      <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
                        Subcategorías de {parentCategory?.name || parentSlug}
                      </h3>
                      <a href="/universales" className="text-[10px] font-mono uppercase text-accent-text hover:underline cursor-pointer">
                        Volver al inicio
                      </a>
                    </div>
                    {visibleSubcategories.length === 0 ? (
                      <div className="py-12 text-center text-xs text-text-muted font-mono">
                        No hay subcategorías disponibles.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-4 md:px-0">
                        {visibleSubcategories.map((sub) => (
                          <a
                            key={sub.id}
                            href={`/universales/${parentSlug}/${sub.slug}`}
                            className="p-4 bg-card border border-card-border hover:border-accent hover:bg-select-bg rounded-md flex items-center justify-between transition-all cursor-pointer group text-left no-underline"
                          >
                            <span className="text-[11px] font-mono font-bold uppercase text-foreground">
                              {sub.name}
                            </span>
                            <ChevronIcon className="w-4 h-4 text-text-muted group-hover:text-accent-text transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(selectedSubCategory || isSearch) && (
                  <section className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-card-border/60 pb-4 px-4 md:px-0">
                      <div>
                        <h3 className="text-sm font-mono font-bold uppercase text-foreground">
                          {isSearch ? (
                            <>Búsqueda Universal: <span className="text-accent-text">&ldquo;{searchQuery}&rdquo;</span></>
                          ) : (
                            <>Productos: <span className="text-accent-text">{selectedSubCategory?.name}</span></>
                          )}
                        </h3>
                        <p className="text-[10px] text-text-muted font-mono mt-1">
                          {searchTotal} producto{searchTotal !== 1 ? 's' : ''} universal{searchTotal !== 1 ? 'es' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
                          className="md:hidden p-2 border border-card-border rounded bg-card text-text-muted hover:text-foreground cursor-pointer"
                          aria-label="Filtros"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <a
                          href="/universales"
                          className="px-3 py-1.5 border border-card-border rounded hover:bg-icon-box/40 text-xs font-mono font-bold uppercase text-text-muted hover:text-foreground cursor-pointer transition-all inline-block"
                        >
                          Cerrar
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <aside className={`w-full md:w-56 shrink-0 bg-card border border-card-border rounded-md p-4 flex-col gap-5 self-start shadow-sm md:flex ${
                        isSidebarOpenMobile ? 'flex' : 'hidden'
                      }`}>
                        {/* Brands */}
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2 pb-1 border-b border-card-border/60">
                            Marcas
                          </h4>
                          {!filterOptions || filterOptions.brands.length === 0 ? (
                            <p className="text-[10px] font-mono text-text-muted">No hay marcas disponibles.</p>
                          ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 select-none no-scrollbar">
                              {filterOptions.brands.map(brand => {
                                const isChecked = selectedBrands.includes(brand);
                                return (
                                  <a
                                    key={brand}
                                    href={filterHref({ brands: isChecked ? null : brand, page: '1' })}
                                    aria-label={`Filtrar por marca ${brand}${isChecked ? ' (activado)' : ''}`}
                                    className="flex items-center gap-2 text-[10px] font-mono uppercase cursor-pointer hover:text-accent-text text-foreground no-underline min-h-[24px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      aria-label={`Filtrar por marca ${brand}`}
                                      className="rounded border-card-border bg-select-bg text-accent focus:ring-0 focus:ring-offset-0 w-3 h-3 pointer-events-none"
                                    />
                                    <span className="truncate">{brand}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2 pb-1 border-b border-card-border/60">
                            Precio Máximo
                          </h4>
                          <div className="flex flex-col gap-2">
                            <input
                              type="range"
                              min="0"
                              max={filterOptions?.price_max ?? 1000}
                              step={10}
                              value={Math.min(maxPrice, filterOptions?.price_max ?? 1000)}
                              onChange={(e) => {
                                const link = filterHref({ maxPrice: String(e.target.value), page: '1' });
                                window.location.href = link;
                              }}
                              className="w-full accent-accent bg-card-border h-1 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] font-mono text-text-muted">
                              <span>0 €</span>
                              <span className="text-foreground font-bold">{maxPrice} €</span>
                            </div>
                          </div>
                        </div>

                        {/* In Stock Toggle */}
                        <div>
                          <a
                            href={filterHref({ inStock: inStockOnly ? null : '1', page: '1' })}
                            className="flex items-center gap-2 text-[10px] font-mono uppercase cursor-pointer hover:text-accent-text text-foreground no-underline"
                          >
                            <input
                              type="checkbox"
                              checked={inStockOnly}
                              readOnly
                              className="rounded border-card-border bg-select-bg text-accent focus:ring-0 focus:ring-offset-0 w-3 h-3 pointer-events-none"
                            />
                            Solo disponible
                          </a>
                        </div>

                        {/* Dynamic Attribute Filters */}
                        {filterOptions && Object.keys(filterOptions.attributes).length > 0 && (
                          Object.entries(filterOptions.attributes).map(([key, values]) => (
                            <div key={key}>
                              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2 pb-1 border-b border-card-border/60">
                                {key}
                              </h4>
                              {key === 'Talla' ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {values.map(val => {
                                    const isActive = selectedAttrs[key] === val;
                                    return (
                                      <a
                                        key={val}
                                        href={attrsHref(key, val)}
                                        className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer inline-block no-underline ${
                                          isActive
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-card text-text-muted border-card-border hover:border-accent hover:text-foreground'
                                        }`}
                                      >
                                        {val}
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                  {values.map(val => {
                                    const isActive = selectedAttrs[key] === val;
                                    return (
                                      <a
                                        key={val}
                                        href={attrsHref(key, val)}
                                        className="flex items-center gap-2 text-[10px] font-mono uppercase cursor-pointer hover:text-accent-text text-foreground no-underline"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isActive}
                                          readOnly
                                          className="rounded border-card-border bg-select-bg text-accent focus:ring-0 focus:ring-offset-0 w-3 h-3 pointer-events-none"
                                        />
                                        <span className="truncate">{key === 'Color' ? (
                                          <span className="flex items-center gap-1.5">
                                            <span className="inline-block w-3 h-3 rounded-full border border-card-border" style={{
                                              backgroundColor: val.toLowerCase() === 'negro' ? '#000' :
                                                val.toLowerCase() === 'blanco' ? '#fff' :
                                                val.toLowerCase() === 'rojo' ? '#ef4444' :
                                                val.toLowerCase() === 'azul' ? '#3b82f6' :
                                                val.toLowerCase() === 'verde' ? '#22c55e' :
                                                val.toLowerCase() === 'gris' ? '#9ca3af' :
                                                val.toLowerCase() === 'plateado' || val.toLowerCase() === 'plata' ? '#c0c0c0' :
                                                val.toLowerCase() === 'amarillo' ? '#eab308' :
                                                val.toLowerCase() === 'naranja' ? '#f97316' :
                                                val.toLowerCase() === 'marron' || val.toLowerCase() === 'marrón' ? '#92400e' :
                                                val.toLowerCase() === 'violeta' || val.toLowerCase() === 'morado' ? '#a855f7' :
                                                val.toLowerCase() === 'rosa' ? '#ec4899' :
                                                'transparent'
                                            }} />
                                            {val}
                                          </span>
                                        ) : val}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {/* Clear Filters */}
                          {(selectedBrands.length > 0 || inStockOnly || Object.keys(selectedAttrs).length > 0 || (() => {
                            const fp = getSearchParam('maxPrice');
                            return fp !== '' && filterOptions && Number(fp) < (filterOptions?.price_max ?? 1000);
                          })()) && (
                          <a
                            href={filterHref({ brands: null, maxPrice: null, inStock: null, attrs: null, page: '1' })}
                            className="w-full py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-center text-text-muted hover:text-foreground border border-dashed border-card-border rounded block"
                          >
                            Limpiar Filtros
                          </a>
                        )}
                      </aside>

                      <div className="flex-1 flex flex-col gap-6">
                        {isProductsLoading ? (
                          <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-card-border rounded-md">
                            <Wrench className="w-10 h-10 text-text-muted" />
                            <p className="text-xs text-text-muted font-mono text-center px-4">
                              No se encontraron productos que coincidan con los filtros seleccionados.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {searchResults.map((product, idx) => (
                                <ProductCard
                                  key={product.id}
                                  product={product}
                                  onAddToCart={handleAddToCart}
                                  onNotifyMe={handleNotifyMe}
                                  priority={idx < 3}
                                />
                              ))}
                            </div>

                            {searchTotalPages > 1 && (
                              <div className="flex items-center justify-center gap-3 mt-8">
                                {searchPage > 1 ? (
                                  <a
                                    href={`?page=${Math.max(1, searchPage - 1)}`}
                                    className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer inline-block"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="p-2 border border-card-border rounded bg-card opacity-40 inline-block">
                                    <ChevronLeft className="w-4 h-4" />
                                  </span>
                                )}
                                <span className="text-xs font-mono text-text-muted">
                                  Página {searchPage} de {searchTotalPages}
                                </span>
                                {searchPage < searchTotalPages ? (
                                  <a
                                    href={`?page=${searchPage + 1}`}
                                    className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer inline-block"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="p-2 border border-card-border rounded bg-card opacity-40 inline-block">
                                    <ChevronRight className="w-4 h-4" />
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNav
        activeTab="shop"
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
        selectedBike={selectedBike}
      />

      <NotifyMeModal
        isOpen={!!notifyProduct}
        onClose={() => setNotifyProduct(null)}
        productName={notifyProduct?.name || ''}
        productId={notifyProduct?.id || 0}
      />
    </div>
  );
}

export default function CatalogClient({
  segments,
  initialCategories,
  initialProducts,
  initialFilterOptions,
  initialSearchTotal,
  initialSearchTotalPages,
  initialSearchParamsStr,
}: {
  segments: string[];
  initialCategories: Category3[];
  initialProducts: { products: Product[]; total: number; totalPages: number } | null;
  initialFilterOptions: FilterOptions | null;
  initialSearchTotal: number;
  initialSearchTotalPages: number;
  initialSearchParamsStr: string;
}) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-text-muted">Cargando catálogo...</p>
        </div>
      </div>
    }>
      <CatalogContent
        segments={segments}
        initialCategories={initialCategories}
        initialProducts={initialProducts}
        initialFilterOptions={initialFilterOptions}
        initialSearchTotal={initialSearchTotal}
        initialSearchTotalPages={initialSearchTotalPages}
        initialSearchParamsStr={initialSearchParamsStr}
      />
    </Suspense>
  );
}
