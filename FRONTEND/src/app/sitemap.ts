import { MetadataRoute } from 'next';

const API_URL = process.env.NODE_ENV === 'production' ? 'https://escapesymas.com/api' : 'http://127.0.0.1:3001/api';
const LIMIT_PER_SITEMAP = 10000;

export async function generateSitemaps() {
  // To avoid fetching all 100k SKUs just to count them, we could fetch a lightweight stats endpoint.
  // Since we don't have a stats endpoint returning exact counts easily, we can assume a maximum of 150k products
  // and generate 15 sitemap indices, or we can fetch the first page of products to get the X-WP-Total header.
  try {
    const res = await fetch(`${API_URL}/catalog/products?per_page=1`);
    const totalStr = res.headers.get('X-WP-Total');
    const total = totalStr ? parseInt(totalStr, 10) : 100000; // fallback to 100k if header missing
    
    const sitemaps = [];
    const chunks = Math.ceil(total / LIMIT_PER_SITEMAP);
    for (let i = 0; i < chunks; i++) {
      sitemaps.push({ id: i });
    }
    return sitemaps;
  } catch (err) {
    // Fallback to 10 chunks if API fails during build
    return Array.from({ length: 10 }).map((_, i) => ({ id: i }));
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const page = id + 1; // 1-indexed for the API
  
  // Base URLs
  const routes: MetadataRoute.Sitemap = [
    {
      url: 'https://escapesymas.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://escapesymas.com/universales/accesorios-moto',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://escapesymas.com/universales/herramientas-taller',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    // Fetch products for this chunk
    const res = await fetch(`${API_URL}/catalog/sitemap-skus?page=${page}&limit=${LIMIT_PER_SITEMAP}`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (res.ok) {
      const products: { id: number; slug: string; updated_at: string }[] = await res.json();
      
      const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
        url: `https://escapesymas.com/producto/${product.slug || product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

      // Only add the base routes to the first sitemap chunk
      return id === 0 ? [...routes, ...productRoutes] : productRoutes;
    }
  } catch (err) {
    console.error('Error generating sitemap chunk', id, err);
  }

  return id === 0 ? routes : [];
}
