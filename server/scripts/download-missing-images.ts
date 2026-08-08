// Script de descarga de imágenes faltantes desde Bihr API.
// Descarga imágenes para productos que tienen supplier_code pero no tienen imágenes.
// Guarda en /app/server/uploads/optimized/{sanitized_sku}_0_{size}.webp
// Actualiza el campo 'images' en PostgreSQL con JSON array.
// Uso: tsx download-missing-images.ts [--limit N] [--offset N] [--batch N] [--concurrency N]

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Client } from 'pg';

const OPTIMIZED_DIR = path.resolve(process.cwd(), 'uploads', 'optimized');
if (!fs.existsSync(OPTIMIZED_DIR)) fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

const SIZES = [200, 400, 600, 800] as const;
const FORMAT = 'webp';
const IDX = 0; // imagen principal

const args = process.argv.slice(2);
const opt = (name: string, def?: number): number | undefined => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = parseInt(args[i + 1], 10);
  return isNaN(v) ? def : v;
};

const LIMIT = opt('limit');
const OFFSET = opt('offset', 0) ?? 0;
const BATCH = opt('batch', 100) ?? 100;
const CONCURRENCY = opt('concurrency', 8) ?? 8;

// ──────────────────────────────────────────────────────────────────────────────
// BIHR AUTH (copiado de bihrService.ts para ser autónomo)
// ──────────────────────────────────────────────────────────────────────────────

const BIHR_API_BASE = process.env.BIHR_API_BASE || 'https://api.bihr.net';
const BIHR_USERNAME = process.env.BIHR_USERNAME || 'info@escapesymas.com';
const BIHR_MACKEY = process.env.BIHR_MACKEY;

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

async function getBihrToken(): Promise<string> {
  const currentTime = Date.now();
  if (cachedToken && currentTime < tokenExpiryTime - 120000) {
    return cachedToken;
  }

  console.log('[BIHR] Solicitando nuevo token...');

  const formData = new URLSearchParams();
  formData.append('UserName', BIHR_USERNAME);
  formData.append('PassWord', BIHR_MACKEY!);

  const response = await fetch(`${BIHR_API_BASE}/api/v2.1/Authentication/Token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de autenticación Bihr (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiryTime = currentTime + (data.expires_in * 1000);

  console.log('[BIHR] Token obtenido.');
  return cachedToken;
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function sanitizeSkuForFilename(sku: string | null | undefined): string {
  if (!sku) return '';
  return String(sku).replace(/[^A-Za-z0-9._-]/g, '_');
}

async function downloadImageBuffer(supplierCode: string, token: string): Promise<Buffer | null> {
  try {
    const url = `${BIHR_API_BASE}/api/v2.1/Products/Image/${encodeURIComponent(supplierCode)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/jpeg,image/png,image/webp,image/*'
      }
    });

    if (!response.ok) {
      console.warn(`[BIHR] HTTP ${response.status} para supplier_code=${supplierCode}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`[BIHR] Error descargando imagen para ${supplierCode}:`, err);
    return null;
  }
}

async function resizeAndSave(input: Buffer, skuSafe: string): Promise<{ size: number; bytes: number }[]> {
  const results: { size: number; bytes: number }[] = [];

  for (const size of SIZES) {
    const filename = `${skuSafe}_${IDX}_${size}.${FORMAT}`;
    const filepath = path.join(OPTIMIZED_DIR, filename);

    // Skip si ya existe y no está vacío
    if (fs.existsSync(filepath)) {
      try {
        const st = fs.statSync(filepath);
        if (st.size > 0) {
          results.push({ size, bytes: st.size });
          continue;
        }
      } catch {}
    }

    try {
      const optimized = await sharp(input)
        .resize({ width: size, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      fs.writeFileSync(filepath, optimized);
      results.push({ size, bytes: optimized.length });
    } catch (e: any) {
      console.error(`  [SHARP] Error ${filename}: ${e.message}`);
    }
  }

  return results;
}

function buildImagesJson(skuSafe: string): Array<{ alt: string; url: string; sizes: Record<string, string> }> {
  return [
    {
      alt: `Imagen principal para ${skuSafe}`,
      url: `/uploads/optimized/${skuSafe}_${IDX}_800.${FORMAT}`,
      sizes: {
        '200': `/uploads/optimized/${skuSafe}_${IDX}_200.${FORMAT}`,
        '400': `/uploads/optimized/${skuSafe}_${IDX}_400.${FORMAT}`,
        '600': `/uploads/optimized/${skuSafe}_${IDX}_600.${FORMAT}`,
        '800': `/uploads/optimized/${skuSafe}_${IDX}_800.${FORMAT}`
      }
    }
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: number;
  sku: string;
  supplier_code: string;
  images: any;
}

async function processProduct(client: Client, row: ProductRow, token: string): Promise<{ ok: boolean; downloaded: number }> {
  const sku = row.sku || '';
  const supplierCode = row.supplier_code || '';

  if (!supplierCode) return { ok: false, downloaded: 0 };

  const skuSafe = sanitizeSkuForFilename(sku || supplierCode);
  if (!skuSafe) return { ok: false, downloaded: 0 };

  // Verificar si las imágenes ya existen en disco
  const firstFile = path.join(OPTIMIZED_DIR, `${skuSafe}_${IDX}_800.${FORMAT}`);
  if (fs.existsSync(firstFile)) {
    // Ya existe en disco, solo actualizar DB si hace falta
    const imagesJson = buildImagesJson(skuSafe);
    try {
      await client.query(
        'UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(imagesJson), row.id]
      );
      return { ok: true, downloaded: 0 };
    } catch (e: any) {
      console.error(`[DB] Error actualizando producto ${row.id}: ${e.message}`);
      return { ok: false, downloaded: 0 };
    }
  }

  // Descargar imagen desde Bihr
  const buffer = await downloadImageBuffer(supplierCode, token);
  if (!buffer) return { ok: false, downloaded: 0 };

  // Resize a todos los tamaños
  const saved = await resizeAndSave(buffer, skuSafe);
  if (saved.length === 0) return { ok: false, downloaded: 0 };

  // Actualizar base de datos
  const imagesJson = buildImagesJson(skuSafe);
  try {
    await client.query(
      'UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(imagesJson), row.id]
    );
    return { ok: true, downloaded: saved.length };
  } catch (e: any) {
    console.error(`[DB] Error actualizando producto ${row.id}: ${e.message}`);
    return { ok: false, downloaded: 0 };
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log(`[INFO] Concurrency=${CONCURRENCY} Batch=${BATCH} Limit=${LIMIT ?? '∞'} Offset=${OFFSET}`);
  console.log(`[INFO] OPTIMIZED_DIR=${OPTIMIZED_DIR}`);

  // Contar productos sin imágenes
  const countR = await client.query(`
    SELECT count(*) as c FROM products
    WHERE (images IS NULL OR images::text = '[]' OR images::text = '' OR images::text = '[{}]' OR images::text = '[{}}]')
      AND supplier_code IS NOT NULL
      AND supplier_code != ''
  `);
  const totalProducts = parseInt(countR.rows[0].c, 10);
  console.log(`[INFO] Productos sin imágenes con supplier_code: ${totalProducts}`);

  if (totalProducts === 0) {
    console.log('[INFO] No hay productos que procesar. Saliendo.');
    await client.end();
    return;
  }

  let offset = OFFSET;
  let processed = 0;
  let totalDownloaded = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  const t0 = Date.now();

  // Obtener token una vez al inicio (se refresca automáticamente si expira)
  let token: string;
  try {
    token = await getBihrToken();
  } catch (e: any) {
    console.error('[FATAL] No se pudo obtener token de Bihr:', e.message);
    await client.end();
    process.exit(1);
  }

  while (true) {
    if (LIMIT && processed >= LIMIT) break;

    const r = await client.query<ProductRow>(`
      SELECT id, sku, supplier_code, images
      FROM products
      WHERE (images IS NULL OR images::text = '[]' OR images::text = '' OR images::text = '[{}]' OR images::text = '[{}}]')
        AND supplier_code IS NOT NULL
        AND supplier_code != ''
      ORDER BY id
      LIMIT $1 OFFSET $2
    `, [BATCH, offset]);

    if (r.rows.length === 0) break;

    // Procesar en paralelo con concurrencia limitada
    for (let i = 0; i < r.rows.length; i += CONCURRENCY) {
      const slice = r.rows.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        slice.map(row => processProduct(client, row, token))
      );

      for (let j = 0; j < results.length; j++) {
        const res = results[j];
        const row = slice[j];

        if (res.status === 'fulfilled') {
          if (res.value.ok) {
            totalDownloaded += res.value.downloaded;
          } else {
            totalSkipped++;
          }
        } else {
          totalErrors++;
          console.error(`[ERR] producto ${row.id} (${row.sku}): ${res.reason?.message}`);
        }

        processed++;

        if (processed % 100 === 0 || processed === totalProducts) {
          const elapsed = (Date.now() - t0) / 1000;
          const rate = processed / elapsed;
          const remaining = totalProducts - processed;
          const eta = remaining / rate;
          console.log(
            `[PROGRESS] processed=${processed}/${totalProducts} downloaded=${totalDownloaded} skipped=${totalSkipped} errors=${totalErrors} rate=${rate.toFixed(1)}/s ETA=${eta.toFixed(0)}s`
          );
        }
      }
    }

    offset += BATCH;
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[DONE] processed=${processed} downloaded=${totalDownloaded} skipped=${totalSkipped} errors=${totalErrors} elapsed=${elapsed}s`);

  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
