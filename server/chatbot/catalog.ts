import { pool } from '../db.js';

export interface CatalogHit {
  id: number;
  sku: string;
  brand: string;
  name: string;
  price: number;
  sale_price: number | null;
  stock: number;
  stock_status: string;
  image: string | null;
  slug: string | null;
  compatibility: any;
  category2: string | null;
  category3: string | null;
}

export interface CatalogContextResult {
  hits: CatalogHit[];
  text: string;
}

interface GarageMotorcycle {
  brand: string;
  model: string;
  year: number | null;
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    'para', 'como', 'cuál', 'cuales', 'donde', 'cuando', 'cuanto', 'tengo', 'tienes',
    'queremos', 'quiero', 'quisiera', 'busco', 'buscando', 'algo', 'algun', 'alguna',
    'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'gracias', 'por', 'favor',
    'una', 'uno', 'unos', 'unas', 'del', 'los', 'las', 'con', 'sin', 'que', 'qué',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aqui', 'allí',
    'the', 'and', 'for', 'are', 'you', 'can', 'have', 'has', 'with', 'from',
  ]);
  const matches = text.toLowerCase().match(/[a-záéíóúñ0-9]{3,}/g) || [];
  return matches.filter((w) => !stopwords.has(w)).slice(0, 8);
}

const PURCHASE_INTENT_WORDS = [
  'busco', 'buscando', 'quiero', 'quisiera', 'necesito', 'recomienda', 'recomiendas',
  'tienes', 'teneis', 'hay', 'toca', 'cambiar', 'comprar', 'escape', 'escapes',
  'recambio', 'recambios', 'filtro', 'filtros', 'pastilla', 'pastillas', 'freno',
  'frenos', 'cadena', 'transmision', 'transmisión', 'aceite', 'bujia', 'bujía',
  'bateria', 'batería', 'kit', 'moto', 'motero', 'compatible', 'compatibilidad',
  'sirve', 'valvula', 'válvula', 'embrague', 'amortiguador', 'suspension',
];

function hasPurchaseIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return PURCHASE_INTENT_WORDS.some((w) => lower.includes(w));
}

const GARAGE_YEAR_RE = /\((\d{4})\)/;
const GARAGE_MODEL_BRAND_RE = /^([A-Z][A-Z0-9\-]+(?:\s+[A-Z0-9][A-Z0-9\-]+)*)\s+\(([^)]+)\)\s*$/;

function parseGarageMotorcycle(entry: string): GarageMotorcycle | null {
  const s = (entry || '').trim();
  if (!s) return null;
  const m = s.match(GARAGE_YEAR_RE);
  const year = m ? parseInt(m[1], 10) : null;
  const withoutYear = s.replace(GARAGE_YEAR_RE, '').trim();
  const parts = withoutYear.split(/\s+/);
  if (parts.length < 2) return null;
  return {
    brand: parts[0].toUpperCase(),
    model: parts.slice(1).join(' ').toUpperCase(),
    year: Number.isFinite(year as number) ? (year as number) : null,
  };
}

function modelMatchesGarage(model: string, garageModel: string): boolean {
  if (!model || !garageModel) return false;
  const a = model.toUpperCase();
  const b = garageModel.toUpperCase();
  if (a === b) return true;
  const tokensA = a.split(/\s+/).filter((t) => t.length >= 2);
  const tokensB = b.split(/\s+/).filter((t) => t.length >= 2);
  const significant = tokensA.filter((t) => !/^\d+$/.test(t) && t.length >= 3);
  if (significant.length === 0) return false;
  return significant.some((t) => b.includes(t));
}

function pickFirstImage(images: any): string | null {
  if (!images) return null;
  let arr: any[] = [];
  if (typeof images === 'string') {
    try { arr = JSON.parse(images); } catch { arr = []; }
  } else if (Array.isArray(images)) {
    arr = images;
  }
  if (arr.length === 0) return null;
  const first = arr[0] || {};
  return first.src || first.url || null;
}

function mapHit(row: any): CatalogHit {
  return {
    id: row.id,
    sku: row.sku,
    brand: row.brand,
    name: row.name,
    price: row.price,
    sale_price: row.sale_price,
    stock: row.stock,
    stock_status: row.stock_status,
    image: pickFirstImage(row.images),
    slug: row.slug || row.sku?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `product-${row.id}`,
    compatibility: row.compatibility,
    category2: row.category2,
    category3: row.category3,
  };
}

function formatHitText(p: CatalogHit): string {
  const priceStr = p.sale_price
    ? `${(p.sale_price / 100).toFixed(2)}€ (antes ${(p.price / 100).toFixed(2)}€)`
    : `${(p.price / 100).toFixed(2)}€`;
  const stockStr = (p.stock || 0) > 0 ? `stock: ${p.stock}` : 'sin stock';
  return `- ${p.sku} | ${p.brand || 'Genérico'} | "${p.name}" | ${priceStr} | ${stockStr}`;
}

async function searchByKeywords(
  keywords: string[],
  options: { garageMotos?: GarageMotorcycle[]; preferGarage?: boolean; limit?: number }
): Promise<CatalogHit[]> {
  if (keywords.length === 0) return [];
  const tsQuery = keywords.map((k) => `${k}:*`).join(' | ');
  const limit = options.limit ?? 8;

  try {
    const result = await pool.query(
      `SELECT id, sku, name, brand, price, sale_price, stock, stock_status,
              images, compatibility, category2, category3
       FROM products
       WHERE to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(sku,''))
             @@ to_tsquery('simple', $1)
       ORDER BY stock DESC NULLS LAST, price ASC
       LIMIT 40`,
      [tsQuery]
    );

    const hits = (result.rows as any[]).map(mapHit);
    return filterAndRank(hits, options);
  } catch (err) {
    console.error('[chatbot] keyword search failed:', err);
    return [];
  }
}

async function searchByGarage(
  garageMotos: GarageMotorcycle[],
  limit: number
): Promise<CatalogHit[]> {
  if (garageMotos.length === 0) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;
  for (const moto of garageMotos) {
    if (!moto.brand) continue;
    conditions.push(`(compatibility @> $${i}::jsonb OR compatibility @> $${i + 1}::jsonb)`);
    const exactCompat = JSON.stringify([{ brand: moto.brand, model: moto.model, year: moto.year }]);
    const brandOnly = JSON.stringify([{ brand: moto.brand }]);
    params.push(exactCompat, brandOnly);
    i += 2;
  }

  if (conditions.length === 0) return [];

  const sql = `
    SELECT id, sku, name, brand, price, sale_price, stock, stock_status,
           images, compatibility, category2, category3
    FROM products
    WHERE (${conditions.join(' OR ')})
      AND stock > 0
    ORDER BY stock DESC NULLS LAST, price ASC
    LIMIT ${limit}
  `;

  try {
    const result = await pool.query(sql, params);
    return (result.rows as any[]).map(mapHit);
  } catch (err) {
    console.error('[chatbot] garage search failed:', err);
    return [];
  }
}

function filterAndRank(
  hits: CatalogHit[],
  options: { garageMotos?: GarageMotorcycle[]; preferGarage?: boolean }
): CatalogHit[] {
  if (hits.length === 0) return hits;
  const garage = options.garageMotos || [];
  const preferGarage = options.preferGarage && garage.length > 0;

  const compatible: CatalogHit[] = [];
  const rest: CatalogHit[] = [];

  for (const h of hits) {
    if (garage.length > 0 && isCompatibleWithGarage(h, garage)) {
      compatible.push(h);
    } else {
      rest.push(h);
    }
  }

  if (preferGarage) {
    return [...compatible, ...rest].slice(0, 8);
  }

  return hits.slice(0, 8);
}

function isCompatibleWithGarage(hit: CatalogHit, garage: GarageMotorcycle[]): boolean {
  if (!hit.compatibility || !Array.isArray(hit.compatibility)) return false;
  for (const entry of hit.compatibility) {
    if (!entry || typeof entry !== 'object') continue;
    const entryBrand = String(entry.brand || '').toUpperCase().trim();
    const entryModel = String(entry.model || '').toUpperCase().trim();
    const entryYear = entry.year ? parseInt(entry.year, 10) : null;
    for (const moto of garage) {
      if (!moto.brand) continue;
      const brandMatch = entryBrand === moto.brand || moto.brand.includes(entryBrand) || entryBrand.includes(moto.brand);
      if (!brandMatch) continue;
      const modelMatch = modelMatchesGarage(entryModel, moto.model);
      if (!modelMatch) continue;
      if (moto.year && entryYear && Math.abs(entryYear - moto.year) > 5) continue;
      return true;
    }
  }
  return false;
}

export async function getCatalogContext(
  query: string,
  garageEntries: string[] = []
): Promise<CatalogContextResult> {
  const garageMotos: GarageMotorcycle[] = garageEntries
    .map(parseGarageMotorcycle)
    .filter((m): m is GarageMotorcycle => m !== null);

  if (!hasPurchaseIntent(query)) {
    return {
      hits: [],
      text: 'Catálogo: 156.862 productos totales, 107.917 en stock. Marcas principales: Akrapovic, Leovince, Arrow, Scorpion, Yoshimura, Termignoni, Mivv, Giannelli.',
    };
  }

  const keywords = extractKeywords(query);
  if (keywords.length === 0) {
    return {
      hits: [],
      text: 'Resumen del catálogo: 156.862 productos totales, 107.917 en stock. Marcas principales: Akrapovic, Leovince, Arrow, Scorpion, Yoshimura, Termignoni, Mivv, Giannelli.',
    };
  }

  const keywordHits = await searchByKeywords(keywords, { garageMotos, limit: 8 });

  let garageHits: CatalogHit[] = [];
  if (garageMotos.length > 0 && keywordHits.length < 4) {
    garageHits = await searchByGarage(garageMotos, 4);
    const seen = new Set(keywordHits.map((h) => h.id));
    for (const g of garageHits) {
      if (!seen.has(g.id)) keywordHits.push(g);
    }
  }

  if (keywordHits.length === 0) {
    return {
      hits: [],
      text: 'Resumen del catálogo: 156.862 productos totales, 107.917 en stock. No se encontraron coincidencias exactas para la consulta.',
    };
  }

  const limit = 8;
  const finalHits = keywordHits.slice(0, limit);
  const text = finalHits.map(formatHitText).join('\n');

  return { hits: finalHits, text };
}

export async function getGarageContext(userId: number): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT first_name, last_name, garage FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return '';
    const user = result.rows[0] as { first_name: string | null; last_name: string | null; garage: any };

    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    let garage: any[] = [];
    try {
      if (user.garage) {
        garage = typeof user.garage === 'string' ? JSON.parse(user.garage) : user.garage;
      }
    } catch {
      garage = [];
    }

    const namePart = name ? `Nombre del cliente: ${name}.` : '';
    const garagePart = garage.length > 0
      ? `Motos en su garaje: ${garage.map((m) => `${m.brand || ''} ${m.model || ''} ${m.year || ''}`.trim()).join(', ')}. RECOMIENDA productos del catálogo que sean compatibles con estas motos cuando aplique.`
      : 'El cliente aún no tiene motos registradas en su garaje.';

    return `${namePart} ${garagePart}`.trim();
  } catch (err) {
    console.error('[chatbot] garage query failed:', err);
    return '';
  }
}

export function getGarageEntries(userId: number): Promise<string[]> {
  return pool
    .query(`SELECT garage FROM users WHERE id = $1`, [userId])
    .then((res) => {
      if (res.rows.length === 0) return [];
      const raw = res.rows[0].garage;
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter((e) => typeof e === 'string') : [];
      } catch {
        return [];
      }
    })
    .catch((err) => {
      console.error('[chatbot] garage entries fetch failed:', err);
      return [];
    });
}
