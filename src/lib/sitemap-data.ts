import 'server-only';

const API_BASE = process.env.API_URL || 'https://api.escapesymas.com';

export async function getAllProductsSitemap(limit = 50000): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/sitemap-skus?page=1&limit=${limit}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map((r: any) => r.slug).filter(Boolean) : [];
  } catch (err) {
    console.error('sitemap-data: error fetching sitemap slugs', err);
    return [];
  }
}
