import 'server-only';
import { Client } from 'pg';

const SITEMAP_QUERY = `
  SELECT slug
  FROM products
  WHERE status = 'published'
    AND slug IS NOT NULL
    AND slug != ''
  ORDER BY updated_at DESC NULLS LAST
  LIMIT $1
`;

let cached: { slugs: string[]; expiresAt: number } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

export async function getAllProductsSitemap(limit = 50000): Promise<string[]> {
  if (cached && cached.expiresAt > Date.now() && cached.slugs.length <= limit) {
    return cached.slugs;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('sitemap-data: DATABASE_URL no configurada, devolviendo []');
    return [];
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const r = await client.query<{ slug: string }>(SITEMAP_QUERY, [limit]);
    cached = { slugs: r.rows.map((row) => row.slug), expiresAt: Date.now() + TTL_MS };
    return cached.slugs;
  } catch (err) {
    console.error('sitemap-data: error consultando BD', err);
    return [];
  } finally {
    await client.end().catch(() => {});
  }
}
