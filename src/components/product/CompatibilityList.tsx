'use client';

import { useMemo, useState } from 'react';
import { CompatRow } from './compat';

interface Props {
  rows: CompatRow[];
}

const PAGE = 12;

/**
 * Compatibilidades agrupadas por marca + modelo con sus años en una línea
 * (en lugar de una tabla de 5 columnas con scroll lateral en móvil).
 */
export default function CompatibilityList({ rows }: Props) {
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE);

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim();
    const map = new Map<string, { brand: string; model: string; cc: string; years: Set<string> }>();
    for (const r of rows) {
      const hay = `${r.brand} ${r.model} ${r.year} ${r.cc}`.toLowerCase();
      if (q && !q.split(/\s+/).every((t) => hay.includes(t))) continue;
      const key = `${r.brand}|${r.model}|${r.cc}`;
      const g = map.get(key) || { brand: r.brand, model: r.model, cc: r.cc, years: new Set<string>() };
      if (r.year) g.years.add(r.year);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
  }, [rows, query]);

  const yearRange = (years: Set<string>) => {
    const ys = [...years].map(Number).filter(Boolean).sort((a, b) => a - b);
    if (!ys.length) return '';
    // Años consecutivos como rango: 2008-2012, 2015
    const parts: string[] = [];
    let start = ys[0];
    let prev = ys[0];
    for (const y of ys.slice(1).concat(Number.NaN)) {
      if (y === prev + 1) { prev = y; continue; }
      parts.push(start === prev ? String(start) : `${start}-${prev}`);
      start = y;
      prev = y;
    }
    return parts.join(', ');
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setVisible(PAGE); }}
        placeholder="Busca tu moto (marca, modelo o año)"
        aria-label="Buscar moto compatible"
        className="w-full px-3 py-2 bg-select-bg border border-card-border rounded text-sm placeholder:text-text-muted text-foreground focus:outline-none focus:border-accent/60"
      />
      {groups.length === 0 ? (
        <p className="text-xs text-text-muted py-2">Ningún vehículo coincide con la búsqueda.</p>
      ) : (
        <ul className="divide-y divide-card-border border border-card-border rounded">
          {groups.slice(0, visible).map((g) => (
            <li key={`${g.brand}|${g.model}|${g.cc}`} className="px-3 py-2 flex items-baseline justify-between gap-3">
              <span className="text-sm text-foreground">
                <span className="font-semibold">{g.brand}</span> {g.model}
                {g.cc && <span className="text-text-muted text-xs"> · {g.cc} cc</span>}
              </span>
              <span className="text-xs font-mono text-text-muted text-right shrink-0">{yearRange(g.years)}</span>
            </li>
          ))}
        </ul>
      )}
      {groups.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE * 2)}
          className="self-center px-4 py-2 text-xs font-mono font-bold uppercase border border-card-border rounded hover:border-accent cursor-pointer"
        >
          Ver más ({groups.length - visible})
        </button>
      )}
    </div>
  );
}
