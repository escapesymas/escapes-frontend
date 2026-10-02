'use client';

import { useState } from 'react';
import { FilterOptions } from '../../types';
import { CatalogUrlState, colorSwatch } from '../../lib/catalogParams';

type Updates = Partial<Pick<CatalogUrlState, 'brands' | 'minPrice' | 'maxPrice' | 'inStock' | 'attrs'>>;

interface Props {
  options: FilterOptions | null;
  state: CatalogUrlState;
  onChange: (updates: Updates) => void;
  onClear: () => void;
}

const heading = 'text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2 pb-1 border-b border-card-border/60';
const checkRow = 'flex items-center gap-2 text-[10px] font-mono uppercase cursor-pointer hover:text-accent-text text-foreground bg-transparent border-0 p-0 text-left w-full min-h-[24px]';
const checkbox = 'rounded border-card-border bg-select-bg text-accent w-3 h-3 pointer-events-none';

/** Valores visibles por sección antes de "Ver todos" (en la raíz del catálogo hay
 *  cientos de marcas y colores: pintarlos todos eran ~1.300 botones en el HTML). */
const VISIBLE = 12;

function MoreButton({ total, open, onClick }: { total: number; open: boolean; onClick: () => void }) {
  if (total <= VISIBLE) return null;
  return (
    <button type="button" onClick={onClick} className="mt-1.5 text-[10px] font-mono text-accent-text hover:underline bg-transparent border-0 p-0 cursor-pointer text-left">
      {open ? 'Ver menos' : `Ver todos (${total})`}
    </button>
  );
}

function Count({ n }: { n?: number }) {
  return n != null ? <span className="ml-auto text-text-muted tabular-nums">{n}</span> : null;
}

export default function CatalogFilters({ options, state, onChange, onClear }: Props) {
  const [brandQuery, setBrandQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }));
  // Los valores marcados siempre visibles, aunque queden fuera de los primeros.
  const visible = <T,>(key: string, list: T[], isActive: (x: T) => boolean): T[] =>
    expanded[key] || list.length <= VISIBLE ? list : [...list.slice(0, VISIBLE), ...list.slice(VISIBLE).filter(isActive)];
  const [minInput, setMinInput] = useState(state.minPrice != null ? String(state.minPrice) : '');
  const [maxInput, setMaxInput] = useState(state.maxPrice != null ? String(state.maxPrice) : '');

  const brandCounts = new Map((options?.brand_counts || []).map((b) => [b.value, b.count]));
  const brands = (options?.brands || [])
    .filter((b) => !brandQuery || b.toLowerCase().includes(brandQuery.toLowerCase()));
  // Las marcas seleccionadas siempre visibles, aunque ya no tengan resultados.
  for (const b of state.brands) if (!brands.includes(b)) brands.unshift(b);

  const toggleBrand = (brand: string) => {
    const next = state.brands.includes(brand) ? state.brands.filter((b) => b !== brand) : [...state.brands, brand];
    onChange({ brands: next });
  };

  const toggleAttr = (key: string, value: string) => {
    const current = state.attrs[key] || [];
    const nextValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ attrs: { ...state.attrs, [key]: nextValues } });
  };

  const applyPrice = () => {
    const min = minInput.trim() === '' ? null : Math.max(0, Math.round(Number(minInput)));
    const max = maxInput.trim() === '' ? null : Math.max(0, Math.round(Number(maxInput)));
    onChange({ minPrice: Number.isFinite(min as number) ? min : null, maxPrice: Number.isFinite(max as number) ? max : null });
  };

  const attrEntries = Object.entries(options?.attribute_counts || {}).length
    ? Object.entries(options!.attribute_counts!)
    : Object.entries(options?.attributes || {}).map(([k, vals]) => [k, vals.map((value) => ({ value, count: undefined as number | undefined }))] as const);

  return (
    <div className="flex flex-col gap-5">
      {/* Tallas y colores primero: es lo que más filtra en equipación */}
      {attrEntries.map(([key, allValues]) => {
        const values = visible(`a:${key}`, [...allValues], (v) => (state.attrs[key] || []).includes(v.value));
        return (
        <div key={key}>
          <h4 className={heading}>{key}</h4>
          {key === 'Talla' || key === 'Tamaño' ? (
            <div className="flex flex-wrap gap-1.5">
              {values.map(({ value, count }) => {
                const active = (state.attrs[key] || []).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleAttr(key, value)}
                    aria-pressed={active}
                    title={count != null ? `${count} modelos` : undefined}
                    className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                      active ? 'bg-accent text-slate-950 border-accent' : 'bg-card text-text-muted border-card-border hover:border-accent hover:text-foreground'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1 no-scrollbar">
              {values.map(({ value, count }) => {
                const active = (state.attrs[key] || []).includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleAttr(key, value)} aria-pressed={active} className={checkRow}>
                    <input type="checkbox" checked={active} readOnly tabIndex={-1} className={checkbox} />
                    {key === 'Color' && (
                      <span className="inline-block w-3 h-3 rounded-full border border-card-border shrink-0" style={{ backgroundColor: colorSwatch(value) }} />
                    )}
                    <span className="truncate normal-case">{value}</span>
                    <Count n={count} />
                  </button>
                );
              })}
            </div>
          )}
          <MoreButton total={allValues.length} open={!!expanded[`a:${key}`]} onClick={() => toggle(`a:${key}`)} />
        </div>
        );
      })}

      <div>
        <h4 className={heading}>Marcas</h4>
        {brands.length > 8 && (
          <input
            type="search"
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Buscar marca…"
            aria-label="Buscar marca"
            className="w-full mb-2 px-2 py-1 text-[10px] font-mono bg-select-bg border border-card-border rounded focus:outline-none focus:border-accent"
          />
        )}
        {brands.length === 0 ? (
          <p className="text-[10px] font-mono text-text-muted">No hay marcas para estos filtros.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
            {visible('brands', brands, (b) => state.brands.includes(b)).map((brand) => {
              const active = state.brands.includes(brand);
              return (
                <button key={brand} type="button" onClick={() => toggleBrand(brand)} aria-pressed={active} className={checkRow}>
                  <input type="checkbox" checked={active} readOnly tabIndex={-1} className={checkbox} />
                  <span className="truncate">{brand}</span>
                  <Count n={brandCounts.get(brand)} />
                </button>
              );
            })}
          </div>
        )}
        <MoreButton total={brands.length} open={!!expanded.brands} onClick={() => toggle('brands')} />
      </div>

      <div>
        <h4 className={heading}>Precio (€)</h4>
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
        >
          <input
            type="number" inputMode="numeric" min={0} value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder={String(options?.price_min ?? 0)} aria-label="Precio mínimo"
            className="w-full px-2 py-1 text-[10px] font-mono bg-select-bg border border-card-border rounded focus:outline-none focus:border-accent"
          />
          <span className="text-text-muted text-[10px]">–</span>
          <input
            type="number" inputMode="numeric" min={0} value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder={String(options?.price_max ?? '')} aria-label="Precio máximo"
            className="w-full px-2 py-1 text-[10px] font-mono bg-select-bg border border-card-border rounded focus:outline-none focus:border-accent"
          />
          <button type="submit" className="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded bg-accent text-slate-950 cursor-pointer">
            OK
          </button>
        </form>
      </div>

      <button type="button" onClick={() => onChange({ inStock: !state.inStock })} aria-pressed={state.inStock} className={checkRow}>
        <input type="checkbox" checked={state.inStock} readOnly tabIndex={-1} className={checkbox} />
        Solo con stock
      </button>

      <button
        type="button"
        onClick={onClear}
        className="w-full py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-center text-text-muted hover:text-foreground border border-dashed border-card-border rounded bg-transparent cursor-pointer"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
