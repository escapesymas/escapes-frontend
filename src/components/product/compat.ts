import { ProductCompatibility } from '../../types';
import { parseBike } from '../../lib/constants';

export interface CompatRow {
  brand: string;
  model: string;
  year: string;
  cc: string;
}

/** Normaliza las dos formas en que llega la compatibilidad (objeto o texto). */
export function normalizeCompat(comp: ProductCompatibility): CompatRow {
  if (typeof comp === 'object' && comp !== null) {
    return {
      brand: comp.brand || '',
      model: comp.model || '',
      year: comp.year ? String(comp.year) : '',
      cc: comp.cc ? String(comp.cc) : '',
    };
  }
  const str = String(comp).trim();
  const yearMatch = str.match(/\((\d{4})\)$/);
  const noYear = yearMatch ? str.replace(/\((\d{4})\)$/, '').trim() : str;
  const ccMatch = noYear.match(/\[(\d+)\]$/);
  const full = ccMatch ? noYear.replace(/\[(\d+)\]$/, '').trim() : noYear;
  const [brand, ...rest] = full.split(' ');
  return { brand: brand || '', model: rest.join(' '), year: yearMatch?.[1] || '', cc: ccMatch?.[1] || '' };
}

const clean = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** ¿La moto guardada por el cliente aparece en la lista de compatibilidad? */
export function fitsBike(rows: CompatRow[], bike: string): boolean | null {
  const b = parseBike(bike);
  if (!b.brand || !b.model || rows.length === 0) return null;
  const brand = clean(b.brand);
  const model = clean(b.model);
  return rows.some((r) =>
    clean(r.brand) === brand &&
    (clean(r.model).startsWith(model) || model.startsWith(clean(r.model))) &&
    (!b.year || !r.year || r.year === String(b.year))
  );
}

export function bikeLabel(bike: string): string {
  const b = parseBike(bike);
  return [b.brand, b.model, b.year].filter(Boolean).join(' ');
}
