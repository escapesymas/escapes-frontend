import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import CatalogClient from './CatalogClient';
import { Category3, Product, FilterOptions } from '../../../types';
import { parseCatalogUrl, toApiParams, sizedKindFor } from '../../../lib/catalogParams';
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from '../../../components/SchemaMarkup';
import { effectivePrice } from '../../../lib/pricing';
import { fetchBrandsDirectory, POPULAR_FOOTER_MANUFACTURER_BRANDS } from '../../../lib/brandSeo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';

/** Categorías vigentes (sin el árbol antiguo old-*, que no tiene productos). Caché 10 min. */
async function fetchCategories(): Promise<Category3[]> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/categories`, { next: { revalidate: 600 } });
    const all = res.ok ? ((await res.json()) as Category3[]) : [];
    return all.filter((c) => !c.slug.startsWith('old-'));
  } catch {
    return [];
  }
}

function parsePositivePage(raw: string | string[] | undefined): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(val || '1'), 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ segments = [] }, sp] = await Promise.all([params, searchParams]);
  if (segments[0] === 'buscar') {
    const q = decodeURIComponent(segments[1] || '');
    return { title: `${q ? `“${q}” · ` : ''}Buscar — Escapes y Más`, robots: { index: false, follow: true } };
  }
  const cats = await fetchCategories();
  const parent = segments[0] ? cats.find((c) => c.slug === segments[0]) : undefined;
  const sub = parent && segments[1] ? cats.find((c) => c.slug === segments[1] && c.parentId === parent.id) : undefined;
  const path = `/universales${segments.length ? `/${segments.join('/')}` : ''}`;

  const page = parsePositivePage(sp.page);
  const filtered = Object.keys(sp).some((k) => k !== 'page');
  // Paginación limpia (!filtered): cada página (?page=2, ?page=3…) lleva canonical autorreferente
  // para que Google rastree e indexe las páginas profundas del catálogo en lugar de descartarlas.
  const canonical = !filtered && page > 1 ? `${path}?page=${page}` : path;
  const pageSuffix = !filtered && page > 1 ? ` · Página ${page}` : '';

  let title: string;
  let description: string;
  if (sub && parent) {
    title = `${sub.name} · ${parent.name} para Moto${pageSuffix} — Escapes y Más`;
    description = `${sub.name} (${parent.name}) para tu moto: primeras marcas, precios con IVA, stock en tiempo real y envío gratis desde 200 € en Escapes y Más.`;
  } else if (parent) {
    title = `${parent.name} para Moto${pageSuffix} — Catálogo y Ofertas | Escapes y Más`;
    description = `Compra ${parent.name.toLowerCase()} para moto en Escapes y Más: precios con IVA incluido, stock en tiempo real, garantía de 3 años y envío gratis desde 200 €.`;
  } else {
    title = `Catálogo de Recambios, Escapes, Cascos y Accesorios de Moto${pageSuffix} — Escapes y Más`;
    description = 'Explora nuestro catálogo completo de recambios, escapes homologados, cascos, frenos, neumáticos y equipamiento para moto con envío gratis desde 200 €.';
  }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `https://escapesymas.com${canonical}`,
      siteName: 'Escapes y Más',
      locale: 'es_ES',
    },
    // Las combinaciones de filtros no se indexan (contenido duplicado de la categoría).
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

function resolveIds(segments: string[], categories: Category3[]) {
  const parentSlug = segments[0] || null;
  const subSlug = segments[1] || null;
  const isSearch = parentSlug === 'buscar';
  if (isSearch) return { parentId: null, subId: null, searchTerm: decodeURIComponent(subSlug || ''), isSearch: true };

  const parentCat = categories.find((c) => c.slug === parentSlug);
  const subCat = subSlug ? categories.find((c) => c.slug === subSlug && c.parentId === parentCat?.id) : null;
  return {
    parentId: parentCat?.id || null,
    subId: subCat?.id || null,
    searchTerm: '',
    isSearch: false,
  };
}

export default async function CatalogPage({
  params,
  searchParams,
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

  const categories = (await fetchCategories()).filter((c) => !isPromoCategory(c));

  const initialMainCategories = categories
    .filter((c) => c.parentId === 0 && (c.id >= 1000 || !c.slug.startsWith('old-')) && !isPromoCategory(c))
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));

  // Si hay segmento pero la categoría no existe → 404
  let parentCatObj: Category3 | undefined;
  let subCatObj: Category3 | undefined;
  if (segs.length > 0 && segs[0] !== 'buscar') {
    const parentSlug = segs[0];
    parentCatObj = categories.find((c) => c.slug === parentSlug);
    if (!parentCatObj) {
      notFound();
    }
    if (segs[1]) {
      subCatObj = categories.find((c) => c.slug === segs[1] && c.parentId === parentCatObj!.id);
      if (!subCatObj) {
        notFound();
      }
    }
    if (segs.length > 2) {
      notFound();
    }
  }

  const { parentId, subId, searchTerm, isSearch } = resolveIds(segs, categories);

  // Mismo estado y mismos parámetros que usa el cliente (lib/catalogParams).
  const spParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === 'string') spParams.set(k, v);
  const urlState = parseCatalogUrl(spParams);
  const catId = subId || parentId || null;
  const sizedKind = isSearch ? null : sizedKindFor(segs[0] || null, segs[1] || null);
  const ctx = { categoryId: catId, search: searchTerm || undefined, sizedKind };

  let products: { products: Product[]; total: number; totalPages: number } | null = null;
  let filterOptions: FilterOptions | null = null;
  let featuredTyreProducts: Product[] = [];

  // Neumáticos, cámaras y mousses: arriba se muestra TyreFinder, y debajo ofrecemos una muestra
  // SSR indexable de modelos en stock para que Googlebot rastree productos reales en /universales/neumaticos.
  const tyresWithoutSize = !!sizedKind && !(urlState.attrs.Ancho?.length && urlState.attrs.Llanta?.length) && !urlState.q;

  const [prodRes, filterRes, brandsDir, tyrePreviewRes] = await Promise.all([
    tyresWithoutSize
      ? Promise.resolve(null)
      : fetch(`${API_BASE}/api/catalog/products?${toApiParams(urlState, ctx)}`, { cache: 'no-store' }).catch(() => null),
    tyresWithoutSize
      ? Promise.resolve(null)
      : fetch(`${API_BASE}/api/catalog/filters?${toApiParams(urlState, ctx, true)}`, { cache: 'no-store' }).catch(() => null),
    isSearch ? Promise.resolve(null) : fetchBrandsDirectory(),
    tyresWithoutSize && catId
      ? fetch(`${API_BASE}/api/catalog/products?category_id=${catId}&in_stock=true&per_page=12`, {
          next: { revalidate: 600 },
        }).catch(() => null)
      : Promise.resolve(null),
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
    filterOptions = (await filterRes.json()) as FilterOptions;
  }
  if (tyrePreviewRes?.ok) {
    const tData = await tyrePreviewRes.json();
    if (Array.isArray(tData)) featuredTyreProducts = tData;
  }

  const featuredBrandLinks =
    brandsDir && brandsDir.featuredBrands?.length
      ? brandsDir.featuredBrands.slice(0, 24).map((b) => ({
          name: b.name,
          href: `/marcas/${b.slug}`,
          count: b.modelCount,
        }))
      : POPULAR_FOOTER_MANUFACTURER_BRANDS.map((b) => ({ name: b.name, href: b.href }));

  const initialSearchParamsStr = spParams.toString();
  const basePath = `/universales${segs.length ? `/${segs.join('/')}` : ''}`;
  const canonicalUrlPath = urlState.page > 1 ? `${basePath}?page=${urlState.page}` : basePath;

  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    { name: 'Catálogo', url: '/universales' },
    ...(parentCatObj ? [{ name: parentCatObj.name, url: `/universales/${parentCatObj.slug}` }] : []),
    ...(parentCatObj && subCatObj
      ? [{ name: subCatObj.name, url: `/universales/${parentCatObj.slug}/${subCatObj.slug}` }]
      : []),
  ];

  const listProducts = products?.products?.length ? products.products : featuredTyreProducts;
  const itemListName = subCatObj
    ? `${subCatObj.name} (${parentCatObj?.name || 'Catálogo'})`
    : parentCatObj?.name || 'Catálogo de recambios y accesorios para moto';

  const itemListSchema = !isSearch
    ? listProducts.length > 0
      ? getItemListSchema({
          name: itemListName,
          url: canonicalUrlPath,
          items: listProducts.slice(0, 24).map((p) => ({
            name: p.name || p.title,
            description: p.description || p.shortDescription || `${p.name || p.title} en Escapes y Más`,
            brand: p.brand || undefined,
            sku: p.sku || undefined,
            barcode: p.barcode || undefined,
            url: `/producto/${encodeURIComponent(p.slug || p.sku)}`,
            image: p.image || p.images?.[0]?.src,
            price: effectivePrice(p),
            inStock: p.inStock && p.stock > 0,
          })),
        })
      : getItemListSchema({
          name: itemListName,
          url: canonicalUrlPath,
          items: initialMainCategories.map((c) => ({
            name: c.name,
            url: `/universales/${c.slug}`,
          })),
        })
    : null;

  return (
    <>
      {!isSearch && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(getBreadcrumbSchema(breadcrumbItems)),
          }}
        />
      )}
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(itemListSchema),
          }}
        />
      )}
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
          featuredBrandLinks={featuredBrandLinks}
          featuredTyreProducts={featuredTyreProducts}
        />
      </Suspense>
    </>
  );
}