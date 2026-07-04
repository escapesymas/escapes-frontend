import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://escapesymas.com';

async function fetchProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/product-by-slug/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return {
      title: 'Producto no encontrado · Escapes y Más',
      description: 'Busca recambios y escapes para tu moto en Escapes y Más.',
    };
  }

  const price = (product.salePrice ?? product.price).toFixed(2);
  const description = `${product.brand} ${product.name} a ${price}€. ${product.inStock ? 'En stock, envío 24-72h.' : 'Sin stock, vuelve pronto.'} Compatible con tu moto. Garantía oficial.`;
  const imageUrl = product.image || `${SITE_URL}/icon-512.svg`;
  const pageUrl = `${SITE_URL}/producto/${slug}`;

  return {
    title: `${product.brand ? product.brand + ' · ' : ''}${product.name} · Escapes y Más`,
    description,
    keywords: [product.brand, product.sku, product.category, product.category2, product.category3, 'moto', 'recambio'].filter(Boolean).join(', '),
    openGraph: {
      type: 'website',
      title: `${product.brand ? product.brand + ' · ' : ''}${product.name}`,
      description,
      url: pageUrl,
      siteName: 'Escapes y Más',
      images: [{ url: imageUrl, alt: product.name, width: 800, height: 800 }],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.brand ? product.brand + ' · ' : ''}${product.name}`,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    notFound();
  }
  return <ProductDetailClient slug={slug} initialProduct={product} />;
}
