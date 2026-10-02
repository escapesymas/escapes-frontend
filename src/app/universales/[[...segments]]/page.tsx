import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import CatalogClient from './CatalogClient';
import { Category3, Product, FilterOptions } from '../../../types';
import { parseCatalogUrl, toApiParams } from '../../../lib/catalogParams';

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

  // Mismo estado y mismos parámetros que usa el cliente (lib/catalogParams).
  const spParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === 'string') spParams.set(k, v);
  const urlState = parseCatalogUrl(spParams);
  const catId = subId || parentId || null;
  const ctx = { categoryId: catId, search: searchTerm || undefined };

  let products: { products: Product[]; total: number; totalPages: number } | null = null;
  let filterOptions: FilterOptions | null = null;

  // Neumáticos: hasta elegir la medida solo se muestra el buscador (ver TyreFinder).
  const tyresWithoutSize = segs[0] === 'neumaticos' && !/camara|mousse|accesorio|valvula|fondo/i.test(segs[1] || '')
    && !(urlState.attrs.Ancho?.length && urlState.attrs.Llanta?.length) && !urlState.q;

  const [prodRes, filterRes] = tyresWithoutSize ? [null, null] : await Promise.all([
    fetch(`${API_BASE}/api/catalog/products?${toApiParams(urlState, ctx)}`, { cache: 'no-store' }).catch(() => null),
    fetch(`${API_BASE}/api/catalog/filters?${toApiParams(urlState, ctx, true)}`, { cache: 'no-store' }).catch(() => null),
  ]);

  const corrHeader = prodRes?.headers.get('X-Search-Corrected');
  const initialSearchMeta = {
    fuzzy: prodRes?.headers.get('X-Search-Fuzzy') === '1',
    corrected: corrHeader ? decodeURIComponent(corrHeader) : null,
    refs: Number(prodRes?.headers.get('X-Total-Refs') || 0) || undefined,
  };

  if (prodRes?.ok) {
    const total = Number(prodRes.headers.get('X-WP-Total') || 0);
    const totalPages = Number(prodRes.headers.get('X-WP-TotalPages') || 0);
    const prodData = await prodRes.json();
    products = { products: prodData || [], total, totalPages };
  }
  if (filterRes?.ok) {
    filterOptions = await filterRes.json() as FilterOptions;
  }

  // El cliente recibe la query tal cual (filtros, orden, página, q).
  const initialSearchParamsStr = spParams.toString();

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
        initialSearchMeta={initialSearchMeta}
      />
    </Suspense>
  );
}