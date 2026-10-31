import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { DELIVERY_ES } from '../../../lib/constants';
import { isExcludedSupplierBrand, slugifyManufacturerBrand } from '../../../lib/brandSeo';
import { getProductSchema, getBreadcrumbSchema, jsonLd } from '../../../components/SchemaMarkup';
import { effectivePrice } from '../../../lib/pricing';

const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://escapesymas.com';

/** null = no se pudo consultar (se intenta en el cliente); { missing } = no existe (404). */
async function fetchProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/product-by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      // Ficha duplicada archivada o slug descriptivo (/producto/SKU-texto): el backend indica la canónica.
      if (data && data.redirectTo) return { redirectTo: String(data.redirectTo) };
      // URL antigua de WooCommerce (/producto/mivv-...): redirigir a la página de la moto o de escapes.
      if (data && data.redirectToPath) return { redirectToPath: String(data.redirectToPath) };
      if (data && data.id) return data;
    }

    // Fallback: consultar por SKU directamente si la búsqueda por slug falla
    const resSkus = await fetch(`${API_BASE}/api/catalog/products-by-skus?skus=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (resSkus.ok) {
      const items = await resSkus.json();
      if (Array.isArray(items) && items.length > 0) return items[0];
      if (res.status === 404) return { missing: true };
    }
    return null;
  } catch {
    return null;
  }
}

function cleanProductTitle(name: string): string {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  const acronyms = new Set([
    'IXIL', 'KTM', 'BMW', 'ABS', 'ITV', 'LED', 'CNC', 'EAN', 'DB-KILLER',
    'NGK', 'AFAM', 'R&G', 'SHAD', 'ARAI', 'HMF', 'BMC', 'MRA', 'YSS', 'PBR', 'UFO',
    'RST', 'RFX', 'SKF', 'NTN', 'RK', 'ITP', 'IRC', 'KMC', 'JMP', 'JBM', 'MFW',
    'NOCO', 'ODI', 'EPI', 'AXP', 'ART', 'RAM', 'STM', 'TNK', 'HPX', 'TEXA', 'SIEM',
    'ZECA', 'KOSO', 'SENA', 'BELL', 'BETA', 'SCAR', '2T', '4T', 'CC', 'GT', 'RR',
    'SX', 'EXC', 'CBR', 'YZF', 'GSX', 'MT', 'Z', 'CB', 'ADV', 'GS', 'TMAX',
    'XMAX', 'PCX', 'SH', 'FORZA', 'X-CAPE', 'TRK',
  ]);
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (/^\d+[a-z]?$/i.test(word)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product || product.redirectTo || product.redirectToPath || product.missing) {
    return {
      title: 'Producto no encontrado · Escapes y Más',
      robots: { index: false, follow: true },
      description: 'Busca recambios y escapes para tu moto en Escapes y Más.',
    };
  }

  const publicBrand = product.brand && !isExcludedSupplierBrand(product.brand) ? product.brand : '';
  const price = (product.salePrice ?? product.price).toFixed(2);
  const compat = Array.isArray(product.compatibility) ? product.compatibility.length : 0;
  const cleanedName = cleanProductTitle(product.name);
  const isEscape = /\b(escape|silencioso|silenciador|colector|tubo|linea)\b/i.test(product.name);
  const titleBadge = isEscape ? ' · Homologado ITV' : '';
  const title = `${publicBrand ? publicBrand + ' ' : ''}${cleanedName}${titleBadge} | Escapes y Más`;

  const isFreeShip = Number(price) >= 200;
  const shipBadge = isFreeShip ? 'Envío gratis.' : `Envío estándar en ${DELIVERY_ES}.`;
  const description = `${publicBrand ? `${publicBrand} ` : ''}${cleanedName} a ${price}€. ${product.inStock ? `En stock. ${shipBadge}` : 'Sin stock ahora mismo.'}${compat ? ` Compatible con ${compat} ${compat === 1 ? 'modelo' : 'modelos'} de moto.` : ''} Garantía de 3 años.`;
  const imageUrl = product.image || `${SITE_URL}/og-image.png`;
  const canonicalSku = product.sku || slug;
  const pageUrl = `${SITE_URL}/producto/${encodeURIComponent(canonicalSku)}`;

  return {
    title,
    description,
    keywords: [publicBrand, product.sku, product.category, product.category2, product.category3, 'moto', 'recambio'].filter(Boolean).join(', '),
    openGraph: {
      type: 'website',
      title,
      description,
      url: pageUrl,
      siteName: 'Escapes y Más',
      images: [{ url: imageUrl, alt: product.name, width: 800, height: 800 }],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (product?.redirectTo) permanentRedirect(`/producto/${encodeURIComponent(product.redirectTo)}`);
  if (product?.redirectToPath) permanentRedirect(product.redirectToPath);
  // Producto inexistente: 404 de verdad (antes respondía 200 con "no encontrado").
  if (product?.missing) notFound();

  if (!product || !product.id) {
    return <ProductDetailClient slug={slug} initialProduct={null} />;
  }

  const inStock = Boolean(product.inStock && (product.stock === undefined || product.stock > 0));
  const price = effectivePrice(product);
  const publicBrand = product.brand && !isExcludedSupplierBrand(product.brand) ? product.brand : '';
  const brandSlug = publicBrand ? slugifyManufacturerBrand(publicBrand) : '';
  const canonicalSku = encodeURIComponent(product.sku || slug);

  // Catálogo › Raíz › Subcategoría
  const path = (product.categoryPath || []).filter(
    (c: { name: string; slug: string }, i: number, arr: { name: string; slug: string }[]) =>
      i === 0 || c.name.toLowerCase() !== arr[i - 1].name.toLowerCase()
  );
  const crumbs = [
    { name: 'Catálogo', href: '/universales' },
    ...path.map((c: { name: string; slug: string }, i: number) => ({
      name: c.name,
      href: i === 0 ? `/universales/${c.slug}` : `/universales/${path[0].slug}/${path[Math.min(i, 1)].slug}`,
    })),
  ];

  const productSchema = getProductSchema({
    name: product.name,
    description: product.description || product.name,
    image: product.image,
    images: product.images,
    sku: product.sku,
    mpn: product.mpn || product.supplierCode || product.supplier_code,
    barcode: product.barcode,
    brand: publicBrand,
    price,
    url: `${SITE_URL}/producto/${canonicalSku}`,
    inStock,
    averageRating: product.averageRating,
    ratingCount: product.ratingCount,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    ...crumbs.map((c: { name: string; href: string }) => ({ name: c.name, url: c.href })),
    ...(publicBrand && brandSlug ? [{ name: publicBrand, url: `/marcas/${brandSlug}` }] : []),
    { name: product.name, url: `/producto/${canonicalSku}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
