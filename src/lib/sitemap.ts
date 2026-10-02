/** Sitemap: índice en /sitemap.xml y partes en /sitemaps/{pages|0..N}.xml */
export const SITE_URL = 'https://escapesymas.com';
export const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';
export const PRODUCTS_PER_SITEMAP = 5000;

export const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function productCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/sitemap-count`, { next: { revalidate: 3600 } });
    if (res.ok) return Number((await res.json()).total) || 0;
  } catch { /* sin API: solo páginas */ }
  return 0;
}

export function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
  });
}
