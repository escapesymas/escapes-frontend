/**
 * Estado del catálogo en la URL ↔ parámetros de la API.
 * Lo usan la página del servidor y el cliente, para que ambos pidan lo mismo.
 *
 * URL: ?q=&page=&sort=&brands=a,b&minPrice=&maxPrice=&inStock=1&attrs={"Talla":["L","XL"]}
 */

export type CatalogSort = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'newest';

export const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'newest', label: 'Novedades' },
  { value: 'name_asc', label: 'Nombre: A-Z' },
];

export interface CatalogUrlState {
  q: string;
  page: number;
  sort: CatalogSort;
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  attrs: Record<string, string[]>;
}

export const PER_PAGE = 24;

function num(v: string | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function parseAttrs(raw: string | null): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw.startsWith('%') ? decodeURIComponent(raw) : raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const list = (Array.isArray(v) ? v : [v]).map(String).filter(Boolean);
      if (list.length) out[k] = list;
    }
    return out;
  } catch {
    return {};
  }
}

export function attrsToParam(attrs: Record<string, string[]>): string | null {
  const clean = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v.length > 0));
  return Object.keys(clean).length ? JSON.stringify(clean) : null;
}

export function parseCatalogUrl(input: string | URLSearchParams): CatalogUrlState {
  const p = typeof input === 'string' ? new URLSearchParams(input) : input;
  const sort = p.get('sort') as CatalogSort | null;
  return {
    q: (p.get('q') || '').trim(),
    page: Math.max(1, Number(p.get('page')) || 1),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as CatalogSort) : 'relevance',
    brands: (p.get('brands') || '').split(',').map((b) => b.trim()).filter(Boolean),
    minPrice: num(p.get('minPrice')),
    maxPrice: num(p.get('maxPrice')),
    inStock: p.get('inStock') === '1',
    attrs: parseAttrs(p.get('attrs')),
  };
}

/** Productos que se buscan por medida de neumático (ver TyreFinder). */
export type SizedKind = 'tyre' | 'tube' | 'mousse';
const KIND_LABEL: Record<SizedKind, string> = { tyre: 'Neumático', tube: 'Cámara', mousse: 'Mousse' };

/** Neumáticos (raíz y tipos), Cámaras y Mousses llevan buscador por medida; Accesorios no. */
export function sizedKindFor(parentSlug: string | null, subSlug: string | null): SizedKind | null {
  if (parentSlug !== 'neumaticos') return null;
  if (!subSlug) return 'tyre';
  if (/camara/i.test(subSlug)) return 'tube';
  if (/mousse/i.test(subSlug)) return 'mousse';
  if (/accesorio|valvula|fondo/i.test(subSlug)) return null;
  return 'tyre';
}

/** Ancho/Perfil/Llanta de la URL → la medida completa que guarda cada producto. */
function sizedAttrs(attrs: Record<string, string[]>, kind: SizedKind): Record<string, string[]> {
  const { Ancho, Perfil, Llanta, ...rest } = attrs;
  if (!Ancho?.[0] || !Llanta?.[0]) return attrs;
  const medida = `${Ancho[0]}${Perfil?.[0] ? `/${Perfil[0]}` : ''}-${Llanta[0]}`;
  if (kind !== 'tyre') delete rest['Posición'];
  return { ...rest, Medida: [medida], TipoMedida: [KIND_LABEL[kind]] };
}

/** Parámetros para /api/catalog/products (y /filters sin page/sort/per_page). */
export function toApiParams(
  state: CatalogUrlState,
  ctx: { categoryId?: number | null; categorySlug?: string | null; search?: string; sizedKind?: SizedKind | null },
  forFilters = false,
): URLSearchParams {
  const p = new URLSearchParams();
  if (!forFilters) {
    p.set('page', String(state.page));
    p.set('per_page', String(PER_PAGE));
    p.set('sort', state.sort);
  }
  const search = ctx.search || state.q;
  if (search) p.set('search', search);
  if (ctx.categoryId) p.set('category_id', String(ctx.categoryId));
  else if (ctx.categorySlug) p.set('category_slug', ctx.categorySlug);
  if (state.brands.length) p.set('brand', state.brands.join(','));
  if (state.minPrice != null) p.set('min_price', String(state.minPrice));
  if (state.maxPrice != null) p.set('max_price', String(state.maxPrice));
  if (state.inStock) p.set('in_stock', '1');
  const attrs = attrsToParam(ctx.sizedKind ? sizedAttrs(state.attrs, ctx.sizedKind) : state.attrs);
  if (attrs) p.set('attrs', attrs);
  return p;
}

export function hasActiveFilters(s: CatalogUrlState): boolean {
  return s.brands.length > 0 || s.inStock || s.minPrice != null || s.maxPrice != null || Object.keys(s.attrs).length > 0;
}

const COLOR_HEX: Record<string, string> = {
  negro: '#000', blanco: '#fff', rojo: '#ef4444', azul: '#3b82f6', verde: '#22c55e',
  gris: '#9ca3af', plata: '#c0c0c0', plateado: '#c0c0c0', amarillo: '#eab308',
  naranja: '#f97316', marron: '#92400e', violeta: '#a855f7', morado: '#a855f7',
  rosa: '#ec4899', dorado: '#d4af37', oro: '#d4af37', beige: '#d6c7a1', burdeos: '#7f1d1d',
};

/** Color aproximado para la muestra; "Negro & Rojo" usa el primero. */
export function colorSwatch(name: string): string {
  const first = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[&/,]| y /)[0].trim();
  const key = Object.keys(COLOR_HEX).find((k) => first.startsWith(k));
  return key ? COLOR_HEX[key] : 'transparent';
}
