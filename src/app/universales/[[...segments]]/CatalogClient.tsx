'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Wrench, ChevronLeft, ChevronRight, SlidersHorizontal, X, Loader2 } from 'lucide-react';

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

type InitialProducts = { products: Product[]; total: number; totalPages: number } | null;

interface Props {
  segments: string[];
  initialCategories: Category3[];
  initialMainCategories: { id: number; name: string; slug: string }[];
  initialProducts: InitialProducts;
  initialFilterOptions: FilterOptions | null;
  initialSearchTotal: number;
  initialSearchTotalPages: number;
  initialSearchParamsStr: string;
  initialSearchMeta?: { fuzzy: boolean; corrected: string | null; refs?: number };
}

const isPromoCat = (c: { id: number; slug: string; name: string }) =>
  c.id === 1011 || c.id === 634 || c.slug.includes('promocional') || c.name.toLowerCase().includes('promocional');

const chip = 'shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap';
const chipOn = 'bg-accent text-slate-950 border-accent font-semibold';
const chipOff = 'bg-card text-foreground border-card-border hover:border-accent';

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
}: Props) {
  const { addToCart } = useCart();
  const [selectedBike, setSelectedBike] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts?.products || []);
  const [total, setTotal] = useState(initialSearchTotal);
  const [refs, setRefs] = useState(initialSearchMeta?.refs ?? initialSearchTotal);
  const [totalPages, setTotalPages] = useState(initialSearchTotalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedPage, setLoadedPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(initialFilterOptions);
  const [isFuzzy, setIsFuzzy] = useState(initialSearchMeta?.fuzzy || false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(initialSearchMeta?.corrected || null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);
  const [searchParamsStr, setSearchParamsStr] = useState(initialSearchParamsStr);

  const categories = initialCategories;
  const parentSlug = segments[0] || null;
  const subSlug = segments[1] || null;
  const isSearch = parentSlug === 'buscar';
  const searchQuery = isSearch ? decodeURIComponent(subSlug || '') : '';

  const parentCategory = useMemo(
    () => (isSearch || !parentSlug ? null : categories.find((c) => c.slug === parentSlug) || null),
    [parentSlug, categories, isSearch],
  );
  const subCategory = useMemo(
    () => (!subSlug || isSearch || !parentCategory ? null : categories.find((c) => c.slug === subSlug && c.parentId === parentCategory.id) || null),
    [subSlug, categories, isSearch, parentCategory],
  );
  const subcategories = parentCategory ? categories.filter((c) => c.parentId === parentCategory.id && !isPromoCat(c)) : [];
  const mainCategories = initialMainCategories.filter((c) => !isPromoCat(c));

  const urlState = useMemo(() => parseCatalogUrl(searchParamsStr), [searchParamsStr]);
  const ctx = useMemo(() => ({
    categoryId: subCategory?.id || parentCategory?.id || null,
    categorySlug: !subCategory && !parentCategory && parentSlug && !isSearch ? parentSlug : null,
    search: searchQuery || undefined,
  }), [subCategory, parentCategory, parentSlug, isSearch, searchQuery]);

  const activeFilterCount = urlState.brands.length + Object.values(urlState.attrs).reduce((n, v) => n + v.length, 0)
    + (urlState.inStock ? 1 : 0) + (urlState.minPrice != null || urlState.maxPrice != null ? 1 : 0);

  useEffect(() => {
    const bike = localStorage.getItem('tg_selected_bike');
    if (bike) setSelectedBike(bike);
    const onPop = () => setSearchParamsStr(window.location.search.replace(/^\?/, ''));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // El panel de filtros a pantalla completa bloquea el scroll de la página.
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  // Productos y facetas con los mismos parámetros. La primera carga viene del servidor.
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (initialProducts) return;
    }
    const ctrl = new AbortController();
    (async () => {
      setIsLoading(true);
      try {
        const [res, filtersRes] = await Promise.all([
          fetch(`/api/catalog/products?${toApiParams(urlState, ctx)}`, { signal: ctrl.signal }),
          fetch(`/api/catalog/filters?${toApiParams(urlState, ctx, true)}`, { signal: ctrl.signal }),
        ]);
        if (filtersRes.ok) setFilterOptions(await filtersRes.json());
        if (!res.ok) {
          setProducts([]); setTotal(0); setTotalPages(0);
          return;
        }
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setTotal(Number(res.headers.get('X-WP-Total') || 0));
        setRefs(Number(res.headers.get('X-Total-Refs') || res.headers.get('X-WP-Total') || 0));
        setTotalPages(Number(res.headers.get('X-WP-TotalPages') || 0));
        setLoadedPage(urlState.page);
        setIsFuzzy(res.headers.get('X-Search-Fuzzy') === '1');
        const corr = res.headers.get('X-Search-Corrected');
        setCorrectedQuery(corr ? decodeURIComponent(corr) : null);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') console.warn('[CATALOG] Error cargando productos:', (e as Error)?.message);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join('/'), searchParamsStr]);

  const basePath = segments.length ? `/universales/${segments.join('/')}` : '/universales';

  const pushUrl = (params: URLSearchParams, scroll = true) => {
    const qs = params.toString();
    setSearchParamsStr(qs);
    window.history.pushState({}, '', qs ? `${basePath}?${qs}` : basePath);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = (updates: Partial<CatalogUrlState>) => {
    const next = { ...urlState, ...updates };
    const p = new URLSearchParams(searchParamsStr);
    const put = (k: string, v: string | null) => (v ? p.set(k, v) : p.delete(k));
    put('brands', next.brands.length ? next.brands.join(',') : null);
    put('minPrice', next.minPrice != null ? String(next.minPrice) : null);
    put('maxPrice', next.maxPrice != null ? String(next.maxPrice) : null);
    put('inStock', next.inStock ? '1' : null);
    put('attrs', attrsToParam(next.attrs));
    put('q', next.q || null);
    p.delete('page');
    pushUrl(p, !filtersOpen);
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

  // Móvil: "Ver más" añade la página siguiente sin perder lo ya visto.
  const loadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/catalog/products?${toApiParams({ ...urlState, page: loadedPage + 1 }, ctx)}`);
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts((prev) => [...prev, ...data.filter((p) => !prev.some((x) => x.id === p.id))]);
        setLoadedPage((n) => n + 1);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    if (parentCategory && !isSearch) applyFilters({ q: query.trim() });
    else window.location.href = query ? `/universales/buscar/${encodeURIComponent(query)}` : '/universales';
  };

  const title = isSearch
    ? `“${searchQuery}”`
    : subCategory?.name || parentCategory?.name || 'Catálogo';

  const removableChips: { key: string; label: string; remove: () => void }[] = [
    ...urlState.brands.map((b) => ({ key: `b:${b}`, label: b, remove: () => applyFilters({ brands: urlState.brands.filter((x) => x !== b) }) })),
    ...Object.entries(urlState.attrs).flatMap(([k, vals]) => vals.map((v) => ({
      key: `a:${k}:${v}`, label: `${k}: ${v}`, remove: () => applyFilters({ attrs: { ...urlState.attrs, [k]: vals.filter((x) => x !== v) } }),
    }))),
    ...(urlState.minPrice != null || urlState.maxPrice != null
      ? [{ key: 'price', label: `${urlState.minPrice ?? 0}–${urlState.maxPrice ?? '∞'} €`, remove: () => applyFilters({ minPrice: null, maxPrice: null }) }] : []),
    ...(urlState.inStock ? [{ key: 'stock', label: 'Con stock', remove: () => applyFilters({ inStock: false }) }] : []),
  ];

  const filtersPanel = (
    <CatalogFilters key={searchParamsStr} options={filterOptions} state={urlState} onChange={applyFilters} onClear={clearFilters} />
  );

  return (
    <div className="bg-background text-foreground flex flex-col font-sans min-h-screen">
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => { window.location.href = '/?openSelector=true'; }}
        onCartClick={() => { window.location.href = '/?tab=cart'; }}
        onTabChange={(tab) => { window.location.href = `/?tab=${tab}`; }}
      />

      <main className="flex-1 pb-28 md:pb-10">
        <div className="max-w-[1400px] mx-auto px-4 pt-4 md:pt-6 flex flex-col gap-4">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} initialValue={searchQuery || urlState.q} placeholder="¿Qué buscas? Ej.: casco, pastillas Brembo…" />

          {/* Migas + título */}
          <div className="flex flex-col gap-1">
            {(parentCategory || isSearch) && (
              <nav aria-label="Ruta" className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Link href="/universales" className="hover:text-foreground">Catálogo</Link>
                {subCategory && parentCategory && (
                  <>
                    <span aria-hidden="true">›</span>
                    <Link href={`/universales/${parentCategory.slug}`} className="hover:text-foreground">{parentCategory.name}</Link>
                  </>
                )}
              </nav>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl md:text-2xl font-semibold leading-tight">
                {isSearch ? <>Resultados para <span className="text-accent-text">{title}</span></> : title}
              </h1>
              {/* Cada tarjeta es un modelo; sus tallas y colores son referencias. */}
              <span className="text-xs text-text-muted shrink-0 text-right leading-tight">
                {total.toLocaleString('es-ES')} modelo{total !== 1 ? 's' : ''}
                {refs > total && <><br />{refs.toLocaleString('es-ES')} referencias</>}
              </span>
            </div>
          </div>

          {/* Navegación por categorías: carrusel en móvil, rejilla compacta en escritorio */}
          {!parentCategory && !isSearch && (
            <div className="-mx-4 px-4 flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-x-auto no-scrollbar snap-x md:mx-0 md:px-0">
              {mainCategories.map((cat) => {
                const Icon = CATEGORY_HD_ICONS[cat.id]?.icon || IconHerramientas;
                return (
                  <Link
                    key={cat.id}
                    href={`/universales/${cat.slug}`}
                    className="snap-start shrink-0 w-[84px] md:w-auto flex flex-col items-center gap-1.5 p-2 rounded-lg bg-card border border-card-border hover:border-accent text-center"
                  >
                    <span className="w-10 h-10 rounded-full bg-icon-box flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="text-[11px] leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {parentCategory && subcategories.length > 0 && (
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar md:mx-0 md:px-0 md:flex-wrap">
              <Link href={`/universales/${parentCategory.slug}`} className={`${chip} ${!subCategory ? chipOn : chipOff}`}>Todo</Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/universales/${parentCategory.slug}/${sub.slug}`}
                  className={`${chip} ${subCategory?.id === sub.id ? chipOn : chipOff}`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {/* Barra de herramientas: fija en móvil al hacer scroll */}
          <div className="sticky top-[57px] z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-card-border/60 flex items-center gap-2 md:static md:mx-0 md:px-0 md:border-0 md:bg-transparent">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-md border border-card-border bg-card text-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-5 h-5 px-1 rounded-full bg-accent text-slate-950 text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <label className="flex-1 md:flex-none md:ml-auto flex items-center gap-2 text-sm">
              <span className="sr-only md:not-sr-only text-text-muted text-xs">Ordenar</span>
              <select
                value={urlState.sort}
                onChange={(e) => setSort(e.target.value as CatalogSort)}
                className="w-full md:w-auto px-3 py-2 rounded-md border border-card-border bg-card text-sm cursor-pointer focus:outline-none focus:border-accent"
                aria-label="Ordenar productos"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          {removableChips.length > 0 && (
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar md:mx-0 md:px-0 md:flex-wrap">
              {removableChips.map((c) => (
                <button key={c.key} type="button" onClick={c.remove} className={`${chip} ${chipOff} flex items-center gap-1`}>
                  {c.label} <X className="w-3 h-3" aria-label="Quitar" />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="shrink-0 text-xs underline text-text-muted px-1">Limpiar</button>
            </div>
          )}

          {correctedQuery && !isLoading && products.length > 0 && (
            <p className="text-sm text-text-muted">Mostrando resultados para <strong className="text-foreground">“{correctedQuery}”</strong></p>
          )}
          {isFuzzy && !correctedQuery && !isLoading && products.length > 0 && (
            <p className="text-sm text-text-muted">No hay coincidencias exactas: mostrando resultados parecidos.</p>
          )}

          <div className="flex gap-6">
            <aside className="hidden md:block w-60 shrink-0 self-start sticky top-4">
              {filtersPanel}
            </aside>

            <section className="flex-1 min-w-0" aria-busy={isLoading}>
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card border border-card-border rounded-md p-3 animate-pulse flex flex-col gap-2">
                      <div className="aspect-square bg-icon-box/80 rounded" />
                      <div className="h-3 bg-icon-box rounded w-1/2" />
                      <div className="h-3 bg-icon-box rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-card-border rounded-md text-center px-6">
                  <Wrench className="w-10 h-10 text-text-muted" />
                  <p className="text-sm text-text-muted">
                    {hasActiveFilters(urlState)
                      ? 'Ningún producto cumple todos los filtros. Prueba a quitar alguno.'
                      : 'No hemos encontrado productos. Prueba con otras palabras o con la referencia del fabricante.'}
                  </p>
                  {hasActiveFilters(urlState) && (
                    <button type="button" onClick={clearFilters} className="text-sm underline">Quitar filtros</button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={(p) => addToCart(p)}
                        onNotifyMe={setNotifyProduct}
                        priority={idx < 4}
                      />
                    ))}
                  </div>

                  {/* Móvil: cargar más */}
                  {loadedPage < totalPages && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="md:hidden mt-5 w-full py-3 rounded-md border border-card-border bg-card text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Ver más productos ({Math.max(0, total - products.length).toLocaleString('es-ES')})
                    </button>
                  )}

                  {/* Escritorio: paginación */}
                  {totalPages > 1 && (
                    <div className="hidden md:flex items-center justify-center gap-3 mt-8">
                      <button
                        type="button"
                        disabled={urlState.page <= 1}
                        onClick={() => setPage(urlState.page - 1)}
                        className="p-2 border border-card-border rounded bg-card disabled:opacity-40 cursor-pointer"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-text-muted">Página {urlState.page} de {totalPages.toLocaleString('es-ES')}</span>
                      <button
                        type="button"
                        disabled={urlState.page >= totalPages}
                        onClick={() => setPage(urlState.page + 1)}
                        className="p-2 border border-card-border rounded bg-card disabled:opacity-40 cursor-pointer"
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Filtros en móvil: panel a pantalla completa con resultado en vivo */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-background flex flex-col" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
            <h2 className="text-base font-semibold">Filtros</h2>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros" className="p-2 -mr-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">{filtersPanel}</div>
          <div className="px-4 pt-3 border-t border-card-border" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <button
              type="button"
              onClick={() => { setFiltersOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full py-3 rounded-md bg-accent text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Ver {total.toLocaleString('es-ES')} modelo{total !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      <BottomNav activeTab="shop" onTabChange={(tab) => { window.location.href = `/?tab=${tab}`; }} selectedBike={selectedBike} />

      <NotifyMeModal
        isOpen={!!notifyProduct}
        onClose={() => setNotifyProduct(null)}
        productName={notifyProduct?.name || ''}
        productId={notifyProduct?.id || 0}
      />
    </div>
  );
}

export default function CatalogClient(props: Props) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CatalogContent {...props} />
    </Suspense>
  );
}

