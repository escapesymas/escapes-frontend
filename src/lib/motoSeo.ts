import type { Product } from '../types';

export interface MotoBrandSummary {
  brand: string;
  name: string;
  slug: string;
  yearFrom: number | null;
  yearTo: number | null;
  modelCount: number;
  activeModelCount: number;
  escapeModelCount: number;
  escapeProductCount: number;
  isPopular: boolean;
}

export interface MotoModelSummary {
  model: string;
  slug: string;
  years: string[];
  yearFrom: number | null;
  yearTo: number | null;
  hasProducts: boolean;
  escapeCount: number;
}

export interface MotoFeaturedModel {
  brand: string;
  brandName: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  yearFrom: number | null;
  yearTo: number | null;
  escapeCount: number;
}

export interface MotosHubData {
  totalActiveBrands: number;
  totalActiveModels: number;
  totalEscapeModels: number;
  totalEscapeProducts: number;
  brands: MotoBrandSummary[];
  featuredModels: MotoFeaturedModel[];
  topEscapeBrands: { brand: string; count: number }[];
}

export interface MotoBrandData {
  brand: MotoBrandSummary;
  models: MotoModelSummary[];
  featuredEscapes: Product[];
}

export type MotoBrandApiResponse =
  | { missing: true }
  | { redirectTo: string }
  | MotoBrandData;

export interface MotoCategoryGroup {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface MotoRelatedModel {
  model: string;
  slug: string;
  yearFrom: number | null;
  yearTo: number | null;
  escapeCount: number;
}

export interface MotoModelData {
  bike: {
    brand: string;
    brandName: string;
    brandSlug: string;
    model: string;
    modelSlug: string;
    years: string[];
    yearFrom: number | null;
    yearTo: number | null;
    selectedYear: string | null;
  };
  primaryEscapes: Product[];
  escapeAccessories: Product[];
  escapes: Product[];
  categories: MotoCategoryGroup[];
  products: Product[];
  totalProducts: number;
  totalEscapes: number;
  totalPrimaryEscapes: number;
  relatedModels: MotoRelatedModel[];
}

export type MotoModelApiResponse =
  | { missing: true }
  | { redirectTo: string }
  | MotoModelData;

export interface SitemapMotosResponse {
  brands: { slug: string; escapeModelCount: number }[];
  models: { brandSlug: string; modelSlug: string; escapeCount: number }[];
}

/** Slug limpio en minúsculas con guiones («HARLEY DAVIDSON» → «harley-davidson»). */
export function slugifyMoto(text: unknown): string {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BRAND_DISPLAY_OVERRIDES: Record<string, string> = {
  BMW: 'BMW',
  KTM: 'KTM',
  SYM: 'SYM',
  MBK: 'MBK',
  SWM: 'SWM',
  PGO: 'PGO',
  BSA: 'BSA',
  DKW: 'DKW',
  MZ: 'MZ',
  NSU: 'NSU',
  LML: 'LML',
  ATK: 'ATK',
  CPI: 'CPI',
  TGB: 'TGB',
  UM: 'UM',
  CFMOTO: 'CFMoto',
  'CF MOTO': 'CFMoto',
  'HARLEY DAVIDSON': 'Harley-Davidson',
  'HARLEY-DAVIDSON': 'Harley-Davidson',
  'MV AGUSTA': 'MV Agusta',
  'TM RACING': 'TM Racing',
  'CAN AM': 'Can-Am',
  'CAN-AM': 'Can-Am',
  'SKI-DOO': 'Ski-Doo',
  'GAS GAS': 'Gas Gas',
  GASGAS: 'GasGas',
  KYMCO: 'Kymco',
  'QJ MOTOR': 'QJ Motor',
};

export function formatBrandDisplay(brand: string): string {
  const upper = String(brand || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (BRAND_DISPLAY_OVERRIDES[upper]) return BRAND_DISPLAY_OVERRIDES[upper];
  if (upper.length <= 3 && /^[A-Z0-9]+$/.test(upper)) return upper;
  return upper
    .toLowerCase()
    .replace(/(^|[\s-])([a-z0-9])/g, (_, sep, ch) => `${sep}${ch.toUpperCase()}`);
}

/**
 * Las 160 marcas reales del catálogo de motos. Sirve para enlazar desde la tabla
 * de compatibilidad de 94.000 fichas de producto solo cuando existe página de
 * marca válida (cero enlaces 404).
 */
export const CATALOG_BRAND_SLUGS = new Set<string>([
  'adly','aeon','ajp','aktiv','aprilia','arctic-cat','ariic','audi','baotian','barossa',
  'belassi','benelli','berria','beta','bh','bimota','bmw','brixton','buell','bulls',
  'bultaco','cagiva','can-am','cannondale','ccm','cectek','cf-moto','china-motor','conway','cpi',
  'cyclone','daelim','derbi','dinli','ducati','e-framer','e-ton','easy-watts-motorcycles','energica','evo-set',
  'factory','fantic','franco-morini','fulgur','garelli','gas-gas','generic','genuine','gilera','goes',
  'govecs','harley-davidson','hm','honda','hrd','hupper','husaberg','husqvarna','hyosung','hytrack',
  'indian','italjet','john-deere','kawasaki','keeway','kove','ktm','kymco','lambretta','laverda',
  'lem','linhai','lml','lynx','macbor','maico','malaguti','masai','mash','mbk',
  'mendiz','mh','minarelli','mitt','mmr','montesa','morbidelli','moto-gac','moto-guzzi','moto-morini',
  'motobecane','motor-hispania','muz','mv-agusta','mz','neco','niu','norton','ockelbo','ossa',
  'peugeot','pgo','piaggio','polaris','polini','puch','qingqi','qj-motor','quadro','quadzilla',
  'rex','rieju','rotax','royal-enfield','sachs','scomadi','scorpa','scutum','sea-doo','seat',
  'she-lung','sherco','siamoto','silence','simson','ski-doo','skyteam','specialized','stark-future','super-soco',
  'surron','suzuki','swm','sym','talaria','tgb','thok','tm-racing','tomos','triton',
  'triumph','trrs','um','valenti-racing','vent','vertemati','vertigo','vespa','voge','vor',
  'voxan','wet-jet','whistle','wottan','wt-motors','yamaha','ycf','zero-motorcycles','zontes','zundapp',
]);

const BRAND_SLUG_ALIASES: Record<string, string> = {
  harleydavidson: 'harley-davidson',
  harley: 'harley-davidson',
  cfmoto: 'cf-moto',
  gasgas: 'gas-gas',
  canam: 'can-am',
  mvagusta: 'mv-agusta',
  royalenfield: 'royal-enfield',
  motoguzzi: 'moto-guzzi',
  motomorini: 'moto-morini',
  qjmotor: 'qj-motor',
};

/** Devuelve el slug canónico de marca si existe en el catálogo, o null si no. */
export function resolveKnownBrandSlug(brand: string): string | null {
  const s = slugifyMoto(brand);
  if (!s) return null;
  if (CATALOG_BRAND_SLUGS.has(s)) return s;
  const compact = s.replace(/-/g, '');
  if (BRAND_SLUG_ALIASES[s]) return BRAND_SLUG_ALIASES[s];
  if (BRAND_SLUG_ALIASES[compact]) return BRAND_SLUG_ALIASES[compact];
  return null;
}

/** Modelos de mayor demanda en España para enlazado interno SSR desde la portada. */
export const POPULAR_HOME_MOTOS = [
  { brandName: 'Yamaha', model: 'MT-07', href: '/escapes/yamaha/mt-07', tag: 'Hyper Naked' },
  { brandName: 'Kawasaki', model: 'Z 900', href: '/escapes/kawasaki/z-900', tag: 'Supernaked' },
  { brandName: 'Yamaha', model: 'MT-09', href: '/escapes/yamaha/mt-09', tag: 'Hyper Naked' },
  { brandName: 'Honda', model: 'CB 650 R', href: '/escapes/honda/cb-650-r', tag: 'Neo Sports' },
  { brandName: 'Yamaha', model: 'T-MAX 560', href: '/escapes/yamaha/t-max-560', tag: 'Maxi Scooter' },
  { brandName: 'Honda', model: 'PCX 125', href: '/escapes/honda/pcx-125', tag: 'Scooter 125' },
  { brandName: 'KTM', model: '125 Duke', href: '/escapes/ktm/125-duke', tag: 'Naked 125' },
  { brandName: 'BMW', model: 'R 1250 GS', href: '/escapes/bmw/r-1250-gs', tag: 'Adventure' },
  { brandName: 'Honda', model: 'CBR 650 R', href: '/escapes/honda/cbr-650-r', tag: 'Supersport' },
  { brandName: 'Kawasaki', model: 'Z 800', href: '/escapes/kawasaki/z-800', tag: 'Naked' },
  { brandName: 'Yamaha', model: 'T-MAX 530', href: '/escapes/yamaha/t-max-530', tag: 'Maxi Scooter' },
  { brandName: 'Aprilia', model: 'SR 50', href: '/escapes/aprilia/sr-50', tag: '50 cc 2T' },
] as const;

/** Marcas destacadas para el pie de página (SSR en todas las URLs de la tienda). */
export const POPULAR_FOOTER_BRANDS = [
  { name: 'Yamaha', href: '/escapes/yamaha' },
  { name: 'Honda', href: '/escapes/honda' },
  { name: 'Kawasaki', href: '/escapes/kawasaki' },
  { name: 'BMW', href: '/escapes/bmw' },
  { name: 'KTM', href: '/escapes/ktm' },
  { name: 'Suzuki', href: '/escapes/suzuki' },
  { name: 'Ducati', href: '/escapes/ducati' },
  { name: 'Aprilia', href: '/escapes/aprilia' },
  { name: 'Triumph', href: '/escapes/triumph' },
  { name: 'Harley-Davidson', href: '/escapes/harley-davidson' },
] as const;

function getServerApiBase(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.escapesymas.com').replace(/\/$/, '');
}

export async function fetchMotosHub(): Promise<MotosHubData | null> {
  try {
    const res = await fetch(`${getServerApiBase()}/api/catalog/motos`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return (await res.json()) as MotosHubData;
  } catch {
    return null;
  }
}

export async function fetchMotoBrand(brandSlug: string): Promise<MotoBrandApiResponse> {
  try {
    const res = await fetch(
      `${getServerApiBase()}/api/catalog/motos/${encodeURIComponent(brandSlug)}`,
      { next: { revalidate: 1800 } }
    );
    if (res.status === 404) return { missing: true };
    if (!res.ok) return { missing: true };
    return (await res.json()) as MotoBrandApiResponse;
  } catch {
    return { missing: true };
  }
}

export async function fetchMotoModel(
  brandSlug: string,
  modelSlug: string,
  year?: string
): Promise<MotoModelApiResponse> {
  try {
    const qs = year && /^\d{4}$/.test(year) ? `?year=${encodeURIComponent(year)}` : '';
    const res = await fetch(
      `${getServerApiBase()}/api/catalog/motos/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}${qs}`,
      { next: { revalidate: 600 } }
    );
    if (res.status === 404) return { missing: true };
    if (!res.ok) return { missing: true };
    return (await res.json()) as MotoModelApiResponse;
  } catch {
    return { missing: true };
  }
}

export async function fetchSitemapMotos(): Promise<SitemapMotosResponse | null> {
  try {
    const res = await fetch(`${getServerApiBase()}/api/catalog/sitemap-motos`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SitemapMotosResponse;
  } catch {
    return null;
  }
}
