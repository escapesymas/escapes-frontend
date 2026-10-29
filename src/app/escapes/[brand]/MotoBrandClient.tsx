'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, Bike, ArrowLeft, Flame } from 'lucide-react';
import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import ProductCard from '../../../components/ProductCard';
import NotifyMeModal from '../../../components/NotifyMeModal';
import { useCart } from '../../../context/CartContext';
import type { Product } from '../../../types';
import type { MotoBrandData } from '../../../lib/motoSeo';
import { DELIVERY_ES, FREE_SHIPPING_MIN } from '../../../lib/constants';

interface MotoBrandClientProps {
  data: MotoBrandData;
}

const subscribeNoop = () => () => {};
const getClientStoredBike = () => localStorage.getItem('tg_selected_bike') || '';
const getServerStoredBike = () => '';

export default function MotoBrandClient({ data }: MotoBrandClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const selectedBike = useSyncExternalStore(subscribeNoop, getClientStoredBike, getServerStoredBike);
  const [query, setQuery] = useState('');
  const [onlyWithEscapes, setOnlyWithEscapes] = useState(false);
  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);

  const { brand, models, featuredEscapes } = data;

  const activeModels = useMemo(
    () => models.filter((m) => m.hasProducts),
    [models]
  );

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeModels.filter((m) => {
      if (onlyWithEscapes && m.escapeCount === 0) return false;
      if (!q) return true;
      const hay = `${m.model} ${m.yearFrom || ''} ${m.yearTo || ''}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [activeModels, query, onlyWithEscapes]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-8">
      <Header selectedBike={selectedBike} />

      <main className="container mx-auto px-4 md:px-6 py-6 max-w-6xl flex flex-col gap-9">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link href="/escapes" className="hover:text-foreground transition-colors">
            Escapes por Moto
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-foreground font-bold">{brand.name}</span>
        </nav>

        {/* Cabecera de marca */}
        <section className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent-text font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
                <Bike className="w-3.5 h-3.5" /> Catálogo oficial compatible {brand.name}
              </span>
              <h1 className="font-mono font-black uppercase tracking-tight text-2xl sm:text-4xl text-foreground mb-2">
                Escapes y Recambios para {brand.name}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Selecciona tu modelo de {brand.name} para ver todos los escapes homologados ITV, silenciosos, colectores y recambios específicos compatibles con su año de fabricación.
                {' '}Envío gratis desde {FREE_SHIPPING_MIN} € ({DELIVERY_ES}).
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
              <div className="px-3 py-2 rounded-lg bg-background border border-card-border text-center">
                <span className="block text-base font-bold text-foreground">{activeModels.length}</span>
                <span className="text-[10px] text-text-muted uppercase">Modelos</span>
              </div>
              {brand.escapeProductCount > 0 && (
                <div className="px-3 py-2 rounded-lg bg-background border border-card-border text-center">
                  <span className="block text-base font-bold text-accent-text">{brand.escapeProductCount}</span>
                  <span className="text-[10px] text-text-muted uppercase">Escapes</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Escapes destacados para esta marca */}
        {featuredEscapes.length > 0 && (
          <section aria-labelledby="escapes-destacados-marca">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 id="escapes-destacados-marca" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent" /> Escapes destacados compatibles con {brand.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredEscapes.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => addToCart(p)}
                  onNotifyMe={(p) => setNotifyProduct(p)}
                  priority={idx < 2}
                />
              ))}
            </div>
          </section>
        )}

        {/* Listado completo de modelos de la marca (enlaces SSR indexables) */}
        <section aria-labelledby="modelos-marca-heading">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 id="modelos-marca-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground">
                Elige tu modelo de {brand.name} ({filteredModels.length})
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Haz clic en tu modelo para filtrar escapes y piezas por año exacto.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {brand.escapeModelCount > 0 && (
                <div className="inline-flex rounded-lg border border-card-border bg-card p-0.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setOnlyWithEscapes(false)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      !onlyWithEscapes
                        ? 'bg-accent text-slate-950 font-bold'
                        : 'text-text-muted hover:text-foreground'
                    }`}
                  >
                    Todos ({activeModels.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyWithEscapes(true)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      onlyWithEscapes
                        ? 'bg-accent text-slate-950 font-bold'
                        : 'text-text-muted hover:text-foreground'
                    }`}
                  >
                    Con escapes ({brand.escapeModelCount})
                  </button>
                </div>
              )}

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Buscar modelo ${brand.name}...`}
                  aria-label={`Buscar modelo de ${brand.name}`}
                  className="w-full pl-8 pr-3 py-2 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {filteredModels.length === 0 ? (
            <div className="bg-card border border-card-border rounded-xl p-6 text-center">
              <p className="text-xs font-mono text-text-muted mb-3">
                No hemos encontrado ningún modelo de {brand.name} que coincida con tu filtro.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setOnlyWithEscapes(false);
                }}
                className="px-4 py-2 bg-accent text-slate-950 font-mono font-bold text-xs uppercase rounded-lg cursor-pointer"
              >
                Mostrar todos los modelos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredModels.map((m) => (
                <Link
                  key={m.slug}
                  href={`/escapes/${brand.slug}/${m.slug}`}
                  className="group bg-card border border-card-border hover:border-accent/60 rounded-xl px-4 py-3 transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-foreground group-hover:text-accent-text transition-colors block truncate">
                      {brand.name} {m.model}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted block mt-0.5">
                      {m.yearFrom
                        ? `Años ${m.yearFrom}${m.yearTo && m.yearTo !== m.yearFrom ? `–${m.yearTo}` : ''}`
                        : 'Todos los años'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.escapeCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent-text text-[10px] font-mono font-bold">
                        {m.escapeCount} {m.escapeCount === 1 ? 'escape' : 'escapes'}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="pt-2">
          <Link
            href="/escapes"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a todas las marcas de moto
          </Link>
        </div>
      </main>

      <NotifyMeModal
        isOpen={!!notifyProduct}
        onClose={() => setNotifyProduct(null)}
        productName={notifyProduct?.name || ''}
        productId={notifyProduct?.id || 0}
      />

      <BottomNav
        activeTab="catalog"
        onTabChange={(tab) => router.push(tab === 'shop' ? '/' : `/?tab=${tab}`)}
        selectedBike={selectedBike}
      />
    </div>
  );
}
