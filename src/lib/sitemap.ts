/** Sitemap: índice en /sitemap.xml y partes en /sitemaps/{pages|motos|marcas|escapes|0..N}.xml */
export const SITE_URL = 'https://escapesymas.com';
export const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';
export const PRODUCTS_PER_SITEMAP = 5000;
/** Los escapes caben en un solo sitemap (unos 1.200) y van aparte para que Search Console enseñe su indexación por separado. */
export const ESCAPES_SITEMAP_LIMIT = 10000;

export const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface ProductCounts { total: number; escapes: number; resto: number }

/** Productos que entran en el sitemap (con stock y foto propia): en total, escapes y resto. */
export async function productCounts(): Promise<ProductCounts> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/sitemap-count`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const d = await res.json();
      return { total: Number(d.total) || 0, escapes: Number(d.escapes) || 0, resto: Number(d.resto) || 0 };
    }
  } catch { /* sin API: solo páginas */ }
  return { total: 0, escapes: 0, resto: 0 };
}

export function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  });
}
