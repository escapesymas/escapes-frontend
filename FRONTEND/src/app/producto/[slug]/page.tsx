import ProductDetailClient from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

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

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return <ProductDetailClient slug={slug} initialProduct={product} />;
}
