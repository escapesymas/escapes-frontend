import { redirect, notFound } from 'next/navigation';
import CatalogClient from './CatalogClient';
import { Category3, Product, FilterOptions } from '../../../types';

const API_BASE = 'http://127.0.0.1:3001';

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
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

  const categories = await fetchJson(`${API_BASE}/api/catalog/categories`) as Category3[] || [];

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

  if (catId || q) {
    const paramsObj: Record<string, string> = { universal: 'true', per_page: '12', page: String(page) };
    if (q) paramsObj.search = q;
    if (catId) paramsObj.category_id = String(catId);
    if (brands) paramsObj.brand = brands;
    if (maxPrice) paramsObj.max_price = maxPrice;
    if (inStock) paramsObj.in_stock = '1';
    if (attrsRaw) paramsObj.attrs = attrsRaw;

    const qs = new URLSearchParams(paramsObj).toString();
    const [prodRes, filterRes] = await Promise.all([
      fetch(`${API_BASE}/api/catalog/products?${qs}`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/api/catalog/filters?${new URLSearchParams({ category_id: String(catId), universal: 'true', ...(q ? { search: q } : {}) }).toString()}`, { next: { revalidate: 60 } })
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
  }

  const initialSearchParams = new URLSearchParams();
  if (brands) initialSearchParams.set('brands', brands);
  if (maxPrice) initialSearchParams.set('maxPrice', maxPrice);
  if (inStock) initialSearchParams.set('inStock', '1');
  if (attrsRaw) initialSearchParams.set('attrs', attrsRaw);
  if (sp.page) initialSearchParams.set('page', String(sp.page));
  const initialSearchParamsStr = initialSearchParams.toString();

  return (
    <CatalogClient
      segments={segs}
      initialCategories={categories}
      initialProducts={products}
      initialFilterOptions={filterOptions}
      initialSearchTotal={products?.total || 0}
      initialSearchTotalPages={products?.totalPages || 0}
      initialSearchParamsStr={initialSearchParamsStr}
    />
  );
}
