import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { DELIVERY_ES } from '../../../lib/constants';
import { isExcludedSupplierBrand } from '../../../lib/brandSeo';

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
  // Solo datos ciertos de la ficha: plazo de entrega igual que en Google Merchant Center y compatibilidad si la hay.
  const compat = Array.isArray(product.compatibility) ? product.compatibility.length : 0;
  const description = `${publicBrand ? `${publicBrand} ` : ''}${product.name} a ${price}€. ${product.inStock ? `En stock, entrega en ${DELIVERY_ES}.` : 'Sin stock ahora mismo.'}${compat ? ` Compatible con ${compat} ${compat === 1 ? 'versión' : 'versiones'} de moto.` : ''} Garantía de 3 años.`;
  const imageUrl = product.image || `${SITE_URL}/og-image.png`;
  const canonicalSku = product.sku || slug;
  const pageUrl = `${SITE_URL}/producto/${encodeURIComponent(canonicalSku)}`;

  return {
    title: `${publicBrand ? publicBrand + ' · ' : ''}${product.name} · Escapes y Más`,
    description,
    keywords: [publicBrand, product.sku, product.category, product.category2, product.category3, 'moto', 'recambio'].filter(Boolean).join(', '),
    openGraph: {
      type: 'website',
      title: `${publicBrand ? publicBrand + ' · ' : ''}${product.name}`,
      description,
      url: pageUrl,
      siteName: 'Escapes y Más',
      images: [{ url: imageUrl, alt: product.name, width: 800, height: 800 }],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${publicBrand ? publicBrand + ' · ' : ''}${product.name}`,
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
  return <ProductDetailClient slug={slug} initialProduct={product} />;
}
