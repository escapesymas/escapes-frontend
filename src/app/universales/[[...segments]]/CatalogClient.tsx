'use client';
import Link from 'next/link';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Wrench, Loader2, ChevronLeft, ChevronRight, ChevronRight as ChevronIcon, SlidersHorizontal } from 'lucide-react';

import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import SearchBar from '../../../components/SearchBar';
import ProductCard from '../../../components/ProductCard';
import NotifyMeModal from '../../../components/NotifyMeModal';
import { CATEGORY_HD_ICONS, IconHerramientas } from '../../../components/CategoryCustomIcons';
import { useCart } from '../../../context/CartContext';
import { Category3, Product, FilterOptions } from '../../../types';
import CatalogFilters from '../../../components/catalog/CatalogFilters';
import {
  CatalogUrlState, SORT_OPTIONS, CatalogSort, parseCatalogUrl, toApiParams, attrsToParam, hasActiveFilters,
} from '../../../lib/catalogParams';

const DEFAULT_ICON = IconHerramientas;
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
  initialMainCategories,
  initialProducts,
  initialFilterOptions,
  initialSearchTotal,
  initialSearchTotalPages,
  initialSearchParamsStr,
  initialSearchMeta,
}: {
  segments: string[];
  initialCategories: Category3[];
  initialMainCategories: { id: number; name: string; slug: string }[];
  initialProducts: { products: Product[]; total: number; totalPages: number } | null;
  initialFilterOptions: FilterOptions | null;
  initialSearchTotal: number;
  initialSearchTotalPages: number;
  initialSearchParamsStr: string;
  initialSearchMeta?: { fuzzy: boolean; corrected: string | null };
}) {
  const { addToCart } = useCart();
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [products, setProducts] = useState<Product[]>(initialProducts?.products || []);
  const [productsTotal, setProductsTotal] = useState<number>(initialSearchTotal);
  const [productsTotalPages, setProductsTotalPages] = useState<number>(initialSearchTotalPages);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const categories = initialCategories;
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(initialFilterOptions);
  const [isFuzzy, setIsFuzzy] = useState(initialSearchMeta?.fuzzy || false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(initialSearchMeta?.corrected || null);

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

  const [searchParamsStr, setSearchParamsStr] = useState<string>(initialSearchParamsStr);

  useEffect(() => {
    const handlePopState = () => {
      const qs = window.location.search.replace(/^\?/, '');
      setSearchParamsStr(qs);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Todo el estado de filtros/orden/página vive en la URL.
  const urlState = useMemo(() => parseCatalogUrl(searchParamsStr), [searchParamsStr]);
  const searchPage = urlState.page;
  const searchResults = products;
  const searchTotal = productsTotal;
  const searchTotalPages = productsTotalPages;

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem('tg_selected_bike');
    if (active) setSelectedBike(active);
  }, []);

  // Productos y facetas se piden con los mismos parámetros. La primera carga ya
  // viene del servidor: no se repite en el cliente.
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (initialProducts) return;
    }
    const ctrl = new AbortController();
    const ctx = {
      categoryId: selectedSubId || selectedParentId,
      categorySlug: !selectedSubId && !selectedParentId && segments[0] && segments[0] !== 'buscar' ? segments[0] : null,
      search: searchQuery || undefined,
    };
    const load = async () => {
      setIsProductsLoading(true);
      try {
        const [res, filtersRes] = await Promise.all([
          fetch(`/api/catalog/products?${toApiParams(urlState, ctx)}`, { signal: ctrl.signal }),
          fetch(`/api/catalog/filters?${toApiParams(urlState, ctx, true)}`, { signal: ctrl.signal }),
        ]);
        if (filtersRes.ok) setFilterOptions(await filtersRes.json());
        if (!res.ok) {
          setProducts([]);
          setProductsTotal(0);
          setProductsTotalPages(0);
          return;
        }
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
        setProductsTotal(Number(res.headers.get('X-WP-Total') || 0));
        setProductsTotalPages(Number(res.headers.get('X-WP-TotalPages') || 0));
        setIsFuzzy(res.headers.get('X-Search-Fuzzy') === '1');
        const corr = res.headers.get('X-Search-Corrected');
        setCorrectedQuery(corr ? decodeURIComponent(corr) : null);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') console.warn('[CATALOG] Error cargando productos:', (e as Error)?.message);
      } finally {
        setIsProductsLoading(false);
      }
    };
    load();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join('/'), selectedParentId, selectedSubId, searchQuery, searchParamsStr]);

  const basePath = useMemo(() => {
    if (segments.length === 0) return '/universales';
    return '/universales/' + segments.join('/');
  }, [segments]);

  const pushUrl = (params: URLSearchParams) => {
    const newQs = params.toString();
    setSearchParamsStr(newQs);
    window.history.pushState({}, '', newQs ? `${basePath}?${newQs}` : basePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cambia filtros (siempre vuelve a la página 1).
  const applyFilters = (updates: Partial<CatalogUrlState>) => {
    const next = { ...urlState, ...updates };
    const p = new URLSearchParams(searchParamsStr);
    const setOrDelete = (k: string, v: string | null) => (v ? p.set(k, v) : p.delete(k));
    setOrDelete('brands', next.brands.length ? next.brands.join(',') : null);
    setOrDelete('minPrice', next.minPrice != null ? String(next.minPrice) : null);
    setOrDelete('maxPrice', next.maxPrice != null ? String(next.maxPrice) : null);
    setOrDelete('inStock', next.inStock ? '1' : null);
    setOrDelete('attrs', attrsToParam(next.attrs));
    setOrDelete('q', next.q || null);
    p.delete('page');
    pushUrl(p);
  };

  const setSort = (sort: CatalogSort) => {
    const p = new URLSearchParams(searchParamsStr);
    if (sort === 'relevance') p.delete('sort'); else p.set('sort', sort);
    p.delete('page');
    pushUrl(p);
  };

  const setPage = (page: number) => {
    const p = new URLSearchParams(searchParamsStr);
    if (page <= 1) p.delete('page'); else p.set('page', String(page));
    pushUrl(p);
  };

  const clearFilters = () => applyFilters({ brands: [], minPrice: null, maxPrice: null, inStock: false, attrs: {} });

  const isPromoCat = (id: number, slug: string, name: string) =>
    id === 1011 || id === 634 || slug.includes('promocional') || name.toLowerCase().includes('promocional');

  const mainCategories = useMemo(() => {
    return initialMainCategories
      .filter(cat => !isPromoCat(cat.id, cat.slug, cat.name))
      .map((cat, idx) => {
        const hd = CATEGORY_HD_ICONS[cat.id];
        const subCount = categories.filter(c => c.parentId === cat.id && !isPromoCat(c.id, c.slug, c.name)).length;
        return {
          id: cat.id,
          name: cat.name,
          label: cat.name,
          slug: cat.slug,
          icon: hd?.icon || DEFAULT_ICON,
          color: hd?.color || CYCLING_COLORS[idx % CYCLING_COLORS.length],
          subCount,
        };
      });
  }, [initialMainCategories, categories]);

  const visibleSubcategories = categories.filter(
    cat => cat.parentId === selectedParentId && !isPromoCat(cat.id, cat.slug, cat.name)
  );

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
    if (selectedParentId && !isSearch) {
      // Dentro de una categoría se busca en ella, conservando los filtros.
      applyFilters({ q: query.trim() });
    } else if (!query) {
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

  return (
    <div className="bg-background text-foreground flex flex-col font-sans min-h-screen">
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => navigate('/?openSelector=true')}
        onCartClick={() => navigate('/?tab=cart')}
        onTabChange={(tab) => navigate(`/?tab=${tab}`)}
      />

      <main className="flex-1 pb-28 md:pb-0">

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
              <Link href="/universales" className="hover:text-foreground font-bold transition-colors cursor-pointer">
                Catálogo Universal
              </Link>
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
                {/* 1. Header Banner & Category / Subcategory Navigation Bar */}
                <div className="flex flex-col gap-6 mb-6">
                  {!parentSlug && !isSearch ? (
                    /* Root /universales Page Header & Grid of Categories */
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1 px-4 md:px-0">
                        <h2 className="text-base md:text-lg font-mono font-bold uppercase tracking-wider text-foreground">
                          Categorías de Productos Universales
                        </h2>
                        <p className="text-xs font-mono text-text-muted">
                          Explora recambios, accesorios y equipamiento universal por categoría
                        </p>
                      </div>

                      {/* 17 Main Categories Grid with HD Vector Icons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-4 md:px-0">
                        {mainCategories.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <a
                              key={cat.id}
                              href={`/universales/${cat.slug}`}
                              className="p-4 bg-card border border-card-border hover:border-accent hover:bg-select-bg rounded-lg flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group text-center no-underline"
                            >
                              <div className="w-12 h-12 rounded-full bg-icon-box flex items-center justify-center border border-card-border group-hover:border-accent/40 group-hover:scale-105 transition-all">
                                <Icon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-tight text-foreground line-clamp-1">
                                  {cat.label}
                                </span>
                                {cat.subCount > 0 && (
                                  <span className="text-[9px] font-mono text-text-muted">
                                    {cat.subCount} subcat.
                                  </span>
                                )}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : parentSlug && !isSearch ? (
                    /* Parent Category / Subcategory Active View Banner */
                    <div className="flex flex-col gap-4 px-4 md:px-0 bg-card border border-card-border rounded-lg p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const hd = parentCategory ? CATEGORY_HD_ICONS[parentCategory.id] : null;
                            const Icon = hd?.icon || IconHerramientas;
                            return (
                              <div className="w-12 h-12 rounded-full bg-icon-box flex items-center justify-center border border-card-border shrink-0">
                                <Icon className="w-7 h-7" />
                              </div>
                            );
                          })()}
                          <div>
                            <h2 className="text-base md:text-lg font-mono font-bold uppercase tracking-wider text-foreground">
                              {selectedSubCategory ? selectedSubCategory.name : (parentCategory?.name || parentSlug)}
                            </h2>
                            <p className="text-[11px] font-mono text-text-muted">
                              {selectedSubCategory ? `Subcategoría de ${parentCategory?.name}` : `Categoría Principal · ${visibleSubcategories.length} subcategorías`}
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/universales"
                          className="px-3 py-1.5 border border-card-border rounded hover:bg-icon-box/40 text-[10px] font-mono font-bold uppercase text-text-muted hover:text-foreground cursor-pointer transition-all no-underline"
                        >
                          Ver todas las categorías
                        </Link>
                      </div>

                      {/* Subcategory Pills */}
                      {visibleSubcategories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-card-border/60">
                          <a
                            href={`/universales/${parentSlug}`}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all no-underline border ${
                              !selectedSubCategory
                                ? 'bg-accent text-white border-accent shadow-sm'
                                : 'bg-card border-card-border text-text-muted hover:border-accent hover:text-foreground'
                            }`}
                          >
                            Todas
                          </a>
                          {visibleSubcategories.map((sub) => {
                            const isActive = selectedSubCategory?.id === sub.id;
                            return (
                              <a
                                key={sub.id}
                                href={`/universales/${parentSlug}/${sub.slug}`}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all no-underline border ${
                                  isActive
                                    ? 'bg-accent text-white border-accent shadow-sm'
                                    : 'bg-card border-card-border text-text-muted hover:border-accent hover:text-foreground'
                                }`}
                              >
                                {sub.name}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : isSearch ? (
                    /* Search Active Banner */
                    <div className="flex items-center justify-between px-4 md:px-0 bg-card border border-card-border rounded-lg p-5 shadow-sm">
                      <div>
                        <h2 className="text-base md:text-lg font-mono font-bold uppercase text-foreground">
                          Búsqueda Universal: <span className="text-accent-text">&ldquo;{searchQuery}&rdquo;</span>
                        </h2>
                        <p className="text-[11px] font-mono text-text-muted mt-1">
                          {searchTotal} producto{searchTotal !== 1 ? 's' : ''} encontrado{searchTotal !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link
                        href="/universales"
                        className="px-3 py-1.5 border border-card-border rounded hover:bg-icon-box/40 text-[10px] font-mono font-bold uppercase text-text-muted hover:text-foreground cursor-pointer transition-all no-underline"
                      >
                        Limpiar Búsqueda
                      </Link>
                    </div>
                  ) : null}
                </div>

                {/* 2. Main Products Catalog Section (ALWAYS VISIBLE) */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-card-border/60 pb-3 px-4 md:px-0">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                        {isSearch ? (
                          <>Resultados para: <span className="text-accent-text">&ldquo;{searchQuery}&rdquo;</span></>
                        ) : selectedSubCategory ? (
                          <>Productos en <span className="text-accent-text">{selectedSubCategory.name}</span></>
                        ) : parentCategory ? (
                          <>Productos en <span className="text-accent-text">{parentCategory.name}</span></>
                        ) : (
                          <>Todos los productos universales</>
                        )}
                      </h3>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">
                        {searchTotal} producto{searchTotal !== 1 ? 's' : ''} disponible{searchTotal !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={urlState.sort}
                        onChange={(e) => setSort(e.target.value as CatalogSort)}
                        className="px-2.5 py-1 text-[10px] font-mono bg-card border border-card-border rounded text-foreground cursor-pointer focus:outline-none focus:border-accent"
                        aria-label="Ordenar productos"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
                        className="md:hidden p-1.5 border border-card-border rounded bg-card text-text-muted hover:text-foreground cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                        aria-label="Filtros"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">

                      <aside className={`w-full md:w-56 shrink-0 bg-card border border-card-border rounded-md p-4 flex-col gap-5 self-start shadow-sm md:flex ${
                        isSidebarOpenMobile ? 'flex' : 'hidden'
                      }`}>
                        <CatalogFilters
                          key={searchParamsStr}
                          options={filterOptions}
                          state={urlState}
                          onChange={applyFilters}
                          onClear={clearFilters}
                        />
                      </aside>

                      <div className="flex-1 flex flex-col gap-5">
                        {/* Filtros activos */}
                        {hasActiveFilters(urlState) && (
                          <div className="flex flex-wrap items-center gap-2 bg-card border border-card-border/80 rounded-md p-2.5 text-[10px] font-mono">
                            <span className="text-text-muted uppercase font-bold text-[9px] mr-1">Filtros:</span>
                            {urlState.brands.map((b) => (
                              <button key={b} type="button" className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent-text font-bold flex items-center gap-1 hover:bg-accent/20 transition-all cursor-pointer" onClick={() => applyFilters({ brands: urlState.brands.filter((x) => x !== b) })}>
                                {b} <span aria-hidden="true">×</span>
                              </button>
                            ))}
                            {Object.entries(urlState.attrs).flatMap(([k, vals]) => vals.map((v) => (
                              <button key={`${k}:${v}`} type="button" className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent-text font-bold flex items-center gap-1 hover:bg-accent/20 transition-all cursor-pointer" onClick={() => applyFilters({ attrs: { ...urlState.attrs, [k]: vals.filter((x) => x !== v) } })}>
                                {k}: {v} <span aria-hidden="true">×</span>
                              </button>
                            )))}
                            {(urlState.minPrice != null || urlState.maxPrice != null) && (
                              <button type="button" className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent-text font-bold flex items-center gap-1 hover:bg-accent/20 transition-all cursor-pointer" onClick={() => applyFilters({ minPrice: null, maxPrice: null })}>
                                {urlState.minPrice ?? 0}–{urlState.maxPrice ?? '∞'} € <span aria-hidden="true">×</span>
                              </button>
                            )}
                            {urlState.inStock && (
                              <button type="button" className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent-text font-bold flex items-center gap-1 hover:bg-accent/20 transition-all cursor-pointer" onClick={() => applyFilters({ inStock: false })}>
                                Con stock <span aria-hidden="true">×</span>
                              </button>
                            )}
                            <button type="button" onClick={clearFilters} className="text-[9px] uppercase font-bold text-text-muted hover:text-foreground underline ml-auto cursor-pointer bg-transparent border-0 p-0">
                              Limpiar todo
                            </button>
                          </div>
                        )}

                        {correctedQuery && !isProductsLoading && searchResults.length > 0 && (
                          <p className="text-[10px] font-mono text-text-muted bg-card border border-card-border rounded-md px-3 py-2">
                            Mostrando resultados para <strong className="text-foreground">&ldquo;{correctedQuery}&rdquo;</strong>
                          </p>
                        )}
                        {isFuzzy && !correctedQuery && !isProductsLoading && searchResults.length > 0 && (
                          <p className="text-[10px] font-mono text-text-muted bg-card border border-card-border rounded-md px-3 py-2">
                            No hay coincidencias exactas: mostrando resultados parecidos.
                          </p>
                        )}

                        {isProductsLoading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="bg-card border border-card-border rounded-md p-4 animate-pulse flex flex-col gap-3">
                                <div className="w-full h-40 bg-icon-box/80 rounded" />
                                <div className="h-3 bg-icon-box rounded w-1/3" />
                                <div className="h-4 bg-icon-box/90 rounded w-3/4" />
                                <div className="h-5 bg-icon-box rounded w-1/4 mt-auto" />
                              </div>
                            ))}
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-card-border rounded-md">
                            <Wrench className="w-10 h-10 text-text-muted" />
                            <p className="text-xs text-text-muted font-mono text-center px-4">
                              {hasActiveFilters(urlState)
                                ? 'Ningún producto cumple todos los filtros. Prueba a quitar alguno.'
                                : 'No hemos encontrado productos. Prueba con otras palabras o con la referencia del fabricante.'}
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
                                  <button
                                    type="button"
                                    onClick={() => setPage(searchPage - 1)}
                                    className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer inline-block"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="p-2 border border-card-border rounded bg-card opacity-40 inline-block">
                                    <ChevronLeft className="w-4 h-4" />
                                  </span>
                                )}
                                <span className="text-xs font-mono text-text-muted">
                                  Página {searchPage} de {searchTotalPages}
                                </span>
                                {searchPage < searchTotalPages ? (
                                  <button
                                    type="button"
                                    onClick={() => setPage(searchPage + 1)}
                                    className="p-2 border border-card-border rounded bg-card hover:bg-icon-box/40 transition-all cursor-pointer inline-block"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
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
  initialMainCategories,
  initialProducts,
  initialFilterOptions,
  initialSearchTotal,
  initialSearchTotalPages,
  initialSearchParamsStr,
  initialSearchMeta,
}: {
  segments: string[];
  initialCategories: Category3[];
  initialMainCategories: { id: number; name: string; slug: string }[];
  initialProducts: { products: Product[]; total: number; totalPages: number } | null;
  initialFilterOptions: FilterOptions | null;
  initialSearchTotal: number;
  initialSearchTotalPages: number;
  initialSearchParamsStr: string;
  initialSearchMeta?: { fuzzy: boolean; corrected: string | null };
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
        initialMainCategories={initialMainCategories}
        initialProducts={initialProducts}
        initialFilterOptions={initialFilterOptions}
        initialSearchTotal={initialSearchTotal}
        initialSearchTotalPages={initialSearchTotalPages}
        initialSearchParamsStr={initialSearchParamsStr}
        initialSearchMeta={initialSearchMeta}
      />
    </Suspense>
  );
}
