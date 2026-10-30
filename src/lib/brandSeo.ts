import type { Product } from '../types';

export interface BrandCategorySummary {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  parentSlug: string | null;
  count: number;
  catalogHref: string;
}

export interface ManufacturerBrandEntry {
  brand: string;
  name: string;
  slug: string;
  productCount: number;
  modelCount: number;
  inStockCount: number;
  escapeCount: number;
  isEscapeSpecialist: boolean;
  isFeatured: boolean;
  topCategories: BrandCategorySummary[];
}

export interface ManufacturerBrandsDirectory {
  totalBrands: number;
  totalProducts: number;
  totalInStock: number;
  brands: ManufacturerBrandEntry[];
  escapeBrands: ManufacturerBrandEntry[];
  featuredBrands: ManufacturerBrandEntry[];
}

export interface RelatedManufacturerBrand {
  name: string;
  slug: string;
  modelCount: number;
  escapeCount: number;
  isEscapeSpecialist: boolean;
}

export interface ManufacturerBrandLandingData {
  brand: ManufacturerBrandEntry;
  products: Product[];
  total: number;
  refs?: number;
  totalPages: number;
  page: number;
  perPage: number;
  relatedBrands: RelatedManufacturerBrand[];
}

export type ManufacturerBrandApiResponse =
  | { missing: true }
  | { redirectTo: string }
  | ManufacturerBrandLandingData;

/** Proveedores mayoristas que nunca deben enlazarse como marca pública. */
export function isExcludedSupplierBrand(brand: unknown): boolean {
  const s = String(brand ?? '').trim();
  if (!s) return true;
  return /\bbihr\b/i.test(s);
}

/** Slug limpio en minúsculas con guiones («YOSHIMURA US» → «yoshimura-us», «R&G RACING» → «r-g-racing»). */
export function slugifyManufacturerBrand(text: unknown): string {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fabricantes destacados para el pie de página y directorios internos SSR. */
export const POPULAR_FOOTER_MANUFACTURER_BRANDS = [
  { name: 'IXIL', href: '/marcas/ixil' },
  { name: 'Yasuni', href: '/marcas/yasuni' },
  { name: 'Tecnigas', href: '/marcas/tecnigas' },
  { name: 'Yoshimura US', href: '/marcas/yoshimura-us' },
  { name: 'Brembo', href: '/marcas/brembo' },
  { name: 'Arai', href: '/marcas/arai' },
  { name: 'RST', href: '/marcas/rst' },
  { name: 'SHAD', href: '/marcas/shad' },
  { name: 'AFAM', href: '/marcas/afam' },
  { name: 'Michelin', href: '/marcas/michelin' },
] as const;

function getServerApiBase(): string {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.escapesymas.com').replace(/\/$/, '');
}

export async function fetchBrandsDirectory(): Promise<ManufacturerBrandsDirectory | null> {
  try {
    const res = await fetch(`${getServerApiBase()}/api/catalog/marcas`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ManufacturerBrandsDirectory;
  } catch {
    return null;
  }
}

export async function fetchBrandLanding(
  brandSlug: string,
  options: {
    page?: number;
    perPage?: number;
    categoryId?: number | null;
    inStock?: boolean;
    sort?: string;
    q?: string;
  } = {},
): Promise<ManufacturerBrandApiResponse> {
  try {
    const params = new URLSearchParams();
    if (options.page && options.page > 1) params.set('page', String(options.page));
    if (options.perPage) params.set('per_page', String(options.perPage));
    if (options.categoryId && options.categoryId > 0) params.set('category_id', String(options.categoryId));
    if (options.inStock) params.set('in_stock', '1');
    if (options.sort && options.sort !== 'relevance') params.set('sort', options.sort);
    if (options.q && options.q.trim()) params.set('q', options.q.trim());

    const qs = params.toString();
    const res = await fetch(
      `${getServerApiBase()}/api/catalog/marcas/${encodeURIComponent(brandSlug)}${qs ? `?${qs}` : ''}`,
      { next: { revalidate: 300 } },
    );
    if (res.status === 404) return { missing: true };
    if (!res.ok) return { missing: true };
    return (await res.json()) as ManufacturerBrandApiResponse;
  } catch {
    return { missing: true };
  }
}
