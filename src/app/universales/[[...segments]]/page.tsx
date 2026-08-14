import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import CatalogClient from './CatalogClient';
import { Category3, Product, FilterOptions } from '../../../types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function resolveIds(segments: string[], categories: Category3[]) {
  const parentSlug = segments[0] || null;
  const subSlug = segments[1] || null;
  const isSearch = parentSlug === 'buscar';
  if (isSearch) return { parentId: null, subId: null, searchTerm: decodeURIComponent(subSlug || ''), isSearch: true };

  const parentCat = categories.find(c => c.slug === parentSlug);
  const subCat = subSlug ? categories.find(c => c.slug === subSlug && c.parentId === parentCat?.id) : null;
  return {
    parentId: parentCat?.id || null,
    subId: subCat?.id || null,
    searchTerm: '',
    isSearch: false
  };
}

export default async function CatalogPage({
  params,
  searchParams
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [segments, sp] = await Promise.all([params, searchParams]);
  const segs = segments.segments || [];

  // Redirect native form submission /?q=... to /buscar/QUERY
  if (segs.length === 1 && segs[0] === 'buscar' && typeof sp.q === 'string' && sp.q.trim()) {
    redirect(`/universales/buscar/${encodeURIComponent(sp.q.trim())}`);
  }

  const isPromoCategory = (c: Category3) =>
    c.id === 1011 ||
    c.id === 634 ||
    c.parentId === 1011 ||
    c.parentId === 634 ||
    c.slug.includes('promocional') ||
    c.name.toLowerCase().includes('promocional');

  const allCategories = await fetchJson(`${API_BASE}/api/catalog/categories`) as Category3[] || [];
  const categories = allCategories.filter(c => !isPromoCategory(c));

  // Pre-compute L1 (root) categories on the server so the client doesn't have to re-filter
  const initialMainCategories = categories
    .filter(c => c.parentId === 0 && (c.id >= 1000 || !c.slug.startsWith('old-')) && !isPromoCategory(c))
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));



  // Si hay segmento pero la categoría no existe → 404
  if (segs.length > 0 && segs[0] !== 'buscar') {
    const parentSlug = segs[0];
    const parentCat = categories.find(c => c.slug === parentSlug);
    if (!parentCat) {
      notFound();
    }
    if (segs[1]) {
      const subCat = categories.find(c => c.slug === segs[1] && c.parentId === parentCat.id);
      if (!subCat) {
        notFound();
      }
    }
  }

  const { parentId, subId, searchTerm, isSearch } = resolveIds(segs, categories);

  const page = Number(sp.page) || 1;
  const brands = typeof sp.brands === 'string' ? sp.brands : '';
  const maxPrice = typeof sp.maxPrice === 'string' ? sp.maxPrice : '';
  const inStock = sp.inStock === '1';
  const attrsRaw = typeof sp.attrs === 'string' ? sp.attrs : '';

  let products: { products: Product[]; total: number; totalPages: number } | null = null;
  let filterOptions: FilterOptions | null = null;

  const catId = subId || parentId || undefined;
  const q = searchTerm || (typeof sp.q === 'string' ? sp.q : '');

  const paramsObj: Record<string, string> = { universal: 'true', per_page: '12', page: String(page) };
  if (q) paramsObj.search = q;
  if (catId) paramsObj.category_id = String(catId);
  if (brands) paramsObj.brand = brands;
  if (maxPrice) paramsObj.max_price = maxPrice;
  if (inStock) paramsObj.in_stock = '1';
  if (attrsRaw) paramsObj.attrs = attrsRaw;

  const qs = new URLSearchParams(paramsObj).toString();
  const filterQs = new URLSearchParams({
    universal: 'true',
    ...(catId ? { category_id: String(catId) } : {}),
    ...(q ? { search: q } : {})
  }).toString();

  const [prodRes, filterRes] = await Promise.all([
    fetch(`${API_BASE}/api/catalog/products?${qs}`, { cache: 'no-store' }),
    fetch(`${API_BASE}/api/catalog/filters?${filterQs}`, { cache: 'no-store' })
  ]);

  if (prodRes.ok) {
    const total = Number(prodRes.headers.get('X-WP-Total') || 0);
    const totalPages = Number(prodRes.headers.get('X-WP-TotalPages') || 0);
    const prodData = await prodRes.json();
    products = { products: prodData || [], total, totalPages };
  }
  if (filterRes.ok) {
    filterOptions = await filterRes.json() as FilterOptions;
  }


  const initialSearchParams = new URLSearchParams();
  if (brands) initialSearchParams.set('brands', brands);
  if (maxPrice) initialSearchParams.set('maxPrice', maxPrice);
  if (inStock) initialSearchParams.set('inStock', '1');
  if (attrsRaw) initialSearchParams.set('attrs', attrsRaw);
  if (sp.page) initialSearchParams.set('page', String(sp.page));
  const initialSearchParamsStr = initialSearchParams.toString();

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-text-muted">Cargando catálogo...</p>
          </div>
        </div>
      }
    >
      <CatalogClient
        segments={segs}
        initialCategories={categories}
        initialMainCategories={initialMainCategories}
        initialProducts={products}
        initialFilterOptions={filterOptions}
        initialSearchTotal={products?.total || 0}
        initialSearchTotalPages={products?.totalPages || 0}
        initialSearchParamsStr={initialSearchParamsStr}
      />
    </Suspense>
  );
}