import { MetadataRoute } from 'next';

const SITE_URL = 'https://escapesymas.com';
const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';
const PRODUCTS_PER_SITEMAP = 25000;
const TOTAL_SITEMAPS = 6; // Cubre hasta 150.000 productos

export async function generateSitemaps() {
  return Array.from({ length: TOTAL_SITEMAPS }, (_, id) => ({ id }));
}

export default async function sitemap(props?: { id?: number }): Promise<MetadataRoute.Sitemap> {
  const sitemapId = Number(props?.id ?? 0) || 0;
  const now = new Date();

  // Páginas estáticas principales solo en la partición 0
  const staticPages: MetadataRoute.Sitemap = sitemapId === 0 ? [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/universales`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/universales/cascos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/chasis`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/escapes`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/frenos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/equipamiento-piloto`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/equipamiento-vehiculo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/herramientas`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/lubricantes-y-limpiadores`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/motor`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/universales/neumaticos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/politica-privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/politica-cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/devoluciones`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ] : [];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const page = sitemapId + 1;
    const res = await fetch(`${API_BASE}/api/catalog/sitemap-skus?page=${page}&limit=${PRODUCTS_PER_SITEMAP}`, {
      next: { revalidate: 86400 } // 24h
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        productPages = rows
          .filter((r: any) => r.slug)
          .map((r: any) => ({
            url: `${SITE_URL}/producto/${r.slug}`,
            lastModified: r.updated_at ? new Date(r.updated_at) : now,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }));
      }
    }
  } catch (err) {
    console.error(`Sitemap [${sitemapId}]: error cargando productos`, err);
  }

  return [...staticPages, ...productPages];
}
