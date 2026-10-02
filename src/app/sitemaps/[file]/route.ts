import { SITE_URL, API_BASE, PRODUCTS_PER_SITEMAP, xmlEscape, xmlResponse } from '../../../lib/sitemap';
import type { Category3 } from '../../../types';

export const revalidate = 3600;

const STATIC_PAGES = ['', '/universales', '/aviso-legal', '/politica-privacidad', '/politica-cookies', '/terminos', '/devoluciones'];

type Entry = { loc: string; lastmod?: string; priority: number };

function urlset(entries: Entry[]): Response {
  const body = entries.map((e) =>
    `  <url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}<priority>${e.priority.toFixed(1)}</priority></url>`);
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body.join('\n')}\n</urlset>`);
}

async function pages(): Promise<Response> {
  const entries: Entry[] = STATIC_PAGES.map((p) => ({ loc: `${SITE_URL}${p}`, priority: p === '' ? 1 : p === '/universales' ? 0.9 : 0.3 }));
  try {
    const res = await fetch(`${API_BASE}/api/catalog/categories`, { next: { revalidate: 3600 } });
    const cats = (res.ok ? await res.json() : []) as Category3[];
    const live = cats.filter((c) => !c.slug.startsWith('old-') && !/promocional/i.test(c.slug));
    const byId = new Map(live.map((c) => [c.id, c]));
    for (const c of live) {
      if (!c.parentId) entries.push({ loc: `${SITE_URL}/universales/${c.slug}`, priority: 0.8 });
      else if (byId.get(c.parentId) && !byId.get(c.parentId)!.parentId) {
        entries.push({ loc: `${SITE_URL}/universales/${byId.get(c.parentId)!.slug}/${c.slug}`, priority: 0.7 });
      }
    }
  } catch { /* solo estáticas */ }
  return urlset(entries);
}

async function products(part: number): Promise<Response> {
  const res = await fetch(`${API_BASE}/api/catalog/sitemap-skus?page=${part + 1}&limit=${PRODUCTS_PER_SITEMAP}`, { next: { revalidate: 3600 } });
  if (!res.ok) return new Response('Sitemap no disponible', { status: 503 });
  const rows = (await res.json()) as { sku?: string; updated_at?: string }[];
  if (!rows.length) return new Response('No encontrado', { status: 404 });
  return urlset(rows.filter((r) => r.sku).map((r) => {
    const d = r.updated_at ? new Date(r.updated_at.replace(' ', 'T')) : null;
    return {
      loc: `${SITE_URL}/producto/${encodeURIComponent(r.sku!)}`,
      lastmod: d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined,
      priority: 0.6,
    };
  }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file === 'pages.xml') return pages();
  const m = file.match(/^(\d{1,3})\.xml$/);
  if (!m) return new Response('No encontrado', { status: 404 });
  return products(Number(m[1]));
}
