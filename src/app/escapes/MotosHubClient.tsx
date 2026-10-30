'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bike, Search, ChevronRight, ShieldCheck, Truck, Flame, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { getApiUrl, DELIVERY_ES, FREE_SHIPPING_MIN, SHIPPING_COST } from '../../lib/constants';
import {
  MotosHubData,
  MotoModelSummary,
  POPULAR_HOME_MOTOS,
} from '../../lib/motoSeo';
import { slugifyManufacturerBrand, isExcludedSupplierBrand } from '../../lib/brandSeo';

interface MotosHubClientProps {
  hub: MotosHubData | null;
  faqs: { question: string; answer: string }[];
}

const subscribeNoop = () => () => {};
const getClientStoredBike = () => localStorage.getItem('tg_selected_bike') || '';
const getServerStoredBike = () => '';

export default function MotosHubClient({ hub, faqs }: MotosHubClientProps) {
  const router = useRouter();
  const selectedBike = useSyncExternalStore(subscribeNoop, getClientStoredBike, getServerStoredBike);
  const [brandFilter, setBrandFilter] = useState('');
  const [pickedBrandSlug, setPickedBrandSlug] = useState('');
  const [pickedModelSlug, setPickedModelSlug] = useState('');
  const [brandModels, setBrandModels] = useState<MotoModelSummary[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const handleBrandChange = (slug: string) => {
    setPickedBrandSlug(slug);
    setPickedModelSlug('');
    if (!slug) {
      setBrandModels([]);
      setLoadingModels(false);
      return;
    }
    setLoadingModels(true);
    fetch(getApiUrl(`/catalog/motos/${encodeURIComponent(slug)}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.models) ? (data.models as MotoModelSummary[]) : [];
        setBrandModels(list.filter((m) => m.hasProducts));
      })
      .catch(() => {
        setBrandModels([]);
      })
      .finally(() => {
        setLoadingModels(false);
      });
  };

  const brands = useMemo(() => hub?.brands ?? [], [hub]);

  const filteredBrands = useMemo(() => {
    const q = brandFilter.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q)
    );
  }, [brands, brandFilter]);

  const handleQuickNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickedBrandSlug && pickedModelSlug) {
      router.push(`/escapes/${pickedBrandSlug}/${pickedModelSlug}`);
    } else if (pickedBrandSlug) {
      router.push(`/escapes/${pickedBrandSlug}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-8">
      <Header selectedBike={selectedBike} />

      <main className="container mx-auto px-4 md:px-6 py-6 max-w-6xl flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-foreground font-bold">Escapes por Moto</span>
        </nav>

        {/* Hero + Selector rápido Marca -> Modelo */}
        <section className="relative overflow-hidden bg-card border border-card-border rounded-2xl p-6 sm:p-10 shadow-lg">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/15 border border-accent/40 text-accent-text font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
              <Bike className="w-3.5 h-3.5" /> Compatibilidad verificada por modelo y año
            </span>
            <h1 className="font-mono font-black uppercase tracking-tight text-2xl sm:text-4xl text-foreground mb-3 leading-tight">
              Escapes y Recambios por Marca y Modelo de Moto
            </h1>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed mb-6 max-w-2xl">
              Encuentra escapes completos, silenciosos homologados Euro 4 / Euro 5 para ITV, colectores y recambios específicos compatibles con tu moto.
              {hub ? ` Catálogo activo para ${hub.totalActiveModels.toLocaleString('es-ES')} modelos de ${hub.totalActiveBrands} marcas.` : ''}
            </p>

            {/* Selector rápido directo a la landing del modelo */}
            <form
              onSubmit={handleQuickNavigate}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-background/70 border border-card-border rounded-xl p-3"
            >
              <div className="sm:col-span-4">
                <label htmlFor="moto-hub-brand" className="sr-only">
                  Marca de moto
                </label>
                <select
                  id="moto-hub-brand"
                  value={pickedBrandSlug}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full h-10 px-3 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="">1. Elige marca ({brands.length || 'todas'})</option>
                  {brands.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name} ({b.activeModelCount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label htmlFor="moto-hub-model" className="sr-only">
                  Modelo de moto
                </label>
                <select
                  id="moto-hub-model"
                  value={pickedModelSlug}
                  onChange={(e) => setPickedModelSlug(e.target.value)}
                  disabled={!pickedBrandSlug || loadingModels}
                  className="w-full h-10 px-3 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground disabled:opacity-50 focus:outline-none focus:border-accent"
                >
                  <option value="">
                    {!pickedBrandSlug
                      ? '2. Elige modelo'
                      : loadingModels
                      ? 'Cargando modelos...'
                      : `2. Elige modelo (${brandModels.length})`}
                  </option>
                  {brandModels.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.model}
                      {m.yearFrom ? ` (${m.yearFrom}${m.yearTo && m.yearTo !== m.yearFrom ? `-${m.yearTo}` : ''})` : ''}
                      {m.escapeCount > 0 ? ` · ${m.escapeCount} escapes` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={!pickedBrandSlug}
                  className="w-full h-10 px-4 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Ver piezas</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Garantías */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Homologación ITV disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-accent" /> Envío {SHIPPING_COST.toFixed(2).replace('.', ',')} € · Gratis desde {FREE_SHIPPING_MIN} € ({DELIVERY_ES})
              </span>
            </div>
          </div>
        </section>

        {/* Modelos más buscados (SSR links directos) */}
        <section aria-labelledby="modelos-populares-heading">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 id="modelos-populares-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-accent" /> Motos más buscadas
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Acceso directo a los escapes y recambios compatibles con las motos más populares en España.
              </p>
            </div>
            <Link
              href="/universales/escapes"
              className="text-xs font-mono font-bold text-accent-text hover:underline shrink-0"
            >
              Ver catálogo general de escapes →
            </Link>
          </div>

          {hub && hub.featuredModels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {hub.featuredModels.slice(0, 16).map((m) => (
                <Link
                  key={`${m.brandSlug}-${m.modelSlug}`}
                  href={`/escapes/${m.brandSlug}/${m.modelSlug}`}
                  className="group bg-card border border-card-border hover:border-accent/60 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 shadow-sm flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-accent-text block">
                      {m.brandName}
                    </span>
                    <span className="font-mono font-bold text-sm text-foreground group-hover:text-accent-text transition-colors block mt-0.5">
                      {m.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-card-border/50">
                    <span>
                      {m.yearFrom
                        ? `${m.yearFrom}${m.yearTo && m.yearTo !== m.yearFrom ? `–${m.yearTo}` : ''}`
                        : 'Todos los años'}
                    </span>
                    {m.escapeCount > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {m.escapeCount} {m.escapeCount === 1 ? 'escape' : 'escapes'}
                      </span>
                    ) : (
                      <span>Recambios</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {POPULAR_HOME_MOTOS.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group bg-card border border-card-border hover:border-accent/60 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 shadow-sm flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-accent-text block">
                      {m.brandName}
                    </span>
                    <span className="font-mono font-bold text-sm text-foreground group-hover:text-accent-text transition-colors block mt-0.5">
                      {m.model}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{m.tag}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Marcas fabricantes de escapes */}
        {hub && hub.topEscapeBrands.length > 0 && (
          <section aria-labelledby="fabricantes-escapes-heading" className="bg-card/60 border border-card-border rounded-xl p-5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 id="fabricantes-escapes-heading" className="font-mono font-bold text-xs uppercase tracking-wider text-text-muted">
                Fabricantes de escapes y colectores en catálogo
              </h2>
              <Link href="/marcas" className="text-xs font-mono font-bold text-accent-text hover:underline shrink-0">
                Ver todas las marcas →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {hub.topEscapeBrands
                .filter((eb) => !isExcludedSupplierBrand(eb.brand))
                .map((eb) => (
                  <Link
                    key={eb.brand}
                    href={`/marcas/${slugifyManufacturerBrand(eb.brand)}`}
                    className="px-3 py-1.5 rounded-lg bg-card border border-card-border hover:border-accent text-xs font-mono text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="font-bold">{eb.brand}</span>
                    <span className="text-[10px] text-text-muted">({eb.count})</span>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Directorio completo de marcas de moto (SSR crawlable) */}
        <section aria-labelledby="todas-marcas-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 id="todas-marcas-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground">
                Todas las marcas de moto ({brands.length})
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Selecciona la marca de tu moto para ver todos sus modelos con escapes y recambios compatibles.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="Filtrar marca (ej. Yamaha)..."
                aria-label="Filtrar marca de moto"
                className="w-full pl-8 pr-3 py-2 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {filteredBrands.length === 0 ? (
            <p className="text-xs font-mono text-text-muted py-6 text-center bg-card border border-card-border rounded-xl">
              No hay ninguna marca que coincida con «{brandFilter}».
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/escapes/${b.slug}`}
                  className="group bg-card border border-card-border hover:border-accent/60 rounded-lg px-3.5 py-3 transition-all flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-foreground group-hover:text-accent-text transition-colors truncate">
                      {b.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                    <span>{b.activeModelCount} modelos</span>
                    {b.escapeProductCount > 0 && (
                      <span className="text-accent-text font-bold">{b.escapeProductCount} esc.</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Preguntas frecuentes con <details name="..."> nativo para buscabilidad e indexación */}
        <section aria-labelledby="escapes-faq-heading" className="border-t border-card-border pt-8">
          <h2 id="escapes-faq-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground mb-4">
            Preguntas frecuentes sobre escapes homologados y compatibilidad
          </h2>
          <div className="flex flex-col gap-2.5">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                name="escapes-hub-faq"
                open={idx === 0}
                className="group bg-card border border-card-border rounded-xl px-4 py-3"
              >
                <summary className="font-mono font-bold text-xs sm:text-sm text-foreground cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{faq.question}</span>
                  <ChevronDown className="w-4 h-4 text-text-muted group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-3 pt-3 border-t border-card-border/60">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <BottomNav
        activeTab="catalog"
        onTabChange={(tab) => router.push(tab === 'shop' ? '/' : `/?tab=${tab}`)}
        selectedBike={selectedBike}
      />
    </div>
  );
}
