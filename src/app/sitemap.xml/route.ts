import { SITE_URL, PRODUCTS_PER_SITEMAP, productCount, xmlResponse } from '../../lib/sitemap';

export const revalidate = 3600;

/** Índice: páginas y categorías + una parte por cada 5.000 productos. */
export async function GET() {
  const parts = Math.ceil((await productCount()) / PRODUCTS_PER_SITEMAP);
  const urls = ['pages', ...Array.from({ length: parts }, (_, i) => String(i))]
    .map((p) => `  <sitemap><loc>${SITE_URL}/sitemaps/${p}.xml</loc></sitemap>`);
  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</sitemapindex>`);
}
