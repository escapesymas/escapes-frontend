'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RotateCcw } from 'lucide-react';

export const TYRE_KEYS = ['Ancho', 'Perfil', 'Llanta', 'Posición'] as const;

interface Option { value: string; count: number }
interface TyreOptions {
  ancho: Option[];
  perfil: Option[];
  llanta: Option[];
  posicion: Option[];
  tipos: { id: number; name: string; slug: string; count: number }[];
  popular: { label: string; ancho: string; perfil: string | null; llanta: string }[];
  total: number;
}

interface Props {
  rootSlug: string;
  /** Tipo elegido (subcategoría) o null = todos */
  typeSlug: string | null;
  categoryId: number | null;
  attrs: Record<string, string[]>;
  /** Query actual, para conservar la medida al cambiar de tipo */
  queryString: string;
  onChange: (attrs: Record<string, string[]>) => void;
}

/** "Delantero" en la URL incluye los mixtos (delantero/trasero). */
const POSITION_VALUES: Record<string, string[]> = {
  Delantero: ['Delantero', 'Delantero/trasero'],
  Trasero: ['Trasero', 'Delantero/trasero'],
};

function widthGroup(v: string): string {
  if (/x/i.test(v)) return 'Quad / ATV (pulgadas)';
  if (/^[A-Z]/i.test(v)) return 'Alfanumérica';
  if (/\./.test(v)) return 'En pulgadas';
  return 'Métrica (mm)';
}

const tyreLabel = (a?: string, p?: string, l?: string) =>
  a ? `${a}${p ? `/${p}` : ''}${l ? `-${l}` : ''}` : '';

/** Medida completa: ancho + llanta (el perfil solo cuando la medida lo tiene). */
export function tyreSizeComplete(attrs: Record<string, string[]>): boolean {
  return !!attrs.Ancho?.[0] && !!attrs.Llanta?.[0];
}

export default function TyreFinder({ rootSlug, typeSlug, categoryId, attrs, queryString, onChange }: Props) {
  const ancho = attrs.Ancho?.[0] || '';
  const perfil = attrs.Perfil?.[0] || '';
  const llanta = attrs.Llanta?.[0] || '';
  const posicion = attrs['Posición']?.includes('Delantero') ? 'Delantero' : attrs['Posición']?.includes('Trasero') ? 'Trasero' : '';
  const [opts, setOpts] = useState<TyreOptions | null>(null);
  const [loadedKey, setLoadedKey] = useState('');

  const query = new URLSearchParams(Object.entries({
    category_id: categoryId ? String(categoryId) : '', ancho, perfil, llanta, posicion,
  }).filter(([, v]) => v)).toString();
  const loading = loadedKey !== query;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/catalog/tyres/options?${query}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setOpts(d); setLoadedKey(query); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [query]);

  const set = (next: { Ancho?: string; Perfil?: string; Llanta?: string; Posición?: string }) => {
    const merged = { Ancho: ancho, Perfil: perfil, Llanta: llanta, Posición: posicion, ...next };
    const out: Record<string, string[]> = { ...attrs };
    for (const k of TYRE_KEYS) delete out[k];
    if (merged.Ancho) out.Ancho = [merged.Ancho];
    if (merged.Perfil) out.Perfil = [merged.Perfil];
    if (merged.Llanta) out.Llanta = [merged.Llanta];
    if (merged['Posición']) out['Posición'] = POSITION_VALUES[merged['Posición']] || [merged['Posición']];
    onChange(out);
  };

  const perfilOptions = ancho ? opts?.perfil || [] : [];
  const needsPerfil = !!ancho && perfilOptions.length > 0;
  const llantaEnabled = !!ancho && (!needsPerfil || !!perfil);

  // Anchos agrupados por sistema de medida.
  const groups = new Map<string, Option[]>();
  for (const o of opts?.ancho || []) {
    const g = widthGroup(o.value);
    (groups.get(g) || groups.set(g, []).get(g)!).push(o);
  }
  const groupOrder = ['Métrica (mm)', 'En pulgadas', 'Alfanumérica', 'Quad / ATV (pulgadas)'];

  const typeHref = (slug: string | null) => `/universales/${rootSlug}${slug ? `/${slug}` : ''}${queryString ? `?${queryString}` : ''}`;
  const select = 'w-full h-11 px-2 rounded-md border border-card-border bg-select-bg text-sm cursor-pointer focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed';
  const label = 'text-[11px] font-semibold text-text-muted mb-1 block';
  const chip = 'shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap cursor-pointer';
  const chipOn = 'bg-accent text-slate-950 border-accent font-semibold';
  const chipOff = 'bg-card text-foreground border-card-border hover:border-accent';
  const complete = tyreSizeComplete(attrs);

  return (
    <section className="rounded-lg border border-card-border bg-card p-3 md:p-4 flex flex-col gap-3" aria-label="Buscador de neumáticos">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold leading-tight">
            {complete ? <>Neumáticos <span className="text-accent-text">{tyreLabel(ancho, perfil, llanta)}</span></> : 'Busca tu neumático por medida'}
          </h2>
          {!complete && (
            <p className="text-xs text-text-muted mt-0.5">
              La medida está en el flanco: en <strong className="text-foreground">120/70 ZR17</strong> el ancho es 120, el perfil 70 y la llanta 17.
            </p>
          )}
        </div>
        {(ancho || posicion) && (
          <button
            type="button"
            onClick={() => set({ Ancho: '', Perfil: '', Llanta: '', Posición: '' })}
            className="shrink-0 flex items-center gap-1 text-xs text-text-muted hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Borrar
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="tyre-ancho" className={label}>1. Ancho</label>
          <select
            id="tyre-ancho"
            value={ancho}
            onChange={(e) => set({ Ancho: e.target.value, Perfil: '', Llanta: '' })}
            className={select}
          >
            <option value="">Elegir</option>
            {groupOrder.filter((g) => groups.has(g)).map((g) => (
              <optgroup key={g} label={g}>
                {groups.get(g)!.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tyre-perfil" className={label}>2. Perfil</label>
          <select
            id="tyre-perfil"
            value={perfil}
            disabled={!needsPerfil}
            onChange={(e) => set({ Perfil: e.target.value, Llanta: '' })}
            className={select}
          >
            <option value="">{ancho && !needsPerfil && !loading ? 'Sin perfil' : 'Elegir'}</option>
            {perfilOptions.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tyre-llanta" className={label}>3. Llanta</label>
          <select
            id="tyre-llanta"
            value={llanta}
            disabled={!llantaEnabled}
            onChange={(e) => set({ Llanta: e.target.value })}
            className={select}
          >
            <option value="">Elegir</option>
            {(llantaEnabled ? opts?.llanta || [] : []).map((o) => (
              <option key={o.value} value={o.value}>{o.value}&quot; ({o.count})</option>
            ))}
          </select>
        </div>
      </div>

      {!ancho && (opts?.popular?.length || 0) > 0 && (
        <div>
          <span className={label}>Medidas más habituales</span>
          <div className="-mx-3 px-3 flex gap-2 overflow-x-auto no-scrollbar md:mx-0 md:px-0 md:flex-wrap">
            {opts!.popular.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set({ Ancho: p.ancho, Perfil: p.perfil || '', Llanta: p.llanta })}
                className={`${chip} ${chipOff} font-mono`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className={label}>Posición</span>
        <div className="flex gap-2">
          {[['', 'Indiferente'], ['Delantero', 'Delantero'], ['Trasero', 'Trasero']].map(([v, text]) => (
            <button
              key={v || 'all'}
              type="button"
              aria-pressed={posicion === v}
              onClick={() => set({ Posición: v })}
              className={`${chip} ${posicion === v ? chipOn : chipOff}`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Tipo de neumático</span>
        <div className="-mx-3 px-3 flex gap-2 overflow-x-auto no-scrollbar md:mx-0 md:px-0 md:flex-wrap">
          <Link href={typeHref(null)} className={`${chip} ${!typeSlug ? chipOn : chipOff}`}>Todos</Link>
          {(opts?.tipos || [])
            .filter((t) => t.count > 0 || t.slug === typeSlug)
            .map((t) => (
              <Link key={t.id} href={typeHref(t.slug)} className={`${chip} ${t.slug === typeSlug ? chipOn : chipOff}`}>
                {t.name.replace(/^Neumáticos\s+/i, '')}
                {ancho && <span className="ml-1 opacity-70">{t.count}</span>}
              </Link>
            ))}
        </div>
      </div>

      {!complete && (
        <p className="text-xs text-text-muted flex items-center gap-1.5" aria-live="polite">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {ancho
            ? `${(opts?.total ?? 0).toLocaleString('es-ES')} neumáticos con ancho ${ancho}. Completa la medida para verlos.`
            : 'Elige la medida para ver los neumáticos disponibles.'}
        </p>
      )}
    </section>
  );
}
