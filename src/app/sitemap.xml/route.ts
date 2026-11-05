import { SITE_URL, PRODUCTS_PER_SITEMAP, productCounts, xmlResponse } from '../../lib/sitemap';

export const revalidate = 3600;

/**
 * Índice: páginas y categorías + directorio de motos + fabricantes + escapes (prioridad) + una parte por cada
 * 5.000 productos con stock. Los agotados no se piden a Google (siguen existiendo en la web).
 */
export async function GET() {
  const { escapes, resto } = await productCounts();
  const parts = Math.ceil(resto / PRODUCTS_PER_SITEMAP);
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['pages', 'motos', 'marcas', ...(escapes > 0 ? ['escapes'] : []), ...Array.from({ length: parts }, (_, i) => String(i))]
    .map((p) => `  <sitemap><loc>${SITE_URL}/sitemaps/${p}.xml</loc><lastmod>${today}</lastmod></sitemap>`);
  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</sitemapindex>`);
}
