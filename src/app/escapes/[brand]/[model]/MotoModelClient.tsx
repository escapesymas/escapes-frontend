'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import Header from '../../../../components/Header';
import BottomNav from '../../../../components/BottomNav';
import ProductCard from '../../../../components/ProductCard';
import NotifyMeModal from '../../../../components/NotifyMeModal';
import MotoAlertButton from '../../../../components/MotoAlertButton';
import { useCart } from '../../../../context/CartContext';
import { useAuth } from '../../../../context/AuthContext';
import { trackEvent } from '../../../../lib/analytics';
import { effectivePrice } from '../../../../lib/pricing';
import {
  apiRequest,
  DELIVERY_ES,
  FREE_SHIPPING_MIN,
  parseBike,
  SHIPPING_COST,
} from '../../../../lib/constants';
import type { Product } from '../../../../types';
import type { MotoModelData } from '../../../../lib/motoSeo';

type EnrichedProduct = Product & {
  rootCategoryId?: number;
  rootCategoryName?: string;
  rootCategorySlug?: string;
};

interface MotoModelClientProps {
  data: MotoModelData;
  faqs: { question: string; answer: string }[];
}

const PAGE_SIZE = 24;
const subscribeNoop = () => () => {};
const getClientStoredBike = () => localStorage.getItem('tg_selected_bike') || '';
const getServerStoredBike = () => '';

export default function MotoModelClient({ data, faqs }: MotoModelClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, isAuthenticated, syncGarage } = useAuth();

  const { bike, categories, relatedModels } = data;
  const primaryEscapes = data.primaryEscapes as EnrichedProduct[];
  const escapeAccessories = data.escapeAccessories as EnrichedProduct[];
  const allProducts = data.products as EnrichedProduct[];

  const bikeGarageLabel = useMemo(
    () => `${bike.brand} ${bike.model}${bike.selectedYear ? ` (${bike.selectedYear})` : ''}`,
    [bike.brand, bike.model, bike.selectedYear]
  );

  const storedBike = useSyncExternalStore(subscribeNoop, getClientStoredBike, getServerStoredBike);
  const [overrideBike, setOverrideBike] = useState<string | null>(null);
  const selectedBike = overrideBike ?? storedBike;
  const savedInGarage = selectedBike.toUpperCase() === bikeGarageLabel.toUpperCase();

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showAllAccessories, setShowAllAccessories] = useState(false);
  const [notifyProduct, setNotifyProduct] = useState<Product | null>(null);

  const handleSaveToGarage = async () => {
    localStorage.setItem('tg_selected_bike', bikeGarageLabel);
    setOverrideBike(bikeGarageLabel);
    trackEvent.bikeSelected(bikeGarageLabel);

    if (isAuthenticated && user) {
      const current = Array.isArray(user.garage) ? user.garage : [];
      if (!current.includes(bikeGarageLabel)) {
        const nextList = [bikeGarageLabel, ...current];
        try {
          await syncGarage(nextList);
          const parsed = parseBike(bikeGarageLabel);
          if (parsed.brand && parsed.model) {
            await apiRequest('/garage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                brand: parsed.brand,
                model: parsed.model,
                year: parsed.year || bike.yearTo || new Date().getFullYear(),
              }),
            }).catch(() => {});
          }
        } catch {
          // Si falla la sincronización remota, queda activa en localStorage.
        }
      }
    } else {
      try {
        const raw = localStorage.getItem('tg_garage_history');
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(bikeGarageLabel)) {
          localStorage.setItem('tg_garage_history', JSON.stringify([bikeGarageLabel, ...list]));
        }
      } catch {
        localStorage.setItem('tg_garage_history', JSON.stringify([bikeGarageLabel]));
      }
    }
  };

  // Si ya mostramos los escapes arriba en su bloque protagonista, en el catálogo inferior
  // por defecto mostramos el resto de piezas (salvo que el usuario pulse el chip «Escapes»
  // o que no haya otros recambios).
  const nonEscapeCount = allProducts.length - data.escapes.length;

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = allProducts.filter((p) => {
      if (activeCategorySlug === 'all') {
        // Si hay escapes protagonistas arriba y existen otros recambios, no duplicamos las tarjetas de escapes abajo salvo búsqueda.
        if (!q && data.escapes.length > 0 && nonEscapeCount > 0 && p.rootCategorySlug === 'escapes') {
          return false;
        }
      } else if (p.rootCategorySlug !== activeCategorySlug) {
        return false;
      }

      if (onlyInStock) {
        const hasStock = p.family
          ? p.family.inStock !== false
          : p.inStock !== false && (p.stock ?? 0) > 0;
        if (!hasStock) return false;
      }

      if (q) {
        const hay = `${p.name} ${p.brand} ${p.sku} ${p.supplier_code || ''}`.toLowerCase();
        if (!q.split(/\s+/).every((tok) => hay.includes(tok))) return false;
      }

      return true;
    });

    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    }
    return list;
  }, [allProducts, activeCategorySlug, onlyInStock, searchText, sortBy, data.escapes.length, nonEscapeCount]);

  const yearSpanText =
    bike.yearFrom && bike.yearTo
      ? bike.yearFrom === bike.yearTo
        ? String(bike.yearFrom)
        : `${bike.yearFrom}–${bike.yearTo}`
      : '';

  const baseModelPath = `/escapes/${bike.brandSlug}/${bike.modelSlug}`;
  const visibleAccessories = showAllAccessories ? escapeAccessories : escapeAccessories.slice(0, 8);
  const hasTopEscapesSection = primaryEscapes.length > 0 || escapeAccessories.length > 0;

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
          <Link href={`/escapes/${bike.brandSlug}`} className="hover:text-foreground transition-colors">
            {bike.brandName}
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-foreground font-bold">
            {bike.model}
            {bike.selectedYear ? ` (${bike.selectedYear})` : ''}
          </span>
        </nav>

        {/* Hero del modelo */}
        <section className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-badge border border-badge-border text-badge-text font-mono text-[10px] font-bold uppercase tracking-wider">
                  <Check className="w-3 h-3 stroke-[3]" /> Compatibilidad verificada
                </span>
                {yearSpanText && (
                  <span className="px-2.5 py-0.5 rounded bg-background border border-card-border text-text-muted font-mono text-[10px] font-bold">
                    Años {yearSpanText}
                  </span>
                )}
              </div>

              <h1 className="font-mono font-black uppercase tracking-tight text-2xl sm:text-4xl text-foreground mb-2.5 leading-tight">
                {primaryEscapes.length > 0
                  ? `Escapes y Recambios para ${bike.brandName} ${bike.model}${bike.selectedYear ? ` (${bike.selectedYear})` : ''}`
                  : `Recambios y Accesorios para ${bike.brandName} ${bike.model}${bike.selectedYear ? ` (${bike.selectedYear})` : ''}`}
              </h1>

              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {primaryEscapes.length > 0
                  ? `Disponemos de ${primaryEscapes.length} ${primaryEscapes.length === 1 ? 'escape o silencioso específico' : 'escapes, silenciosos y colectores específicos'}${escapeAccessories.length > 0 ? `, ${escapeAccessories.length} accesorios de montaje` : ''} y un total de ${data.totalProducts} piezas compatibles con tu ${bike.brandName} ${bike.model}${bike.selectedYear ? ` del año ${bike.selectedYear}` : ''}.`
                  : `Catálogo de ${data.totalProducts} recambios y piezas verificadas compatibles con ${bike.brandName} ${bike.model}${bike.selectedYear ? ` (${bike.selectedYear})` : ''}.`}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Referencias cruzadas por código de chasis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-accent" /> Envío {SHIPPING_COST.toFixed(2).replace('.', ',')} € · Gratis desde {FREE_SHIPPING_MIN} € ({DELIVERY_ES})
                </span>
              </div>
            </div>

            {/* Botón Guardar en Mi Garaje */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveToGarage}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  savedInGarage
                    ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-accent text-slate-950 hover:bg-accent-hover'
                }`}
              >
                {savedInGarage ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Moto activa en Mi Garaje</span>
                  </>
                ) : (
                  <>
                    <Bike className="w-4 h-4" />
                    <span>Guardar en Mi Garaje</span>
                    <Plus className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono text-text-muted text-center lg:text-right">
                Filtra automáticamente compatibilidades en toda la tienda
              </span>
            </div>
          </div>

          {/* Selector de año del modelo (enlaces con rel="nofollow" para no indexar facetas ?year=) */}
          {bike.years.length > 1 && (
            <div className="mt-6 pt-5 border-t border-card-border/70">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-text-muted mr-1.5">
                  Filtrar por año:
                </span>
                <Link
                  href={baseModelPath}
                  scroll={false}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    !bike.selectedYear
                      ? 'bg-accent text-slate-950 font-bold'
                      : 'bg-background border border-card-border text-text-muted hover:text-foreground hover:border-accent/50'
                  }`}
                >
                  Todos
                </Link>
                {bike.years.map((yr) => {
                  const isSelected = bike.selectedYear === yr;
                  return (
                    <Link
                      key={yr}
                      href={`${baseModelPath}?year=${encodeURIComponent(yr)}`}
                      rel="nofollow"
                      scroll={false}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                        isSelected
                          ? 'bg-accent text-slate-950 font-bold'
                          : 'bg-background border border-card-border text-text-muted hover:text-foreground hover:border-accent/50'
                      }`}
                    >
                      {yr}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Estado sin stock publicado */}
        {data.totalProducts === 0 && (
          <section className="bg-card border border-card-border rounded-2xl p-8 text-center flex flex-col items-center gap-4">
            <Wrench className="w-8 h-8 text-accent" />
            <div className="max-w-md">
              <h2 className="font-mono font-bold text-base uppercase text-foreground mb-1">
                Sin referencias publicadas actualmente para {bike.brandName} {bike.model}
                {bike.selectedYear ? ` (${bike.selectedYear})` : ''}
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Activa una alerta gratuita para que te avisemos en cuanto entren escapes o recambios para este modelo, o consulta todos los modelos de {bike.brandName}.
              </p>
            </div>
            <MotoAlertButton bike={bikeGarageLabel} variant="primary" />
            {bike.selectedYear && (
              <Link
                href={baseModelPath}
                className="text-xs font-mono font-bold text-accent-text hover:underline"
              >
                Ver piezas de todos los años de {bike.brandName} {bike.model} →
              </Link>
            )}
          </section>
        )}

        {/* SECCIÓN PROTAGONISTA 1: Escapes completos, silenciosos y colectores */}
        {primaryEscapes.length > 0 && (
          <section aria-labelledby="escapes-principales-heading">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
              <div>
                <h2 id="escapes-principales-heading" className="font-mono font-bold text-base sm:text-xl uppercase text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent shrink-0" />
                  <span>
                    Escapes, silenciosos y colectores para {bike.brandName} {bike.model} ({primaryEscapes.length})
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Líneas completas, silenciosos homologados Euro 4 / Euro 5 para ITV y escapes deportivos compatibles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {primaryEscapes.map((product, idx) => (
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

        {/* Sub-bloque: Juntas, muelles y accesorios de escape compatibles */}
        {escapeAccessories.length > 0 && (
          <section aria-labelledby="accesorios-escape-heading">
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <div>
                <h2 id="accesorios-escape-heading" className="font-mono font-bold text-sm sm:text-base uppercase text-foreground">
                  Juntas, muelles y accesorios de escape para {bike.brandName} {bike.model} ({escapeAccessories.length})
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Recambios de estanqueidad y montaje específicos para el sistema de escape.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {visibleAccessories.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => addToCart(p)}
                  onNotifyMe={(p) => setNotifyProduct(p)}
                  priority={primaryEscapes.length === 0 && idx < 2}
                />
              ))}
            </div>

            {escapeAccessories.length > 8 && !showAllAccessories && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllAccessories(true)}
                  className="px-4 py-2 text-xs font-mono font-bold uppercase border border-card-border rounded-lg hover:border-accent cursor-pointer"
                >
                  Ver los {escapeAccessories.length} accesorios de escape
                </button>
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN 2: Todos los recambios compatibles por categoría */}
        {nonEscapeCount > 0 && (
          <section aria-labelledby="recambios-compatibles-heading" className="pt-2">
            <div className="mb-4">
              <h2 id="recambios-compatibles-heading" className="font-mono font-bold text-base sm:text-xl uppercase text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent shrink-0" />
                <span>
                  {hasTopEscapesSection
                    ? `Más recambios compatibles con ${bike.brandName} ${bike.model}`
                    : `Recambios compatibles con ${bike.brandName} ${bike.model} (${allProducts.length})`}
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Frenos, transmisión, filtros, motor, chasis y mantenimiento verificados para tu moto.
              </p>
            </div>

            {/* Chips de categoría */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug('all');
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeCategorySlug === 'all'
                      ? 'bg-accent text-slate-950 font-bold'
                      : 'bg-card border border-card-border text-text-muted hover:text-foreground hover:border-accent/50'
                  }`}
                >
                  {hasTopEscapesSection ? `Recambios (${nonEscapeCount})` : `Todos (${allProducts.length})`}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategorySlug(cat.slug);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      activeCategorySlug === cat.slug
                        ? 'bg-accent text-slate-950 font-bold'
                        : 'bg-card border border-card-border text-text-muted hover:text-foreground hover:border-accent/50'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}

            {/* Barra de búsqueda interna, stock y orden */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-card border border-card-border rounded-xl p-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder={`Buscar pieza para ${bike.brandName} ${bike.model} (ej. pastillas, filtro, batería)...`}
                  aria-label="Filtrar piezas compatibles"
                  className="w-full pl-8 pr-3 py-2 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <label className="inline-flex items-center gap-2 text-xs font-mono text-foreground cursor-pointer select-none px-2.5 py-2 rounded-lg bg-select-bg border border-card-border">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => {
                      setOnlyInStock(e.target.checked);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="accent-amber-400 rounded cursor-pointer"
                  />
                  <span>Solo en stock</span>
                </label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'price_asc' | 'price_desc')}
                  aria-label="Ordenar piezas"
                  className="px-3 py-2 bg-select-bg border border-card-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="default">Orden: Disponibilidad</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-card border border-card-border rounded-xl p-6 text-center">
                <p className="text-xs font-mono text-text-muted mb-3">
                  Ninguna pieza coincide con los filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug('all');
                    setOnlyInStock(false);
                    setSearchText('');
                  }}
                  className="px-4 py-2 bg-accent text-slate-950 font-mono font-bold text-xs uppercase rounded-lg cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.slice(0, visibleCount).map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(p) => addToCart(p)}
                      onNotifyMe={(p) => setNotifyProduct(p)}
                      priority={!hasTopEscapesSection && idx < 2}
                    />
                  ))}
                </div>

                {filteredProducts.length > visibleCount && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                      className="px-6 py-2.5 bg-card border border-card-border hover:border-accent rounded-xl text-xs font-mono font-bold uppercase text-foreground transition-colors cursor-pointer"
                    >
                      Mostrar más piezas ({filteredProducts.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Alerta de nuevas piezas para esta moto */}
        {data.totalProducts > 0 && (
          <section aria-label="Aviso de novedades para tu moto">
            <MotoAlertButton bike={bikeGarageLabel} variant="card" />
          </section>
        )}

        {/* Enlazado interno horizontal: otros modelos de la misma marca */}
        {relatedModels.length > 0 && (
          <section aria-labelledby="modelos-relacionados-heading" className="border-t border-card-border pt-8">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 id="modelos-relacionados-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground">
                Otros modelos de {bike.brandName}
              </h2>
              <Link
                href={`/escapes/${bike.brandSlug}`}
                className="text-xs font-mono font-bold text-accent-text hover:underline shrink-0"
              >
                Ver todos los modelos {bike.brandName} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {relatedModels.map((rm) => (
                <Link
                  key={rm.slug}
                  href={`/escapes/${bike.brandSlug}/${rm.slug}`}
                  className="group bg-card border border-card-border hover:border-accent/60 rounded-xl px-3.5 py-3 transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-foreground group-hover:text-accent-text transition-colors block truncate">
                      {bike.brandName} {rm.model}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted block">
                      {rm.yearFrom
                        ? `${rm.yearFrom}${rm.yearTo && rm.yearTo !== rm.yearFrom ? `–${rm.yearTo}` : ''}`
                        : 'Ver piezas'}
                      {rm.escapeCount > 0 ? ` · ${rm.escapeCount} esc.` : ''}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Preguntas frecuentes específicas del modelo con <details name="..."> nativo */}
        <section aria-labelledby="modelo-faq-heading" className="border-t border-card-border pt-8">
          <h2 id="modelo-faq-heading" className="font-mono font-bold text-base sm:text-lg uppercase text-foreground mb-4">
            Preguntas frecuentes sobre escapes y recambios para {bike.brandName} {bike.model}
          </h2>
          <div className="flex flex-col gap-2.5">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                name="moto-model-faq"
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
