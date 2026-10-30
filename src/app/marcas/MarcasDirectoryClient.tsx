'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Flame, ShieldCheck, Wrench, ChevronDown, ArrowRight } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import type { ManufacturerBrandsDirectory, ManufacturerBrandEntry } from '../../lib/brandSeo';

interface Props {
  directory: ManufacturerBrandsDirectory | null;
  faqs: { question: string; answer: string }[];
}

export default function MarcasDirectoryClient({ directory, faqs }: Props) {
  const [selectedBike, setSelectedBike] = useState('');
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string>('ALL');

  useEffect(() => {
    const bike = localStorage.getItem('tg_selected_bike');
    if (bike) setSelectedBike(bike);
  }, []);

  const allBrands = useMemo(() => directory?.brands || [], [directory]);
  const escapeBrands = useMemo(() => directory?.escapeBrands || [], [directory]);
  const featuredGearBrands = useMemo(
    () => (directory?.featuredBrands || []).filter((b) => !b.isEscapeSpecialist),
    [directory],
  );

  const groupedByLetter = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allBrands.filter((b) => {
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.brand.toLowerCase().includes(q) ||
        b.topCategories.some((c) => c.name.toLowerCase().includes(q))
      );
    });

    const groups = new Map<string, ManufacturerBrandEntry[]>();
    for (const b of filtered) {
      const ch = b.name.charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(ch) ? ch : '#';
      const arr = groups.get(letter) || [];
      arr.push(b);
      groups.set(letter, arr);
    }
    return [...groups.entries()].sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  }, [allBrands, query]);

  const letters = useMemo(() => groupedByLetter.map(([l]) => l), [groupedByLetter]);

  const visibleGroups = useMemo(() => {
    if (activeLetter === 'ALL' || query.trim()) return groupedByLetter;
    return groupedByLetter.filter(([l]) => l === activeLetter);
  }, [groupedByLetter, activeLetter, query]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => { window.location.href = '/?openSelector=true'; }}
        onCartClick={() => { window.location.href = '/?tab=cart'; }}
        onTabChange={(tab) => { window.location.href = `/?tab=${tab}`; }}
      />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 md:py-8 flex flex-col gap-8">
        {/* Cabecera SEO + buscador instantáneo de marca */}
        <section className="p-5 md:p-7 rounded-xl bg-card border border-card-border flex flex-col gap-4">
          <nav aria-label="Ruta" className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span aria-hidden="true">›</span>
            <span className="text-foreground font-semibold">Marcas</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Marcas de escapes, recambios y equipamiento de moto
              </h1>
              <p className="text-sm text-text-muted leading-relaxed">
                Trabajamos con <strong className="text-foreground">{(directory?.totalBrands || 214).toLocaleString('es-ES')} fabricantes oficiales</strong> de sistemas de escape homologados, frenos, transmisión, motor, neumáticos y equipamiento para motorista, con stock actualizado en tiempo real y garantía de 3 años.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-mono shrink-0">
              <Link
                href="/escapes"
                className="px-3.5 py-2 rounded-md bg-accent text-slate-950 font-bold hover:bg-accent-hover transition-colors flex items-center gap-1.5"
              >
                Buscar por mi moto <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/universales"
                className="px-3.5 py-2 rounded-md border border-card-border bg-background text-foreground hover:border-accent transition-colors"
              >
                Ver catálogo completo
              </Link>
            </div>
          </div>

          <div className="relative max-w-xl mt-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveLetter('ALL');
              }}
              placeholder="Filtra por fabricante o especialidad (ej.: IXIL, Yasuni, Brembo, cascos…)"
              aria-label="Filtrar marcas"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-card-border text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </section>

        {/* Especialistas en sistemas de escape */}
        {!query.trim() && escapeBrands.length > 0 && (
          <section aria-labelledby="escape-manufacturers-heading" className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent-text shrink-0" />
              <h2 id="escape-manufacturers-heading" className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Fabricantes especialistas en escapes y silenciosos
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {escapeBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/marcas/${b.slug}`}
                  className="group p-3.5 rounded-lg bg-card border border-card-border hover:border-accent transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-foreground group-hover:text-accent-text transition-colors">
                      {b.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent-text font-semibold shrink-0">
                      {b.escapeCount} esc.
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {b.modelCount.toLocaleString('es-ES')} modelo{b.modelCount !== 1 ? 's' : ''}
                    {b.inStockCount > 0 ? ` · ${b.inStockCount.toLocaleString('es-ES')} en stock` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Marcas destacadas de recambios, frenos, cascos y neumáticos */}
        {!query.trim() && featuredGearBrands.length > 0 && (
          <section aria-labelledby="featured-gear-brands-heading" className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-text shrink-0" />
              <h2 id="featured-gear-brands-heading" className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Marcas líderes en frenos, transmisión, neumáticos y equipamiento
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {featuredGearBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/marcas/${b.slug}`}
                  className="group p-3.5 rounded-lg bg-card border border-card-border hover:border-accent transition-all flex flex-col justify-between gap-1.5"
                >
                  <span className="font-mono font-bold text-sm text-foreground group-hover:text-accent-text transition-colors">
                    {b.name}
                  </span>
                  {b.topCategories[0] && (
                    <span className="text-[11px] text-text-muted line-clamp-1">
                      {b.topCategories.slice(0, 2).map((c) => c.name).join(' · ')}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-text-muted">
                    {b.modelCount.toLocaleString('es-ES')} modelos · {b.inStockCount.toLocaleString('es-ES')} en stock
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Índice alfabético A-Z completo (bajo el pliegue con content-visibility: auto) */}
        <section
          aria-labelledby="all-brands-az-heading"
          className="flex flex-col gap-4"
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: 'auto none auto 520px',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-accent-text shrink-0" />
              <h2 id="all-brands-az-heading" className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Índice alfabético completo ({allBrands.length.toLocaleString('es-ES')} fabricantes)
              </h2>
            </div>

            {!query.trim() && letters.length > 1 && (
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar por letra inicial">
                <button
                  type="button"
                  onClick={() => setActiveLetter('ALL')}
                  className={`px-2 py-1 rounded text-[11px] font-mono border cursor-pointer ${
                    activeLetter === 'ALL'
                      ? 'bg-accent text-slate-950 border-accent font-bold'
                      : 'bg-card text-text-muted border-card-border hover:text-foreground'
                  }`}
                >
                  Todas
                </button>
                {letters.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveLetter(l)}
                    className={`w-7 h-7 rounded text-[11px] font-mono border cursor-pointer flex items-center justify-center ${
                      activeLetter === l
                        ? 'bg-accent text-slate-950 border-accent font-bold'
                        : 'bg-card text-text-muted border-card-border hover:text-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visibleGroups.length === 0 ? (
            <div className="p-10 rounded-lg border border-dashed border-card-border text-center text-sm text-text-muted">
              No hemos encontrado ninguna marca con «{query}».
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {visibleGroups.map(([letter, list]) => (
                <div key={letter} className="flex flex-col gap-2.5">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-text border-b border-card-border pb-1">
                    {letter}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {list.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/marcas/${b.slug}`}
                        className="px-3 py-2 rounded-md bg-card border border-card-border hover:border-accent transition-colors flex items-baseline justify-between gap-2"
                      >
                        <span className="text-xs font-medium text-foreground truncate">{b.name}</span>
                        <span className="text-[10px] font-mono text-text-muted shrink-0">
                          {b.modelCount.toLocaleString('es-ES')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preguntas frecuentes con <details name="marcas-faq"> accesible a buscar en la página */}
        {faqs.length > 0 && (
          <section aria-labelledby="marcas-faq-heading" className="pt-4 border-t border-card-border flex flex-col gap-3">
            <h2 id="marcas-faq-heading" className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
              Preguntas frecuentes sobre nuestras marcas y fabricantes
            </h2>
            <div className="divide-y divide-card-border rounded-lg border border-card-border bg-card">
              {faqs.map((f, idx) => (
                <details key={f.question} name="marcas-faq" open={idx === 0} className="group px-4">
                  <summary className="py-3.5 cursor-pointer list-none select-none flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                    <span>{f.question}</span>
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-xs text-text-muted leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="pb-20 md:pb-0" />

      <BottomNav activeTab="shop" onTabChange={(tab) => { window.location.href = `/?tab=${tab}`; }} selectedBike={selectedBike} />
    </div>
  );
}
