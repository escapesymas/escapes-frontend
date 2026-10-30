'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, Search, Wrench, Flame, X } from 'lucide-react';
import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../../../components/ProductCard';
import NotifyMeModal from '../../../components/NotifyMeModal';
import { useCart } from '../../../context/CartContext';
import { SORT_OPTIONS } from '../../../lib/catalogParams';
import type { Product } from '../../../types';
import type { ManufacturerBrandLandingData } from '../../../lib/brandSeo';

interface Props {
  data: ManufacturerBrandLandingData;
  initialCategoryId: number | null;
  initialInStock: boolean;
  initialSort: string;
  initialQuery: string;
  faqs: { question: string; answer: string }[];
}

function getPaginationWindow(current: number, totalPages: number): (number | 'ellipsis-left' | 'ellipsis-right')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) items.push('ellipsis-left');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push('ellipsis-right');
  items.push(totalPages);
  return items;
}

export default function MarcaLandingClient({
  data,
  initialCategoryId,
  initialInStock,
  initialSort,
  initialQuery,
  faqs,
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedBike, setSelectedBike] = useState('');
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);

  useEffect(() => {
    const bike = localStorage.getItem('tg_selected_bike');
    if (bike) setSelectedBike(bike);
  }, []);

  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  const { brand, products, total, refs, totalPages, page, relatedBrands, compatibleMotos = [] } = data;
  const basePath = `/marcas/${brand.slug}`;

  const buildHref = (overrides: {
    page?: number;
    categoryId?: number | null;
    inStock?: boolean;
    sort?: string;
    q?: string;
  }) => {
    const p = new URLSearchParams();
    const nextCat = overrides.categoryId !== undefined ? overrides.categoryId : initialCategoryId;
    const nextStock = overrides.inStock !== undefined ? overrides.inStock : initialInStock;
    const nextSort = overrides.sort !== undefined ? overrides.sort : initialSort;
    const nextQ = overrides.q !== undefined ? overrides.q : initialQuery;
    const nextPage = overrides.page !== undefined ? overrides.page : page;

    if (nextCat && nextCat > 0) p.set('category_id', String(nextCat));
    if (nextStock) p.set('in_stock', '1');
    if (nextSort && nextSort !== 'relevance') p.set('sort', nextSort);
    if (nextQ && nextQ.trim()) p.set('q', nextQ.trim());
    if (nextPage && nextPage > 1) p.set('page', String(nextPage));

    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pageItems = useMemo(
    () => getPaginationWindow(page, Math.max(1, totalPages)),
    [page, totalPages],
  );

  const hasFilters = Boolean(initialCategoryId || initialInStock || initialQuery);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => { window.location.href = '/?openSelector=true'; }}
        onCartClick={() => { window.location.href = '/?tab=cart'; }}
        onTabChange={(tab) => { window.location.href = `/?tab=${tab}`; }}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-5 md:py-7 flex flex-col gap-6">
        {/* Cabecera de la marca */}
        <section className="p-5 md:p-6 rounded-xl bg-card border border-card-border flex flex-col gap-3">
          <nav aria-label="Ruta" className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span aria-hidden="true">›</span>
            <Link href="/marcas" className="hover:text-foreground">Marcas</Link>
            <span aria-hidden="true">›</span>
            <span className="text-foreground font-semibold">{brand.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {brand.isEscapeSpecialist
                    ? `Escapes y recambios ${brand.name} para moto`
                    : `Catálogo oficial ${brand.name} para moto`}
                  {page > 1 && <span className="text-base font-normal text-text-muted ml-2">· Página {page}</span>}
                </h1>
                {brand.isEscapeSpecialist && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 text-accent-text text-[11px] font-mono font-bold uppercase">
                    <Flame className="w-3 h-3" /> Especialista escapes
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                Explora {brand.modelCount.toLocaleString('es-ES')} modelos ({brand.productCount.toLocaleString('es-ES')} referencias) originales de <strong className="text-foreground">{brand.name}</strong>
                {brand.inStockCount > 0 ? `, con ${brand.inStockCount.toLocaleString('es-ES')} unidades disponibles en stock` : ''}.
                Envío gratis desde 200 € y garantía oficial de 3 años.
              </p>
            </div>

            <div className="text-xs font-mono text-text-muted shrink-0 md:text-right">
              <span className="text-foreground font-bold">{total.toLocaleString('es-ES')}</span> modelo{total !== 1 ? 's' : ''}
              {refs && refs > total ? <> · {refs.toLocaleString('es-ES')} ref.</> : null}
            </div>
          </div>

          {/* Especialidades por categoría (filtro dentro de la marca) */}
          {brand.topCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Link
                href={buildHref({ categoryId: null, page: 1 })}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  !initialCategoryId
                    ? 'bg-accent text-slate-950 border-accent font-semibold'
                    : 'bg-background text-foreground border-card-border hover:border-accent'
                }`}
              >
                Todo {brand.name}
              </Link>
              {brand.topCategories.map((cat) => {
                const active = initialCategoryId === cat.id;
                return (
                  <Link
                    key={cat.id}
                    href={buildHref({ categoryId: active ? null : cat.id, page: 1 })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-accent text-slate-950 border-accent font-semibold'
                        : 'bg-background text-foreground border-card-border hover:border-accent'
                    }`}
                  >
                    {cat.name} <span className="opacity-70">({cat.count})</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Barra de búsqueda interna, stock y ordenación */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(buildHref({ q: searchInput, page: 1 }));
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Buscar dentro de ${brand.name} (modelo, moto o referencia)…`}
              aria-label={`Buscar productos de ${brand.name}`}
              className="w-full pl-9 pr-8 py-2 rounded-md bg-card border border-card-border text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  router.push(buildHref({ q: '', page: 1 }));
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Link
              href={buildHref({ inStock: !initialInStock, page: 1 })}
              className={`px-3 py-2 rounded-md border text-xs font-mono transition-colors whitespace-nowrap ${
                initialInStock
                  ? 'bg-accent text-slate-950 border-accent font-bold'
                  : 'bg-card text-foreground border-card-border hover:border-accent'
              }`}
            >
              Solo en stock
            </Link>

            <select
              value={initialSort}
              onChange={(e) => router.push(buildHref({ sort: e.target.value, page: 1 }))}
              aria-label="Ordenar productos"
              className="px-3 py-2 rounded-md border border-card-border bg-card text-xs sm:text-sm cursor-pointer focus:outline-none focus:border-accent"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listado de productos */}
        {products.length === 0 ? (
          <div className="py-16 px-6 rounded-lg border border-dashed border-card-border flex flex-col items-center justify-center gap-3 text-center">
            <Wrench className="w-10 h-10 text-text-muted" />
            <p className="text-sm text-text-muted">
              No hay productos de {brand.name} que coincidan con los filtros seleccionados.
            </p>
            {hasFilters && (
              <Link href={basePath} className="text-xs font-mono font-bold text-accent-text hover:underline">
                Ver todo el catálogo de {brand.name}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => addToCart(p)}
                  onNotifyMe={setNotifyProduct}
                  priority={idx < 2}
                />
              ))}
            </div>

            {/* Paginación HTML rastreable (<a href>) */}
            {totalPages > 1 && (
              <nav aria-label={`Paginación de ${brand.name}`} className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    rel="prev"
                    className="p-2 border border-card-border rounded bg-card hover:border-accent transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="p-2 border border-card-border rounded bg-card opacity-40" aria-disabled="true">
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                )}

                {pageItems.map((item) => {
                  if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                    return (
                      <span key={item} className="px-2 py-1 text-xs text-text-muted select-none" aria-hidden="true">
                        …
                      </span>
                    );
                  }
                  const isCurrent = item === page;
                  return (
                    <Link
                      key={item}
                      href={buildHref({ page: item })}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`min-w-8 h-8 px-2.5 rounded border text-xs font-mono flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-accent text-slate-950 border-accent font-bold'
                          : 'bg-card text-foreground border-card-border hover:border-accent'
                      }`}
                    >
                      {item.toLocaleString('es-ES')}
                    </Link>
                  );
                })}

                {page < totalPages ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    rel="next"
                    className="p-2 border border-card-border rounded bg-card hover:border-accent transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="p-2 border border-card-border rounded bg-card opacity-40" aria-disabled="true">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}

        {/* Enlazado cruzado hacia categorías del catálogo y otras marcas similares */}
        <section
          className="mt-4 pt-6 border-t border-card-border flex flex-col gap-6"
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: 'auto none auto 260px',
          }}
        >
          {compatibleMotos.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  Motos más buscadas compatibles con {brand.name}
                </h2>
                <Link href="/escapes" className="text-xs font-mono font-bold text-accent-text hover:underline">
                  Catálogo por moto →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {compatibleMotos.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="p-3 rounded-lg bg-card border border-card-border hover:border-accent transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <span className="text-xs font-semibold text-foreground group-hover:text-accent-text transition-colors">
                      {m.fullName}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted mt-1.5 flex items-center justify-between">
                      <span>{m.escapeCount > 0 ? `${m.escapeCount} escapes` : `${m.productCount} piezas`}</span>
                      <span className="text-accent-text group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {brand.topCategories.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Categorías del catálogo donde destaca {brand.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {brand.topCategories.map((cat) => (
                  <Link
                    key={`cat-link-${cat.id}`}
                    href={cat.catalogHref}
                    className="px-3 py-1.5 rounded-md bg-card border border-card-border text-xs text-foreground hover:border-accent transition-colors"
                  >
                    {cat.parentName ? `${cat.parentName} › ${cat.name}` : cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedBrands.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  Otras marcas recomendadas
                </h2>
                <Link href="/marcas" className="text-xs font-mono font-bold text-accent-text hover:underline">
                  Todas las marcas →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedBrands.map((rb) => (
                  <Link
                    key={rb.slug}
                    href={`/marcas/${rb.slug}`}
                    className="px-3 py-1.5 rounded-md bg-card border border-card-border text-xs text-foreground hover:border-accent transition-colors"
                  >
                    {rb.name}{' '}
                    <span className="text-[10px] font-mono text-text-muted">
                      ({rb.modelCount.toLocaleString('es-ES')})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Preguntas frecuentes sobre {brand.name}
              </h2>
              <div className="divide-y divide-card-border rounded-lg border border-card-border bg-card">
                {faqs.map((f, idx) => (
                  <details key={f.question} name="marca-faq" open={idx === 0} className="group px-4">
                    <summary className="py-3.5 cursor-pointer list-none select-none flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                      <span>{f.question}</span>
                      <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="pb-4 text-xs text-text-muted leading-relaxed">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="pb-20 md:pb-0" />

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
