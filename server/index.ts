import express from 'express';
import nodemailer from 'nodemailer';
import fs from 'fs';
import os from 'os';
import { execSync, exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
import path from 'path';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq, desc, and } from 'drizzle-orm';
import {
  pgTable, serial, text, varchar, timestamp, integer
} from 'drizzle-orm/pg-core';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { 
  getLiveStockLevel, getLiveStockValue, checkProductsInfo, createBihrOrder, syncBihrCatalog 
} from './bihrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================================================
// CONFIGURACIÓN
// ================================================================
const PORT = process.env.PORT || 3001;
const WP_URL = process.env.WP_URL || 'https://backendescapes.com';
const WOO_KEY = process.env.WOO_KEY || 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9';
const WOO_SECRET = process.env.WOO_SECRET || 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a';

// Bypass SSL para WordPress legacy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ================================================================
// BASE DE DATOS (PostgreSQL localhost en VPS)
// ================================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
  ssl: false
});

const db = drizzle(pool);

// Startup Database Alignment for Accounting Columns
(async () => {
  try {
    console.log('🔌 Aligning database schema for accounting and moderation...');
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

      ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0;
      ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_closed INTEGER DEFAULT 0;

      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL,
        value INTEGER NOT NULL,
        active INTEGER DEFAULT 1,
        expires_at TIMESTAMP,
        max_uses INTEGER DEFAULT 999999,
        times_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS seo_autolinks (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL UNIQUE,
        url VARCHAR(500) NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        items TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL UNIQUE,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        subtotal INTEGER DEFAULT 0,
        tax_amount INTEGER DEFAULT 0,
        shipping_cost INTEGER DEFAULT 0,
        discount_amount INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        pdf_path TEXT,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS image_regen_state (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'idle',
        processed INTEGER DEFAULT 0,
        success INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        skipped INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        current_sku VARCHAR(255) DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO image_regen_state (id, status) VALUES (1, 'idle') ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Database schema aligned successfully!');
    // Cargar índice de compatibilidades en segundo plano
    initCompatIndex().catch(e => console.error('[COMPAT INDEX INITIAL LOAD ERROR]:', e));
  } catch (err) {
    console.error('❌ Failed to align database schema:', err);
  }
})();

// Esquema inline (replica de lib/schema.ts)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  wpId: integer('wp_id').unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  rankLevel: integer('rank_level').default(1),
  rankXp: integer('rank_xp').default(0),
  role: varchar('role', { length: 20 }).default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const forumPosts = pgTable('forum_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('general'),
  likes: integer('likes').default(0),
  viewCount: integer('view_count').default(0),
  isPinned: integer('is_pinned').default(0),
  isClosed: integer('is_closed').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const forumReplies = pgTable('forum_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const forumLikes = pgTable('forum_likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  contentId: integer('content_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const garage = pgTable('garage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: varchar('year', { length: 20 }).notNull(),
  isPrimary: integer('is_primary').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  total: integer('total').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  paymentId: varchar('payment_id', { length: 255 }),
  shippingData: text('shipping_data'),
  subtotal: integer('subtotal').default(0),
  discountAmount: integer('discount_amount').default(0),
  shippingCost: integer('shipping_cost').default(0),
  promoCode: varchar('promo_code', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  bihrTicketId: varchar('bihr_ticket_id', { length: 255 }),
  dropshippingStatus: varchar('dropshipping_status', { length: 50 }).default('not_sent'),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  costTotal: integer('cost_total').default(0),
});

const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id'),
  productId: integer('product_id'),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
});

const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(),
  value: integer('value').notNull(),
  active: integer('active').default(1),
  expiresAt: timestamp('expires_at'),
  maxUses: integer('max_uses').default(999999),
  timesUsed: integer('times_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

const seoAutolinks = pgTable('seo_autolinks', {
  id: serial('id').primaryKey(),
  keyword: varchar('keyword', { length: 255 }).notNull().unique(),
  url: varchar('url', { length: 500 }).notNull(),
  active: integer('active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'global', 'category', 'brand'
  targetId: varchar('target_id', { length: 100 }), // brand name or category ID
  marginPercent: integer('margin_percent').notNull(),
  active: integer('active').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});


// ================================================================
// EXPRESS APP
// ================================================================
const app: any = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: ['https://escapesymas.com', 'https://www.escapesymas.com', 'https://test.escapesymas.com', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  exposedHeaders: ['X-WP-Total', 'X-WP-TotalPages']
}));

// Configuración de directorio de uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Archivos estáticos ANTES del rate limiting
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
  }
}));

// ================================================================
// RATE LIMITING BÁSICO (100 req/min por IP) - Excluye uploads y health
// ================================================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60000;

const rateLimitSkipPaths = ['/uploads', '/api/health', '/api/catalog'];

app.use((req: any, res: any, next: any) => {
  const path = req.path || req.url || '';
  
  // Skip rate limiting para rutas específicas
  if (rateLimitSkipPaths.some(p => path.startsWith(p))) {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
  }

  record.count++;
  next();
});

// Limpiar mapa de rate limiting cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) rateLimitStore.delete(ip);
  }
}, 300000);

app.use(express.json({ limit: '10mb' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload/avatar', upload.single('avatar'), async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se ha subido ningún archivo' });

    const { userId } = req.body;
    const url = `/uploads/${file.filename}`;

    if (userId) {
      await db.execute(sql`
        UPDATE users
        SET avatar_url = ${url}
        WHERE id = ${parseInt(userId)}
      `);
    }

    return res.json({ success: true, url });
  } catch (err: any) {
    console.error('[UPLOAD ERROR]:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================================================================
// SISTEMA DE CACHÉ EN MEMORIA (SWR - Stale While Revalidate)
// ================================================================
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

class SWRMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries = 1000;

  public get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.staleAt) {
      this.cache.delete(key);
      return null;
    }
    return {
      data: entry.data,
      isStale: now > entry.expiresAt
    };
  }

  public set(key: string, data: any, ttlSeconds: number, staleGraceSeconds: number): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + (ttlSeconds * 1000),
      staleAt: now + ((ttlSeconds + staleGraceSeconds) * 1000)
    });
  }

  public invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const swrCache = new SWRMemoryCache();

async function executeSWR<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number,
  staleGraceSeconds: number
): Promise<T> {
  const cached = swrCache.get<T>(key);

  if (cached) {
    if (cached.isStale) {
      fetchFn()
        .then(freshData => {
          swrCache.set(key, freshData, ttlSeconds, staleGraceSeconds);
        })
        .catch(err => {
          console.error(`[SWR] Background fetch failed for key ${key}:`, err);
        });
    }
    return cached.data;
  }

  const freshData = await fetchFn();
  swrCache.set(key, freshData, ttlSeconds, staleGraceSeconds);
  return freshData;
}


// ================================================================
// HELPERS DE SEGURIDAD
// ================================================================
function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/'/g, "''").replace(/[^\x20-\x7E]/g, '').substring(0, 1000);
}

function sanitizeLike(str: string): string {
  return sanitizeString(str).replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function parseIntSafe(value: any): number | null {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

// ================================================================
// HEALTH CHECK
// ================================================================
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = 0;
  
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }

  res.json({ 
    status: 'ok', 
    version: '1.0.0', 
    db: dbStatus,
    dbLatency: `${dbLatency}ms`,
    timestamp: new Date().toISOString() 
  });
});

// ================================================================
// BIHR API INTEGRATION ROUTES
// ================================================================
app.get('/api/bihr/stock', async (req: any, res: any) => {
  const { productCode } = req.query;
  if (!productCode) {
    return res.status(400).json({ error: 'Falta el parámetro productCode (referencia de Bihr)' });
  }
  try {
    const status = await getLiveStockLevel(productCode as string);
    const quantity = await getLiveStockValue(productCode as string);
    res.json({ productCode, status, quantity });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar stock en Bihr', details: error.message });
  }
});

app.post('/api/bihr/check-stock', async (req: any, res: any) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Falta la lista de items o no es un array válido' });
  }
  try {
    const results = await checkProductsInfo(items);
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar disponibilidad en lote', details: error.message });
  }
});

app.post('/api/bihr/order', async (req: any, res: any) => {
  const { deliveryAddress, items, customerOrderReference, isDropshipping } = req.body;
  if (!deliveryAddress || !items || !customerOrderReference) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para emitir el pedido' });
  }
  try {
    const orderResult = await createBihrOrder({
      deliveryAddress,
      items,
      customerOrderReference,
      isDropshipping: !!isDropshipping
    });
    res.json({ success: true, orderResult });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al emitir pedido en Bihr', details: error.message });
  }
});

app.post('/api/bihr/sync-catalog', async (req: any, res: any) => {
  const { catalogType } = req.body;
  try {
    // Disparar en segundo plano de manera asíncrona para evitar timeout HTTP
    syncBihrCatalog(catalogType || 'HardPart')
      .then(success => {
        console.log(`[BIHR SYNC BACKGROUND]: Sincronización finalizada con éxito: ${success}`);
      })
      .catch(err => {
        console.error('[BIHR SYNC BACKGROUND ERROR]:', err);
      });

    res.json({ 
      success: true, 
      message: 'Sincronización iniciada en segundo plano. Puedes monitorear el progreso en el panel.' 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al iniciar la sincronización', details: error.message });
  }
});

app.get('/api/bihr/sync-status', async (req: any, res: any) => {
  try {
    // 1. Leer estado de imágenes desde PostgreSQL (migrado de /tmp/image_regen_state.json)
    let imageStats: any = null;
    try {
      const stateResult = await pool.query('SELECT * FROM image_regen_state WHERE id = 1');
      if (stateResult.rows.length > 0) {
        imageStats = stateResult.rows[0];
      }
    } catch (e) {
      // Fallback a fichero legacy si existe
      const imageStateFile = '/tmp/image_regen_state.json';
      if (fs.existsSync(imageStateFile)) {
        try {
          imageStats = JSON.parse(fs.readFileSync(imageStateFile, 'utf-8'));
        } catch {} 
      }
    }

    // 2. Leer estado de catálogo
    let catalogStats: any = null;
    const catalogStateFile = '/tmp/catalog_sync_state.json';
    if (fs.existsSync(catalogStateFile)) {
      try {
        catalogStats = JSON.parse(fs.readFileSync(catalogStateFile, 'utf-8'));
      } catch (e) {}
    }

    // 3. Comprobar si PM2 tiene el proceso image_downloader activo
    let imageDownloaderRunning = false;
    let pm2Status = 'stopped';
    try {
      const { stdout } = await execPromise('pm2 jlist');
      const pm2List = JSON.parse(stdout);
      const proc = pm2List.find((p: any) => p.name === 'image_downloader');
      if (proc) {
        pm2Status = proc.pm2_env?.status || 'stopped';
        imageDownloaderRunning = pm2Status === 'online';
      }
    } catch (e) {
      console.error('[BIHR SYNC STATUS ERROR]: Error checking PM2 status:', e);
    }

    res.json({
      success: true,
      images: {
        ...(imageStats || { status: 'idle' }),
        pm2Status,
        running: imageDownloaderRunning
      },
      catalog: catalogStats || { status: 'idle' }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener estado de sincronización', details: error.message });
  }
});

app.post('/api/bihr/sync-images/control', async (req: any, res: any) => {
  const { action } = req.body;
  if (!['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ error: 'Acción no válida. Use: start, stop o restart' });
  }

  try {
    // Comprobar si el proceso está registrado en PM2
    let exists = false;
    try {
      const { stdout } = await execPromise('pm2 jlist');
      const pm2List = JSON.parse(stdout);
      exists = pm2List.some((p: any) => p.name === 'image_downloader');
    } catch (e) {}

    let command = '';
    if (action === 'start') {
      if (exists) {
        command = 'pm2 start image_downloader';
      } else {
        // Registrar e iniciar si no existe
        const scriptPath = path.join(process.cwd(), 'scripts', 'download_images_from_zip.py');
        command = `pm2 start "${scriptPath}" --name image_downloader --interpreter python3 -- --zip /tmp/bihr_catalog.zip --delay 0.3`;
      }
    } else if (action === 'stop') {
      command = 'pm2 stop image_downloader';
    } else if (action === 'restart') {
      command = 'pm2 restart image_downloader';
    }

    console.log(`[BIHR CONTROL]: Ejecutando comando: ${command}`);
    const { stdout } = await execPromise(command);
    res.json({ success: true, message: `Acción ${action} ejecutada correctamente`, output: stdout });
  } catch (error: any) {
    res.status(500).json({ error: `Fallo al ejecutar acción ${action} de imágenes`, details: error.message });
  }
});

let compatIndex: Map<string, Map<number, Array<{ sku: string, model: string }>>> | null = null;
let isIndexLoading = false;

async function initCompatIndex() {
  if (isIndexLoading) return;
  isIndexLoading = true;
  console.log('⚡ Loading compatibility index into memory...');
  const start = Date.now();
  try {
    const res = await pool.query(
      `SELECT sku, compatibility FROM products WHERE status = 'published' AND compatibility IS NOT NULL AND compatibility != '[]'`
    );
    const newIndex = new Map<string, Map<number, Array<{ sku: string, model: string }>>>();
    for (const row of res.rows) {
      if (!row.compatibility) continue;
      for (const item of row.compatibility) {
        if (!item.brand) continue;
        const bKey = item.brand.toLowerCase();
        const yKey = Number(item.year);
        if (isNaN(yKey)) continue;
        
        let yearMap = newIndex.get(bKey);
        if (!yearMap) {
          yearMap = new Map();
          newIndex.set(bKey, yearMap);
        }
        
        let list = yearMap.get(yKey);
        if (!list) {
          list = [];
          yearMap.set(yKey, list);
        }
        
        list.push({ sku: row.sku, model: item.model });
      }
    }
    compatIndex = newIndex;
    console.log(`✅ Compatibility index ready! Loaded ${newIndex.size} brands in ${Date.now() - start}ms`);
  } catch (err) {
    console.error('❌ Failed to build compatibility index:', err);
  } finally {
    isIndexLoading = false;
  }
}

// Recargar el índice cada 15 minutos para capturar importaciones externas
setInterval(() => {
  initCompatIndex().catch(e => console.error('[COMPAT INDEX AUTO REFRESH ERROR]:', e));
}, 15 * 60 * 1000);

// ================================================================
// VEHICLE DISCOVERY & COMPATIBILITY
// ================================================================
let catalog: any = null;
function getCatalog() {
  if (!catalog) {
    const filePath = path.join(__dirname, 'moto_catalog.json');
    if (!fs.existsSync(filePath)) {
      const altPath = path.join(process.cwd(), 'moto_catalog.json');
      if (fs.existsSync(altPath)) {
        catalog = JSON.parse(fs.readFileSync(altPath, 'utf-8'));
      } else {
        // Intenta cargarlo del directorio server/
        const serverPath = path.join(process.cwd(), 'server', 'moto_catalog.json');
        if (fs.existsSync(serverPath)) {
          catalog = JSON.parse(fs.readFileSync(serverPath, 'utf-8'));
        } else {
          throw new Error(`Catalog missing. Searched in: ${filePath}, ${altPath} and ${serverPath}`);
        }
      }
    } else {
      catalog = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  }
  return catalog;
}

app.get('/api/vehicles', async (req, res) => {
  const { action, brand, model, year } = req.query as any;

  try {
    const cacheKey = `/api/vehicles?action=${action || ''}&brand=${brand || ''}&model=${model || ''}&year=${year || ''}`;

    // Cachar jerarquía de vehículos por 5 min fresca, 30 min grace (SWR)
    const result = await executeSWR(cacheKey, async () => {
      try {
        const { hierarchy, compatibility } = getCatalog();

        if (action === 'brands') {
          return Object.keys(hierarchy).sort();
        }

        if (action === 'models') {
          return Object.keys(hierarchy[brand] || {}).sort();
        }

        if (action === 'years') {
          return Object.keys(hierarchy[brand]?.[model] || {}).sort((a: any, b: any) => b - a);
        }

        if (action === 'compatible-skus') {
          const skusSet = new Set<string>();

          // 1. Obtener SKUs compatibles desde la base de datos (compatibilidades sincronizadas) usando el índice en memoria
          if (brand) {
            const bKey = brand.toLowerCase();
            const mKey = model ? model.toLowerCase() : '';
            const yNum = year && year !== 'General' && year !== '' ? parseInt(year) : null;

            if (compatIndex) {
              const yearMap = compatIndex.get(bKey);
              if (yearMap) {
                if (yNum) {
                  const list = yearMap.get(yNum);
                  if (list) {
                    for (const item of list) {
                      if (mKey) {
                        const cModel = item.model?.toLowerCase() || '';
                        if (!cModel.includes(mKey) && !mKey.includes(cModel)) continue;
                      }
                      skusSet.add(item.sku);
                    }
                  }
                } else {
                  // Si no hay año, recorremos todos los años para esta marca
                  for (const list of yearMap.values()) {
                    for (const item of list) {
                      if (mKey) {
                        const cModel = item.model?.toLowerCase() || '';
                        if (!cModel.includes(mKey) && !mKey.includes(cModel)) continue;
                      }
                      skusSet.add(item.sku);
                    }
                  }
                }
              }
            } else {
              // Fallback directo a la base de datos si el índice no está listo aún
              console.warn('[VEHICLES COMPATIBILITY]: Index not ready, falling back to slow DB query');
              const params: any[] = [brand];
              let queryStr = `
                SELECT DISTINCT sku 
                FROM products 
                WHERE status = 'published' 
                  AND compatibility IS NOT NULL 
                  AND compatibility != '[]'
                  AND EXISTS (
                    SELECT 1 FROM jsonb_array_elements(compatibility) elem
                    WHERE LOWER(elem->>'brand') = LOWER($1)
              `;
              
              let paramIdx = 2;
              if (yNum) {
                queryStr += ` AND (elem->>'year')::int = $${paramIdx++}`;
                params.push(yNum);
              }
              if (mKey) {
                queryStr += ` AND (
                  LOWER(elem->>'model') LIKE $${paramIdx}
                  OR $${paramIdx + 1} LIKE CONCAT('%', LOWER(elem->>'model'), '%')
                )`;
                params.push(`%${mKey}%`);
                params.push(mKey);
              }
              queryStr += `)`; // cierra EXISTS
              
              try {
                const dbRes = await pool.query(queryStr, params);
                dbRes.rows.forEach((r: any) => {
                  if (r.sku) skusSet.add(r.sku);
                });
              } catch (dbErr) {
                console.error('[VEHICLES DB COMPATIBILITY ERROR]:', dbErr);
              }
            }
          }

          // 2. Obtener SKUs compatibles desde moto_catalog.json (compatibilidades estáticas)
          if (brand && hierarchy[brand]) {
            let codes: string[] = [];
            if (model) {
              if (year && year !== 'General' && year !== '') {
                codes = hierarchy[brand][model]?.[year] || [];
              } else if (hierarchy[brand][model]) {
                Object.values(hierarchy[brand][model]).forEach((cList: any) => {
                  codes.push(...cList);
                });
              }
            } else {
              Object.values(hierarchy[brand]).forEach((modelsObj: any) => {
                if (modelsObj) {
                  Object.values(modelsObj).forEach((cList: any) => {
                    codes.push(...cList);
                  });
                }
              });
            }

            codes.forEach(code => {
              const vehicleSkus = compatibility[code] || [];
              vehicleSkus.forEach((sku: string) => skusSet.add(sku));
            });
          }

          return Array.from(skusSet);
        }

        throw new Error('Acción no válida');
      } catch (swrErr: any) {
        console.error('[VEHICLES SWR ERROR]:', swrErr);
        // Fallback: if moto_catalog.json is missing, query DB directly
        if (action === 'brands') {
          const result = await db.execute(sql`SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand`);
          return result.rows.map((r: any) => r.brand);
        }
        if (action === 'models' || action === 'years' || action === 'compatible-skus') {
          return [];
        }
        throw new Error('Acción no válida');
      }
    }, 300, 1800);

    return res.json(result);
  } catch (err: any) {
    console.error('[VEHICLES ERROR]:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================================================================
// CATÁLOGO PÚBLICO (sin autenticación)
// ================================================================
app.get('/api/catalog/products', async (req, res) => {
  try {
    const { search, category_id, page = '1', per_page = '20' } = req.query as any;
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const offset = (pageNum - 1) * perPage;

    const cacheKey = `/api/catalog/products?search=${search || ''}&category_id=${category_id || ''}&page=${page}&per_page=${per_page}`;

    // Catálogo público: 1 min de datos frescos, 10 min de gracia SWR
    const result = await executeSWR(cacheKey, async () => {
      let baseWhereClause = "WHERE status = 'published' AND name NOT LIKE 'Aplicaciones:%' AND name NOT LIKE 'Applications:%' AND sku NOT LIKE 'Aplicaciones:%' AND sku NOT LIKE 'Applications:%'";

      if (search) {
        const s = sanitizeLike(search);
        baseWhereClause += ` AND (
          LOWER(name) LIKE LOWER('%${s}%') ESCAPE '\\' 
          OR LOWER(sku) LIKE LOWER('%${s}%') ESCAPE '\\' 
          OR LOWER(description) LIKE LOWER('%${s}%') ESCAPE '\\'
          OR LOWER(supplier_code) LIKE LOWER('%${s}%') ESCAPE '\\'
          OR LOWER(barcode) LIKE LOWER('%${s}%') ESCAPE '\\'
          OR LOWER(old_part_number) LIKE LOWER('%${s}%') ESCAPE '\\'
        )`;
      }

      if (category_id) {
        const catId = parseInt(category_id);
        if (!isNaN(catId)) {
          if (catId >= 100) {
            const parentId = Math.floor(catId / 100);
            const categoryRules: Record<number, string> = {
              101: "(LOWER(name) LIKE '%racing%' OR LOWER(name) LIKE '%completo%')",
              102: "(LOWER(name) LIKE '%silenciador%' OR LOWER(name) LIKE '%silencioso%' OR LOWER(name) LIKE '%slip-on%' OR LOWER(name) LIKE '%escape%')",
              103: "(LOWER(name) LIKE '%colector%' OR LOWER(name) LIKE '%header%')",
              104: "(LOWER(name) LIKE '%accesorio%')",
              201: "(LOWER(name) LIKE '%pastilla%' OR LOWER(name) LIKE '%pad%')",
              202: "(LOWER(name) LIKE '%disco%' OR LOWER(name) LIKE '%disc%')",
              203: "(LOWER(name) LIKE '%bomba%' OR LOWER(name) LIKE '%pump%')",
              204: "(LOWER(name) LIKE '%latiguillo%' OR LOWER(name) LIKE '%line%')",
              301: "(LOWER(name) LIKE '%amortiguador%' OR LOWER(name) LIKE '%shock%')",
              302: "(LOWER(name) LIKE '%horquilla%' OR LOWER(name) LIKE '%fork%')",
              303: "(LOWER(name) LIKE '%direccion%' OR LOWER(name) LIKE '%steering%')",
              304: "(LOWER(name) LIKE '%estribera%' OR LOWER(name) LIKE '%peg%')",
              401: "(LOWER(name) LIKE '%centralita%' OR LOWER(name) LIKE '%ecu%')",
              402: "(LOWER(name) LIKE '%quickshifter%' OR LOWER(name) LIKE '%shifter%')",
              403: "(LOWER(name) LIKE '%abs%' OR LOWER(name) LIKE '%tc%')",
              404: "(LOWER(name) LIKE '%litio%' OR LOWER(name) LIKE '%lithium%')",
              501: "(LOWER(name) LIKE '%kit%')",
              502: "(LOWER(name) LIKE '%cadena%' OR LOWER(name) LIKE '%chain%')",
              503: "(LOWER(name) LIKE '%piñon%' OR LOWER(name) LIKE '%sprocket%')",
              504: "(LOWER(name) LIKE '%corona%')",
              601: "(LOWER(name) LIKE '%filtro%' OR LOWER(name) LIKE '%filter%')",
              602: "(LOWER(name) LIKE '%filtro aceite%')",
              603: "(LOWER(name) LIKE '%aceite%' OR LOWER(name) LIKE '%oil%')",
              604: "(LOWER(name) LIKE '%liquido%' OR LOWER(name) LIKE '%fluid%')",
              701: "(LOWER(name) LIKE '%neumatico%' OR LOWER(name) LIKE '%tire%' OR LOWER(name) LIKE '%slick%')",
              702: "(LOWER(name) LIKE '%calentador%' OR LOWER(name) LIKE '%warmer%')",
              703: "(LOWER(name) LIKE '%caballete%' OR LOWER(name) LIKE '%stand%')",
              704: "(LOWER(name) LIKE '%manometro%' OR LOWER(name) LIKE '%gauge%')",
              801: "(LOWER(name) NOT LIKE '%modular%' AND LOWER(name) NOT LIKE '%flip-up%' AND LOWER(name) NOT LIKE '%system%' AND LOWER(name) NOT LIKE '%jet%' AND LOWER(name) NOT LIKE '%open face%' AND LOWER(name) NOT LIKE '%open-face%' AND LOWER(name) NOT LIKE '%off-road%' AND LOWER(name) NOT LIKE '%offroad%' AND LOWER(name) NOT LIKE '%cross%' AND LOWER(name) NOT LIKE '%enduro%' AND LOWER(name) NOT LIKE '%trial%' AND LOWER(name) NOT LIKE '%dual-sport%' AND LOWER(name) NOT LIKE '%dualsport%')",
              802: "(LOWER(name) LIKE '%modular%' OR LOWER(name) LIKE '%flip-up%' OR LOWER(name) LIKE '%system%')",
              803: "(LOWER(name) LIKE '%jet%' OR LOWER(name) LIKE '%open face%' OR LOWER(name) LIKE '%open-face%')",
              804: "(LOWER(name) LIKE '%off-road%' OR LOWER(name) LIKE '%offroad%' OR LOWER(name) LIKE '%cross%' OR LOWER(name) LIKE '%enduro%' OR LOWER(name) LIKE '%trial%' OR LOWER(name) LIKE '%dual-sport%' OR LOWER(name) LIKE '%dualsport%')",
              901: "(LOWER(name) LIKE '%chaqueta%' OR LOWER(name) LIKE '%jacket%')",
              902: "(LOWER(name) LIKE '%mono%' AND LOWER(name) NOT LIKE '%glove%' AND LOWER(name) NOT LIKE '%guante%' AND LOWER(name) NOT LIKE '%pants%' AND LOWER(name) NOT LIKE '%pantalón%' AND LOWER(name) NOT LIKE '%jersey%' AND LOWER(name) NOT LIKE '%camiseta%' AND LOWER(name) NOT LIKE '%chaqueta%' AND LOWER(name) NOT LIKE '%bota%')",
              903: "(LOWER(name) LIKE '%guante%' OR LOWER(name) LIKE '%glove%')",
              904: "(LOWER(name) LIKE '%bota%' OR LOWER(name) LIKE '%boot%')",
              1001: "(LOWER(name) LIKE '%baul%' OR LOWER(name) LIKE '%maleta%' OR LOWER(name) LIKE '%case%')",
              1002: "(LOWER(name) LIKE '%quad lock%')",
              1003: "(LOWER(name) LIKE '%intercom%')",
              1004: "(LOWER(name) LIKE '%retrovisor%' OR LOWER(name) LIKE '%espejo%' OR LOWER(name) LIKE '%mirror%')",
              805: "(LOWER(name) LIKE '%recambio%' OR LOWER(name) LIKE '%accesorio%' OR LOWER(name) LIKE '%pieza%' OR LOWER(name) LIKE '%almohadilla%' OR LOWER(name) LIKE '%visera%' OR LOWER(name) LIKE '%pantalla%' OR LOWER(name) LIKE '%pinlock%')",
              1005: "(LOWER(name) LIKE '%promocional%' OR LOWER(name) LIKE '%goodie%' OR LOWER(name) LIKE '%display%')"
            };
            const clause = categoryRules[catId];
            if (clause) {
              baseWhereClause += ` AND (category_id = ${catId} OR category2_id = ${catId} OR category3_id = ${catId} OR (category_id = ${parentId} AND ${clause}))`;
            } else {
              baseWhereClause += ` AND (category_id = ${catId} OR category2_id = ${catId} OR category3_id = ${catId})`;
            }
          } else {
            baseWhereClause += ` AND (category_id = ${catId} OR category_id BETWEEN ${catId * 100} AND ${(catId + 1) * 100 - 1})`;
          }
        }
      }

      const countQuery = `SELECT count(DISTINCT split_part(name, ',', 1)) as total FROM products ${baseWhereClause}`;
      const selectQuery = `
        SELECT * FROM (
          SELECT DISTINCT ON (split_part(name, ',', 1)) * 
          FROM products 
          ${baseWhereClause}
          ORDER BY split_part(name, ',', 1), stock DESC, id ASC
        ) distinct_products
        ORDER BY created_at DESC 
        LIMIT ${perPage} OFFSET ${offset}
      `;

      const countRes = await db.execute(sql.raw(countQuery));
      const total = Number(countRes.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / perPage) || 1;

      const productsRes = await db.execute(sql.raw(selectQuery));
      const products = productsRes.rows.map(mapProductToFrontend);

      return { products, total, totalPages };
    }, 60, 600);

    res.setHeader('Access-Control-Expose-Headers', 'X-WP-Total, X-WP-TotalPages');
    res.setHeader('X-WP-Total', result.total.toString());
    res.setHeader('X-WP-TotalPages', result.totalPages.toString());
    res.json(result.products);
  } catch (err: any) {
    console.error('[CATALOG ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/catalog/product/:id', async (req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM products WHERE id = ${parseInt(req.params.id)} AND status = 'published'`);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(mapProductToFrontend(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/catalog/product-by-sku/:sku/variants', async (req, res) => {
  try {
    const sku = req.params.sku;
    const productRes = await db.execute(sql`SELECT * FROM products WHERE sku = ${sku}`);
    if (productRes.rows.length === 0) return res.json([]);
    
    const product = productRes.rows[0];
    let parentSku = '';
    
    if (product.attributes) {
      let attrs: any = {};
      try {
        attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      } catch (e) {}
      parentSku = attrs.parent_sku || '';
    }
    
    if (parentSku) {
      const variantsRes = await db.execute(sql`
        SELECT * FROM products 
        WHERE attributes->>'parent_sku' = ${parentSku} 
          AND status = 'published'
        ORDER BY price ASC
      `);
      return res.json(variantsRes.rows.map(mapProductToFrontend));
    }
    
    const baseName = (product as any).name?.split(',')[0].trim() || '';
    if (baseName.length > 8) {
      const variantsRes = await db.execute(sql`
        SELECT * FROM products 
        WHERE name LIKE ${baseName + '%'} 
          AND status = 'published'
        ORDER BY price ASC
        LIMIT 100
      `);
      return res.json(variantsRes.rows.map(mapProductToFrontend));
    }
    
    return res.json([mapProductToFrontend(product)]);
  } catch (err: any) {
    console.error('[VARIANTS ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/catalog/product-compatibility/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.json([]);
    
    const productRes = await db.execute(sql`SELECT compatibility FROM products WHERE id = ${id}`);
    if (productRes.rows.length === 0) return res.json([]);
    
    const row = productRes.rows[0];
    let compatibility: any[] = [];
    try {
      compatibility = row.compatibility ? JSON.parse(row.compatibility as string) : [];
    } catch (e) {}
    
    return res.json(compatibility);
  } catch (err: any) {
    console.error('[COMPATIBILITY ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/catalog/products-by-skus', async (req, res) => {
  try {
    const { skus, ids, category_id } = req.query as any;
    
    let baseWhereClause = "WHERE status = 'published'";
    
    if (ids) {
      const idsList = ids.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
      if (idsList.length === 0) return res.json([]);
      baseWhereClause += ` AND id IN (${idsList.join(',')})`;
    } else if (skus) {
      const skusList = skus.split(',').map((s: string) => sanitizeString(s.trim()));
      if (skusList.length === 0) return res.json([]);
      const inClause = skusList.map((s: string) => `'${s}'`).join(',');
      baseWhereClause += ` AND sku IN (${inClause})`;
    } else {
      return res.json([]);
    }

    if (category_id) {
      const catId = parseInt(category_id);
      if (!isNaN(catId)) {
        if (catId >= 100) {
          const parentId = Math.floor(catId / 100);
          // Custom category matching expressions
          const categoryRules: Record<number, string> = {
            101: "(LOWER(name) LIKE '%racing%' OR LOWER(name) LIKE '%completo%')",
            102: "(LOWER(name) LIKE '%silenciador%' OR LOWER(name) LIKE '%silencioso%' OR LOWER(name) LIKE '%slip-on%' OR LOWER(name) LIKE '%escape%')",
            103: "(LOWER(name) LIKE '%colector%' OR LOWER(name) LIKE '%header%')",
            104: "(LOWER(name) LIKE '%accesorio%')",
            201: "(LOWER(name) LIKE '%pastilla%' OR LOWER(name) LIKE '%pad%')",
            202: "(LOWER(name) LIKE '%disco%' OR LOWER(name) LIKE '%disc%')",
            203: "(LOWER(name) LIKE '%bomba%' OR LOWER(name) LIKE '%pump%')",
            204: "(LOWER(name) LIKE '%latiguillo%' OR LOWER(name) LIKE '%line%')",
            301: "(LOWER(name) LIKE '%amortiguador%' OR LOWER(name) LIKE '%shock%')",
            302: "(LOWER(name) LIKE '%horquilla%' OR LOWER(name) LIKE '%fork%')",
            303: "(LOWER(name) LIKE '%direccion%' OR LOWER(name) LIKE '%steering%')",
            304: "(LOWER(name) LIKE '%estribera%' OR LOWER(name) LIKE '%peg%')",
            401: "(LOWER(name) LIKE '%centralita%' OR LOWER(name) LIKE '%ecu%')",
            402: "(LOWER(name) LIKE '%quickshifter%' OR LOWER(name) LIKE '%shifter%')",
            403: "(LOWER(name) LIKE '%abs%' OR LOWER(name) LIKE '%tc%')",
            404: "(LOWER(name) LIKE '%litio%' OR LOWER(name) LIKE '%lithium%')",
            501: "(LOWER(name) LIKE '%kit%')",
            502: "(LOWER(name) LIKE '%cadena%' OR LOWER(name) LIKE '%chain%')",
            503: "(LOWER(name) LIKE '%piñon%' OR LOWER(name) LIKE '%sprocket%')",
            504: "(LOWER(name) LIKE '%corona%')",
            601: "(LOWER(name) LIKE '%filtro%' OR LOWER(name) LIKE '%filter%')",
            602: "(LOWER(name) LIKE '%filtro aceite%')",
            603: "(LOWER(name) LIKE '%aceite%' OR LOWER(name) LIKE '%oil%')",
            604: "(LOWER(name) LIKE '%liquido%' OR LOWER(name) LIKE '%fluid%')",
            701: "(LOWER(name) LIKE '%neumatico%' OR LOWER(name) LIKE '%tire%' OR LOWER(name) LIKE '%slick%')",
            702: "(LOWER(name) LIKE '%calentador%' OR LOWER(name) LIKE '%warmer%')",
            703: "(LOWER(name) LIKE '%caballete%' OR LOWER(name) LIKE '%stand%')",
            704: "(LOWER(name) LIKE '%manometro%' OR LOWER(name) LIKE '%gauge%')",
            // Casco Integral (Full-Face) is a standard helmet in category 8 that is not modular, jet, or off-road/cross
            801: "(LOWER(name) NOT LIKE '%modular%' AND LOWER(name) NOT LIKE '%flip-up%' AND LOWER(name) NOT LIKE '%system%' AND LOWER(name) NOT LIKE '%jet%' AND LOWER(name) NOT LIKE '%open face%' AND LOWER(name) NOT LIKE '%open-face%' AND LOWER(name) NOT LIKE '%off-road%' AND LOWER(name) NOT LIKE '%offroad%' AND LOWER(name) NOT LIKE '%cross%' AND LOWER(name) NOT LIKE '%enduro%' AND LOWER(name) NOT LIKE '%trial%' AND LOWER(name) NOT LIKE '%dual-sport%' AND LOWER(name) NOT LIKE '%dualsport%')",
            802: "(LOWER(name) LIKE '%modular%' OR LOWER(name) LIKE '%flip-up%' OR LOWER(name) LIKE '%system%')",
            803: "(LOWER(name) LIKE '%jet%' OR LOWER(name) LIKE '%open face%' OR LOWER(name) LIKE '%open-face%')",
            804: "(LOWER(name) LIKE '%off-road%' OR LOWER(name) LIKE '%offroad%' OR LOWER(name) LIKE '%cross%' OR LOWER(name) LIKE '%enduro%' OR LOWER(name) LIKE '%trial%' OR LOWER(name) LIKE '%dual-sport%' OR LOWER(name) LIKE '%dualsport%')",
            901: "(LOWER(name) LIKE '%chaqueta%' OR LOWER(name) LIKE '%jacket%')",
            // Mono (Suit) must exclude gloves, pants, and jerseys that happen to have "mono" in their model names
            902: "(LOWER(name) LIKE '%mono%' AND LOWER(name) NOT LIKE '%glove%' AND LOWER(name) NOT LIKE '%guante%' AND LOWER(name) NOT LIKE '%pants%' AND LOWER(name) NOT LIKE '%pantalón%' AND LOWER(name) NOT LIKE '%jersey%' AND LOWER(name) NOT LIKE '%camiseta%' AND LOWER(name) NOT LIKE '%chaqueta%' AND LOWER(name) NOT LIKE '%bota%')",
            903: "(LOWER(name) LIKE '%guante%' OR LOWER(name) LIKE '%glove%')",
            904: "(LOWER(name) LIKE '%bota%' OR LOWER(name) LIKE '%boot%')",
            1001: "(LOWER(name) LIKE '%baul%' OR LOWER(name) LIKE '%maleta%' OR LOWER(name) LIKE '%case%')",
            1002: "(LOWER(name) LIKE '%quad lock%')",
            1003: "(LOWER(name) LIKE '%intercom%')",
              1004: "(LOWER(name) LIKE '%retrovisor%' OR LOWER(name) LIKE '%espejo%' OR LOWER(name) LIKE '%mirror%')",
              805: "(LOWER(name) LIKE '%recambio%' OR LOWER(name) LIKE '%accesorio%' OR LOWER(name) LIKE '%pieza%' OR LOWER(name) LIKE '%almohadilla%' OR LOWER(name) LIKE '%visera%' OR LOWER(name) LIKE '%pantalla%' OR LOWER(name) LIKE '%pinlock%')",
              1005: "(LOWER(name) LIKE '%promocional%' OR LOWER(name) LIKE '%goodie%' OR LOWER(name) LIKE '%display%')"
          };
          const clause = categoryRules[catId];
          if (clause) {
            baseWhereClause += ` AND (category_id = ${catId} OR category2_id = ${catId} OR category3_id = ${catId} OR (category_id = ${parentId} AND ${clause}))`;
          } else {
            baseWhereClause += ` AND (category_id = ${catId} OR category2_id = ${catId} OR category3_id = ${catId})`;
          }
        } else {
          baseWhereClause += ` AND (category_id = ${catId} OR category_id BETWEEN ${catId * 100} AND ${(catId + 1) * 100 - 1})`;
        }
      }
    }

    const selectQuery = `
      SELECT * FROM (
        SELECT DISTINCT ON (split_part(name, ',', 1)) * 
        FROM products 
        ${baseWhereClause}
        ORDER BY split_part(name, ',', 1), stock DESC, id ASC
      ) distinct_products
      ORDER BY price ASC
    `;

    const productsRes = await db.execute(sql.raw(selectQuery));
    const products = productsRes.rows.map(mapProductToFrontend);
    return res.json(products);
  } catch (err: any) {
    console.error('[PRODUCTS BY SKUS ERROR]:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { userId, email, status = 'pending' } = req.query as any;
    if (!userId && !email) return res.status(400).json({ error: 'Falta userId o email' });

    const safeStatus = sanitizeString(status || 'pending');
    let query = `SELECT * FROM orders WHERE status = '${safeStatus}'`;
    if (userId) {
      const safeUserId = parseIntSafe(userId);
      if (!safeUserId) return res.status(400).json({ error: 'userId inválido' });
      query += ` AND user_id = ${safeUserId}`;
    } else if (email) {
      const safeEmail = sanitizeString(email);
      query += ` AND shipping_data->>'email' = '${safeEmail}'`;
    }

    query += ` ORDER BY created_at DESC LIMIT 5`;

    const ordersRes = await db.execute(sql.raw(query));
    const result = ordersRes.rows.map((row: any) => {
      let shippingDataObj = {};
      try {
        shippingDataObj = typeof row.shippingData === 'string' ? JSON.parse(row.shippingData) : row.shippingData;
      } catch (e) {}

      return {
        id: row.id,
        status: row.status,
        total: row.total / 100,
        payment_method: 'card',
        billing: shippingDataObj,
        created_at: row.createdAt
      };
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[ORDERS GET ERROR]:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ================================================================
// COMPARTIDO & FACTURACIÓN PDF
// ================================================================
async function createInvoiceForOrder(orderId: number) {
  // Check if invoice already exists
  const existingInv = await db.execute(sql`SELECT * FROM invoices WHERE order_id = ${orderId}`);
  if (existingInv.rows.length > 0) {
    return existingInv.rows[0];
  }

  // Load order
  const orderRes = await db.execute(sql`SELECT * FROM orders WHERE id = ${orderId}`);
  const order = orderRes.rows[0] as any;
  if (!order) throw new Error('Pedido no encontrado');

  // Generate invoice number: EYMAS-YYYY-NNNNNN
  const year = new Date().getFullYear();
  const countRes = await db.execute(sql`SELECT COUNT(*) as cnt FROM invoices WHERE issued_at >= date_trunc('year', NOW())`);
  const seqNum = String((Number((countRes.rows[0] as any).cnt) + 1)).padStart(6, '0');
  const invoiceNumber = `EYMAS-${year}-${seqNum}`;

  // Fetch items from database (order_items table!)
  const itemsRes = await db.execute(sql`
    SELECT oi.*, p.name as product_name
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ${orderId}
  `);
  const items = itemsRes.rows as any[];

  const shippingData = (() => { try { return JSON.parse(order.shipping_data || '{}'); } catch { return {}; } })();
  const subtotal = order.subtotal || order.total || 0;
  const shippingCost = order.shipping_cost || 0;
  const discountAmount = order.discount_amount || 0;
  const totalCents = order.total || 0;

  // COGS (cost_total) update: let's also update order.cost_total if not set!
  let calculatedCostTotal = 0;
  for (const item of items) {
    const pCostRes = await db.execute(sql`SELECT cost FROM products WHERE id = ${item.product_id}`);
    const costVal = pCostRes.rows[0] ? (pCostRes.rows[0] as any).cost || 0 : 0;
    calculatedCostTotal += costVal * (item.quantity || 1);
  }
  
  if (calculatedCostTotal > 0 && (!order.cost_total || order.cost_total === 0)) {
    await db.execute(sql`UPDATE orders SET cost_total = ${calculatedCostTotal} WHERE id = ${orderId}`);
  }

  // IVA 21% inverso del total bruto
  const taxAmount = Math.round(totalCents * 21 / 121);

  // Generate PDF
  const invoicesDir = path.join(process.cwd(), 'invoices');
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
  const pdfFileName = `${invoiceNumber}.pdf`;
  const pdfPath = path.join(invoicesDir, pdfFileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // ── HEADER ──────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').text('ESCAPES Y MÁS', 50, 50);
    doc.fontSize(9).font('Helvetica').fillColor('#666666')
      .text('info@escapesymas.com  |  www.escapesymas.com', 50, 78)
      .text('CIF: B-XXXXXXXX  |  Dirección fiscal: C/ Ejemplo 1, 28001 Madrid', 50, 90);

    // Invoice title block
    doc.fillColor('#FF6B00').roundedRect(400, 45, 145, 55, 4).fill();
    doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
      .text('FACTURA', 415, 55)
      .fontSize(10).font('Helvetica')
      .text(invoiceNumber, 415, 72)
      .text(new Date().toLocaleDateString('es-ES'), 415, 86);

    doc.fillColor('#000000');

    // ── DIVIDER ──────────────────────────────────────────────────
    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#EEEEEE').lineWidth(1).stroke();

    // ── BILLING DATA ─────────────────────────────────────────────
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#888888').text('FACTURAR A:', 50, 130);
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
      .text(`${shippingData.firstName || ''} ${shippingData.lastName || ''}`, 50, 145)
      .text(shippingData.email || '', 50, 158)
      .text(shippingData.address || '', 50, 171)
      .text(`${shippingData.city || ''} ${shippingData.postcode || ''} ${shippingData.country || ''}`, 50, 184);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#888888').text('PEDIDO Nº:', 350, 130);
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
      .text(`#${order.id}`, 350, 145)
      .text(new Date(order.created_at).toLocaleDateString('es-ES'), 350, 158);

    // ── LINE ITEMS ────────────────────────────────────────────────
    const tableTop = 220;
    doc.fillColor('#1A1A1A').rect(50, tableTop, 495, 20).fill();
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
      .text('DESCRIPCIÓN', 58, tableTop + 6)
      .text('CANT.', 370, tableTop + 6)
      .text('PRECIO UNIT.', 410, tableTop + 6)
      .text('TOTAL', 475, tableTop + 6);

    doc.fillColor('#000000');
    let yPos = tableTop + 28;
    let lineNum = 0;

    for (const item of items) {
      if (lineNum % 2 === 0) {
        doc.fillColor('#F9F9F9').rect(50, yPos - 4, 495, 18).fill();
      }
      const unitPrice = ((item.price || 0) / 100).toFixed(2);
      const lineTotal = (((item.price || 0) * (item.quantity || 1)) / 100).toFixed(2);
      doc.fillColor('#222222').fontSize(9).font('Helvetica')
        .text(item.product_name || item.name || 'Producto', 58, yPos, { width: 300 })
        .text(String(item.quantity || 1), 380, yPos)
        .text(`${unitPrice}€`, 415, yPos)
        .text(`${lineTotal}€`, 472, yPos);
      yPos += 20;
      lineNum++;
    }

    // ── TOTALS ────────────────────────────────────────────────────
    yPos += 10;
    doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
    yPos += 12;

    const totalBlock = (label: string, val: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9)
        .fillColor(bold ? '#FF6B00' : '#333333')
        .text(label, 350, yPos)
        .text(val, 472, yPos);
      yPos += bold ? 18 : 16;
    };

    if (discountAmount > 0) totalBlock('Descuento:', `-${(discountAmount / 100).toFixed(2)}€`);
    if (shippingCost > 0) totalBlock('Envío:', `${(shippingCost / 100).toFixed(2)}€`);
    totalBlock('Base imponible:', `${((totalCents - taxAmount) / 100).toFixed(2)}€`);
    totalBlock('IVA (21%):', `${(taxAmount / 100).toFixed(2)}€`);
    totalBlock('TOTAL:', `${(totalCents / 100).toFixed(2)}€`, true);

    // ── FOOTER ────────────────────────────────────────────────────
    doc.fontSize(7).fillColor('#AAAAAA')
      .text('Gracias por tu confianza en Escapes y Más. Esta factura es el documento legal de tu compra.', 50, 760, { align: 'center', width: 495 });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Save invoice record
  try {
    await db.execute(sql`
      INSERT INTO invoices (order_id, invoice_number, subtotal, tax_amount, shipping_cost, discount_amount, total, pdf_path)
      VALUES (${orderId}, ${invoiceNumber}, ${subtotal}, ${taxAmount}, ${shippingCost}, ${discountAmount}, ${totalCents}, ${pdfPath})
    `);
  } catch (err: any) {
    if (err.code === '23505') { // Unique constraint violation in postgres
      const dup = await db.execute(sql`SELECT * FROM invoices WHERE order_id = ${orderId}`);
      return dup.rows[0];
    }
    throw err;
  }

  const invRes = await db.execute(sql`SELECT * FROM invoices WHERE order_id = ${orderId}`);
  return invRes.rows[0];
}

app.get('/api/orders/download-invoice', async (req: any, res: any) => {
  const { orderId, userEmail } = req.query as any;
  if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

  try {
    const orderRes = await db.execute(sql`SELECT * FROM orders WHERE id = ${parseInt(orderId)}`);
    const order = orderRes.rows[0] as any;
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    let isAuthorized = false;
    if (userEmail) {
      if (userEmail.toLowerCase() === 'info@escapesymas.com') {
        isAuthorized = true;
      } else {
        const uRes = await db.execute(sql`SELECT id FROM users WHERE email = ${userEmail}`);
        if (uRes.rows.length > 0 && uRes.rows[0].id === order.user_id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ error: 'No autorizado para ver esta factura' });
    }

    const invRow = await db.execute(sql`SELECT * FROM invoices WHERE order_id = ${parseInt(orderId)}`);
    if (!invRow.rows.length) {
      return res.status(404).json({ error: 'Factura no generada todavía.' });
    }

    const inv = invRow.rows[0] as any;
    const pdfFile = inv.pdf_path;

    if (!pdfFile || !fs.existsSync(pdfFile)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.invoice_number}.pdf"`);
    fs.createReadStream(pdfFile).pipe(res);
  } catch (err: any) {
    console.error('[CUSTOMER INVOICE DOWNLOAD ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// ADMIN (requiere autenticación)
// ================================================================
app.all('/api/admin', async (req, res) => {
  const { action, userId, email } = req.query as any;

  let isAdmin = false;
  if (email?.toLowerCase() === 'info@escapesymas.com') isAdmin = true;
  else if (userId && userId !== 'undefined') {
    const r = await db.execute(sql`SELECT role FROM users WHERE wp_id = ${parseInt(userId)}`);
    if (r.rows[0]?.role === 'admin') isAdmin = true;
  }

  // Rutas públicas del catálogo (legacy compat)
  if (action?.startsWith('catalog-')) {
    // Redirigir internamente
    if (action === 'catalog-products') {
      req.query = { ...req.query, ...{ search: req.query.search, page: req.query.page, per_page: req.query.per_page } };
      return app._router.handle(Object.assign(req, { url: '/api/catalog/products', method: 'GET' }), res, () => {});
    }
  }

  // Allow moderate-thread for thread owners (checked inside the action handler)
  if (!isAdmin && action === 'moderate-thread') {
    // Skip admin check, let the action handler verify ownership
  } else if (!isAdmin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    switch (action) {
      case 'dashboard-stats': {
        const uR = await db.execute(sql`SELECT count(*) as count FROM users`);
        const pR = await db.execute(sql`SELECT count(*) as count FROM forum_posts`);
        const oR = await db.execute(sql`SELECT count(*) as count FROM orders`);
        const sR = await db.execute(sql`SELECT COALESCE(SUM(total), 0) as total FROM orders`);
        
        // VPS Telemetry
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = Math.round((usedMem / totalMem) * 100);
        
        // 1-minute load average
        const cpuLoad = os.loadavg()[0];
        const cpuCores = os.cpus().length;
        const cpuPercent = Math.min(Math.round((cpuLoad / cpuCores) * 100), 100);

        let diskStats = { total: "115G", used: "20.5G", free: "94.5G", percent: "18%" };
        try {
          const dfOutput = execSync("df -h / | tail -n 1").toString();
          const parts = dfOutput.split(/\s+/);
          if (parts.length >= 5) {
            diskStats = {
              total: parts[1],
              used: parts[2],
              free: parts[3],
              percent: parts[4]
            };
          }
        } catch (e) {}

        // Image Optimization stats - lee estado del script Python
        let imageStats: any = {
          status: "En Proceso",
          optimized: 0,
          omitted: 0,
          failed: 0,
          total: 103989,
          purged: 0,
          purgedTotal: 0,
          cardOptimized: 0,
          cardPending: 0,
          cardTotal: 0,
          regenerating: false,
          regenProcessed: 0,
          regenSuccess: 0,
          regenFailed: 0,
          regenSkipped: 0,
          regenCurrentSku: '',
          regenPercent: 0
        };
        
        // Leer estado del script de regeneración de imágenes desde PostgreSQL
        try {
          const stateResult = await pool.query('SELECT * FROM image_regen_state WHERE id = 1');
          if (stateResult.rows.length > 0) {
            const state = stateResult.rows[0];
            imageStats.regenerating = state.status === 'running';
            imageStats.regenProcessed = state.processed || 0;
            imageStats.regenSuccess = state.success || 0;
            imageStats.regenFailed = state.failed || 0;
            imageStats.regenSkipped = state.skipped || 0;
            imageStats.regenCurrentSku = state.current_sku || '';
            if (state.total > 0) {
              imageStats.regenPercent = Math.round((state.processed / state.total) * 100);
            }
            if (state.status === 'completed') {
              imageStats.status = "Finalizado";
            } else if (state.status === 'running') {
              imageStats.status = `Regenerando imágenes (${imageStats.regenPercent}%)`;
            }
          } else {
            // Fallback: intentar leer fichero legacy si tabla vacía
            const stateFile = '/tmp/image_regen_state.json';
            if (fs.existsSync(stateFile)) {
              const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
              imageStats.regenerating = state.status === 'running';
              imageStats.regenProcessed = state.processed || 0;
              imageStats.regenSuccess = state.success || 0;
            }
          }
        } catch (e) {
          console.error('Error reading regen state from DB:', e);
        }

        // Stats de la base de datos
        try {
          const optR = await db.execute(sql`SELECT count(*) as count FROM products WHERE images LIKE '%optimized%'`);
          const pendingR = await db.execute(sql`SELECT count(*) as count FROM products WHERE images LIKE '%api.mybihr.com%' OR images LIKE '%static.bihr.pro%'`);
          const placeR = await db.execute(sql`SELECT count(*) as count FROM products WHERE images LIKE '%placehold.co%'`);
          const cardOptR = await db.execute(sql`SELECT count(*) as count FROM products WHERE images LIKE '%srcCardDesktop%'`);
          
          const optCount = Number(optR.rows[0]?.count || 0);
          const pendingCount = Number(pendingR.rows[0]?.count || 0);
          const placeCount = Number(placeR.rows[0]?.count || 0);
          const cardOptCount = Number(cardOptR.rows[0]?.count || 0);
          
          imageStats.optimized = optCount;
          imageStats.omitted = placeCount;
          imageStats.failed = 0; // Fallbacks are placeholders
          imageStats.total = optCount + pendingCount + placeCount;
          
          // Card specific stats
          imageStats.cardOptimized = cardOptCount;
          imageStats.cardPending = Math.max(0, optCount - cardOptCount);
          imageStats.cardTotal = optCount;
          
          // Purged images can be approximated or set as:
          imageStats.purged = optCount;
          imageStats.purgedTotal = optCount;

          if (pendingCount === 0 && optCount > 0 && imageStats.cardPending === 0) {
            imageStats.status = "Finalizado";
          } else if (imageStats.cardPending > 0) {
            imageStats.status = `Generando tarjetas 1:1 (${imageStats.cardPending} pendientes)`;
          }
        } catch (e) {
          console.error("Error fetching dynamic image stats:", e);
        }

        return res.json({
          users: Number(uR.rows[0]?.count || 0),
          posts: Number(pR.rows[0]?.count || 0),
          orders: Number(oR.rows[0]?.count || 0),
          sales: Number(sR.rows[0]?.total || 0),
          vps: {
            cpu: cpuPercent,
            cores: cpuCores,
            ramTotal: `${Math.round(totalMem / (1024 * 1024 * 1024))}GB`,
            ramUsed: `${Math.round(usedMem / (1024 * 1024 * 1024))}GB`,
            ramPercent: memPercent,
            disk: diskStats,
            os: `${os.type()} ${os.release()}`,
            uptime: `${Math.round(os.uptime() / 3600)} horas`,
            imageStats
          }
        });
      }

      case 'products-list': {
        const {
          search, brand, category_id, category2_id, category3_id,
          stock_min, stock_max, price_min, price_max,
          dropshipping, ondemand, status,
          barcode, supplier_code,
          limit = '100', page = '1', sort = 'created_at', order = 'DESC'
        } = req.query as any;
        const lim = Math.min(parseIntSafe(limit) || 100, 500);
        const p = parseIntSafe(page) || 1;
        const offset = (p - 1) * lim;

        const conditions: string[] = [];

        if (search) {
          const s = sanitizeLike(search);
          conditions.push(`(
            LOWER(name) LIKE LOWER('%${s}%') ESCAPE '\\' 
            OR LOWER(sku) LIKE LOWER('%${s}%') ESCAPE '\\' 
            OR LOWER(description) LIKE LOWER('%${s}%') ESCAPE '\\'
            OR LOWER(supplier_code) LIKE LOWER('%${s}%') ESCAPE '\\'
            OR LOWER(barcode) LIKE LOWER('%${s}%') ESCAPE '\\'
            OR LOWER(old_part_number) LIKE LOWER('%${s}%') ESCAPE '\\'
          )`);
        }
        if (brand) {
          const b = sanitizeString(brand);
          conditions.push(`LOWER(brand) = LOWER('${b}')`);
        }
        if (category_id) {
          conditions.push(`category_id = ${parseInt(category_id)}`);
        }
        if (category2_id) {
          conditions.push(`category2_id = ${parseInt(category2_id)}`);
        }
        if (category3_id) {
          conditions.push(`category3_id = ${parseInt(category3_id)}`);
        }
        if (stock_min) {
          conditions.push(`stock >= ${parseInt(stock_min)}`);
        }
        if (stock_max) {
          conditions.push(`stock <= ${parseInt(stock_max)}`);
        }
        if (price_min) {
          conditions.push(`price >= ${Math.round(parseFloat(price_min) * 100)}`);
        }
        if (price_max) {
          conditions.push(`price <= ${Math.round(parseFloat(price_max) * 100)}`);
        }
        if (dropshipping === 'true' || dropshipping === '1') {
          conditions.push('dropshipping = true');
        } else if (dropshipping === 'false' || dropshipping === '0') {
          conditions.push('dropshipping = false');
        }
        if (ondemand === 'true' || ondemand === '1') {
          conditions.push('ondemand = true');
        } else if (ondemand === 'false' || ondemand === '0') {
          conditions.push('ondemand = false');
        }
        if (status) {
          const st = sanitizeString(status);
          conditions.push(`status = '${st}'`);
        }
        if (barcode) {
          const bc = sanitizeLike(barcode);
          conditions.push(`barcode LIKE '%${bc}%'`);
        }
        if (supplier_code) {
          const sc = sanitizeLike(supplier_code);
          conditions.push(`supplier_code LIKE '%${sc}%'`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const allowedSorts = ['created_at', 'name', 'sku', 'price', 'stock', 'brand', 'barcode', 'supplier_code'];
        const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
        const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

        const query = `SELECT * FROM products ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ${lim} OFFSET ${offset}`;
        const products = await db.execute(sql.raw(query));
        return res.json(products.rows);
      }

      case 'create-product': {
        if (req.method !== 'POST') return res.status(405).end();
        const b = req.body;
        const safeName = (b.name || "Sin nombre").substring(0, 255);
        const safeSku = (b.sku || `SKU-${Date.now()}`).substring(0, 100);
        const raw = parseFloat(b.price);
        const priceInCents = isNaN(raw) ? 0 : Math.round(raw * 100);
        const rawSale = parseFloat(b.salePrice);
        const saleCents = isNaN(rawSale) ? null : Math.round(rawSale * 100);
        const stock = parseInt(b.stock) || 0;
        const desc = b.description || null;
        const imgs = b.images?.length > 0 ? JSON.stringify(b.images) : null;
        const compat = b.compatibility?.length > 0 ? JSON.stringify(b.compatibility) : null;
        const status = b.status || 'published';
        const brand = b.brand || '';
        const cost = b.cost ? Math.round(parseFloat(b.cost) * 100) : null;
        const category2Id = b.category2Id ? parseInt(b.category2Id) : null;
        const category3Id = b.category3Id ? parseInt(b.category3Id) : null;

        await db.execute(sql`
          INSERT INTO products (name, sku, price, sale_price, stock, description, images, compatibility, status, brand, cost, category2_id, category3_id)
          VALUES (${safeName}, ${safeSku}, ${priceInCents}, ${saleCents}, ${stock}, ${desc}, ${imgs}, ${compat}, ${status}, ${brand}, ${cost}, ${category2Id}, ${category3Id})
        `);
        return res.json({ success: true });
      }

      case 'orders-list': {
        const { limit = '50', page = '1', status } = req.query as any;
        const lim = Math.min(parseIntSafe(limit) || 50, 200);
        const p = parseIntSafe(page) || 1;
        const offset = (p - 1) * lim;

        let whereClause = '';
        if (status && status !== 'all') {
          whereClause = ` WHERE status = '${sanitizeString(status)}'`;
        }

        const countRes = await db.execute(sql.raw(`SELECT count(*) as total FROM orders${whereClause}`));
        const total = Number(countRes.rows[0]?.total || 0);
        const totalPages = Math.ceil(total / lim);

        const ordersRes = await db.execute(sql.raw(`
          SELECT * FROM orders${whereClause} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}
        `));
        const result = [];
        for (const rawOrder of ordersRes.rows) {
          const order = rawOrder as any;
          const itemsRes = await db.execute(sql`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ${order.id}
          `);
          // Check if invoice exists
          const invCheck = await db.execute(sql`SELECT invoice_number FROM invoices WHERE order_id = ${order.id}`);
          result.push({
            id: order.id,
            userId: order.user_id,
            total: order.total,
            subtotal: order.subtotal,
            shippingCost: order.shipping_cost,
            discountAmount: order.discount_amount,
            status: order.status,
            paymentId: order.payment_id,
            shippingData: order.shipping_data ? JSON.parse(order.shipping_data as string) : {},
            createdAt: order.created_at,
            items: itemsRes.rows,
            bihrTicketId: order.bihr_ticket_id,
            dropshippingStatus: order.dropshipping_status || 'not_sent',
            trackingNumber: order.tracking_number,
            trackingUrl: order.tracking_url,
            costTotal: order.cost_total || 0,
            invoiceNumber: invCheck.rows.length > 0 ? (invCheck.rows[0] as any).invoice_number : null,
          });
        }
        return res.json({
          orders: result,
          pagination: {
            page: p,
            limit: lim,
            total,
            totalPages
          }
        });
      }

      case 'update-order-status': {
        if (req.method !== 'POST') return res.status(405).end();
        const { orderId, status } = req.body;
        if (!orderId || !status) return res.status(400).json({ error: 'Faltan datos' });
        await db.execute(sql`
          UPDATE orders
          SET status = ${status}
          WHERE id = ${parseInt(orderId)}
        `);

        // Auto-generate invoice if manually moved to paid status
        if (status === 'processing' || status === 'completed') {
          try {
            await createInvoiceForOrder(parseInt(orderId));
            console.log(`[AUTO-INVOICE] Invoice auto-generated on manual status update for Order ${orderId}`);
          } catch (e: any) {
            console.error(`[AUTO-INVOICE ERROR] Failed to auto-generate invoice on manual status update for Order ${orderId}:`, e);
          }
        }
        return res.json({ success: true });
      }

      case 'delete-order': {
        if (req.method !== 'POST') return res.status(405).end();
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'Faltan datos' });
        await db.execute(sql`
          DELETE FROM order_items
          WHERE order_id = ${parseInt(orderId)}
        `);
        await db.execute(sql`
          DELETE FROM orders
          WHERE id = ${parseInt(orderId)}
        `);
        return res.json({ success: true });
      }

      case 'send-dropshipping-order': {
        if (req.method !== 'POST') return res.status(405).end();
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

        const orderIdInt = parseInt(orderId);
        const orderRes = await db.execute(sql`SELECT * FROM orders WHERE id = ${orderIdInt}`);
        if (orderRes.rows.length === 0) {
          return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        const order = orderRes.rows[0] as any;

        const itemsRes = await db.execute(sql`
          SELECT oi.*, p.sku
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ${orderIdInt}
        `);

        if (itemsRes.rows.length === 0) {
          return res.status(400).json({ error: 'El pedido no tiene artículos' });
        }

        const shippingData = order.shipping_data ? JSON.parse(order.shipping_data as string) : {};

        const deliveryAddress = {
          firstName: shippingData.firstName || '',
          lastName: shippingData.lastName || '',
          companyName: shippingData.companyName || '',
          street: `${shippingData.address || ''} ${shippingData.apartment || ''}`.trim(),
          zipCode: shippingData.zipCode || '',
          city: shippingData.city || '',
          countryCode: shippingData.country || 'ES',
          phoneNumber: shippingData.phone || '',
          email: shippingData.email || '',
        };

        const items = itemsRes.rows.map((item: any) => ({
          productCode: item.sku,
          quantity: item.quantity,
        }));

        try {
          const { createBihrOrder } = await import('./bihrService.js');
          const bihrResponse = await createBihrOrder({
            deliveryAddress,
            items,
            customerOrderReference: `order_${order.id}`,
            isDropshipping: true
          });

          const ticketId = bihrResponse.ticketId || bihrResponse.TicketId || bihrResponse.ticket_id || '';
          
          await db.execute(sql`
            UPDATE orders
            SET bihr_ticket_id = ${ticketId},
                dropshipping_status = 'pending_bihr'
            WHERE id = ${orderIdInt}
          `);

          return res.json({ success: true, ticketId });
        } catch (e: any) {
          console.error('[DROPSHIPPING SEND ERROR]:', e);
          return res.status(500).json({ error: e.message || 'Error al enviar pedido a Bihr' });
        }
      }

      case 'query-dropshipping-status': {
        const { orderId } = req.query as any;
        if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

        const orderIdInt = parseInt(orderId);
        const orderRes = await db.execute(sql`SELECT * FROM orders WHERE id = ${orderIdInt}`);
        if (orderRes.rows.length === 0) {
          return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        const order = orderRes.rows[0] as any;
        if (!order.bihr_ticket_id) {
          return res.status(400).json({ error: 'El pedido no tiene un ticket de Bihr asociado' });
        }

        try {
          const { getBihrOrderStatus } = await import('./bihrService.js');
          const statusData = await getBihrOrderStatus(order.bihr_ticket_id);
          
          const bihrStatus = (statusData.status || statusData.Status || '').toLowerCase();
          
          let dropshippingStatus = 'pending_bihr';
          if (bihrStatus === 'shipped') {
            dropshippingStatus = 'shipped';
          } else if (bihrStatus === 'cancelled' || bihrStatus === 'canceled') {
            dropshippingStatus = 'cancelled';
          }

          const trackingNumber = statusData.trackingNumber || statusData.TrackingNumber || order.tracking_number || null;
          const trackingUrl = statusData.trackingUrl || statusData.TrackingUrl || order.tracking_url || null;
          
          await db.execute(sql`
            UPDATE orders
            SET dropshipping_status = ${dropshippingStatus},
                tracking_number = ${trackingNumber},
                tracking_url = ${trackingUrl}
            WHERE id = ${orderIdInt}
          `);

          return res.json({ 
            success: true, 
            dropshippingStatus, 
            trackingNumber, 
            trackingUrl, 
            bihrRaw: statusData 
          });
        } catch (e: any) {
          console.error('[QUERY DROPSHIPPING STATUS ERROR]:', e);
          return res.status(500).json({ error: e.message || 'Error al consultar estado en Bihr' });
        }
      }

      case 'pricing-rules-list': {
        const rules = await db.execute(sql`SELECT * FROM pricing_rules ORDER BY created_at DESC`);
        return res.json(rules.rows);
      }

      case 'save-pricing-rule': {
        if (req.method !== 'POST') return res.status(405).end();
        const { id, ruleType, targetId, marginPercent, active } = req.body;
        const activeVal = active === false || active === 0 ? 0 : 1;

        if (!ruleType || marginPercent === undefined) {
          return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
        }

        if (id) {
          await db.execute(sql`
            UPDATE pricing_rules
            SET rule_type = ${ruleType},
                target_id = ${targetId || null},
                margin_percent = ${parseInt(marginPercent)},
                active = ${activeVal}
            WHERE id = ${parseInt(id)}
          `);
        } else {
          await db.execute(sql`
            INSERT INTO pricing_rules (rule_type, target_id, margin_percent, active)
            VALUES (${ruleType}, ${targetId || null}, ${parseInt(marginPercent)}, ${activeVal})
          `);
        }
        return res.json({ success: true });
      }

      case 'delete-pricing-rule': {
        if (req.method !== 'POST') return res.status(405).end();
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Falta ID de regla' });
        
        await db.execute(sql`DELETE FROM pricing_rules WHERE id = ${parseInt(id)}`);
        return res.json({ success: true });
      }

      case 'recalculate-all-prices': {
        if (req.method !== 'POST') return res.status(405).end();
        
        const rulesRes = await db.execute(sql`SELECT * FROM pricing_rules WHERE active = 1`);
        const rules = (rulesRes.rows || []) as any[];
 
        const productsRes = await db.execute(sql`SELECT id, brand, category_id, cost, price FROM products WHERE cost > 0`);
        const products = (productsRes.rows || []) as any[];
 
        let updateCount = 0;
 
        const getPrice = (costVal: number, catId: number, brandName: string) => {
          let margin = 20; // default margin
          const brandRule = rules.find(r => r.rule_type === 'brand' && (r.target_id as string)?.toLowerCase() === brandName?.toLowerCase());
          if (brandRule) {
            margin = Number(brandRule.margin_percent);
          } else {
            const parentId = catId >= 100 ? Math.floor(catId / 100) : catId;
            const categoryRule = rules.find(r => r.rule_type === 'category' && (r.target_id === String(catId) || r.target_id === String(parentId)));
            if (categoryRule) {
              margin = Number(categoryRule.margin_percent);
            } else {
              const globalRule = rules.find(r => r.rule_type === 'global');
              if (globalRule) {
                margin = Number(globalRule.margin_percent);
              }
            }
          }
          return Math.round(costVal * (1 + margin / 100));
        };
 
        const batchSize = 200;
        for (let idx = 0; idx < products.length; idx += batchSize) {
          const pBatch = products.slice(idx, idx + batchSize);
          const updateQueries = pBatch.map((p: any) => {
            const newPrice = getPrice(Number(p.cost || 0), Number(p.category_id || 0), p.brand || '');
            if (newPrice !== Number(p.price || 0)) {
              updateCount++;
              return db.execute(sql`UPDATE products SET price = ${newPrice}, updated_at = NOW() WHERE id = ${p.id}`);
            }
            return null;
          }).filter(Boolean);

          if (updateQueries.length > 0) {
            await Promise.all(updateQueries);
          }
        }

        return res.json({ success: true, updatedCount: updateCount });
      }

      case 'generate-invoice': {
        if (req.method !== 'POST') return res.status(405).end();
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

        try {
          const invoice = await createInvoiceForOrder(parseInt(orderId));
          return res.json({ success: true, invoice });
        } catch (e: any) {
          console.error('[GENERATE INVOICE ERROR]:', e);
          return res.status(500).json({ error: e.message || 'Error al generar la factura' });
        }
      }

      case 'download-invoice': {
        const { orderId: dlOrderId } = req.query as any;
        if (!dlOrderId) return res.status(400).json({ error: 'Falta orderId' });

        const invRow = await db.execute(sql`SELECT * FROM invoices WHERE order_id = ${parseInt(dlOrderId)}`);
        if (!invRow.rows.length) return res.status(404).json({ error: 'Factura no generada. Genérala primero.' });

        const inv = invRow.rows[0] as any;
        const pdfFile = inv.pdf_path;

        if (!pdfFile || !fs.existsSync(pdfFile)) {
          return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor.' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${inv.invoice_number}.pdf"`);
        fs.createReadStream(pdfFile).pipe(res);
        return;
      }

      case 'invoices-list': {
        const invList = await db.execute(sql`
          SELECT i.*, o.shipping_data
          FROM invoices i
          LEFT JOIN orders o ON i.order_id = o.id
          ORDER BY i.issued_at DESC
          LIMIT 200
        `);
        return res.json(invList.rows.map((r: any) => {
          const sd = (() => { try { return JSON.parse(r.shipping_data || '{}'); } catch { return {}; } })();
          return {
            id: r.id,
            orderId: r.order_id,
            invoiceNumber: r.invoice_number,
            subtotal: r.subtotal,
            taxAmount: r.tax_amount,
            shippingCost: r.shipping_cost,
            discountAmount: r.discount_amount,
            total: r.total,
            issuedAt: r.issued_at,
            customerName: `${sd.firstName || ''} ${sd.lastName || ''}`.trim(),
            customerEmail: sd.email || '',
          };
        }));
      }

      case 'financial-analytics': {
        const { period = '30d' } = req.query as any;
        let intervalExpr = sql`NOW() - INTERVAL '30 days'`;
        if (period === '7d') intervalExpr = sql`NOW() - INTERVAL '7 days'`;
        else if (period === '90d') intervalExpr = sql`NOW() - INTERVAL '90 days'`;
        else if (period === '365d') intervalExpr = sql`NOW() - INTERVAL '365 days'`;

        // Revenue over time (daily)
        const revenueByDay = await db.execute(sql`
          SELECT 
            DATE(created_at) as date,
            SUM(total) as revenue,
            SUM(COALESCE(shipping_cost, 0)) as shipping,
            SUM(COALESCE(discount_amount, 0)) as discounts,
            COUNT(*) as order_count
          FROM orders
          WHERE created_at >= ${intervalExpr}
            AND status NOT IN ('cancelled', 'refunded')
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `);

        // Summary totals
        const summaryRes = await db.execute(sql`
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total), 0) as gross_revenue,
            COALESCE(SUM(COALESCE(shipping_cost, 0)), 0) as total_shipping,
            COALESCE(SUM(COALESCE(discount_amount, 0)), 0) as total_discounts,
            COALESCE(AVG(total), 0) as avg_order_value
          FROM orders
          WHERE created_at >= ${intervalExpr}
            AND status NOT IN ('cancelled', 'refunded')
        `);

        // COGS (cost of goods sold) from products table
        const cogsRes = await db.execute(sql`
          SELECT COALESCE(SUM(p.cost * oi.quantity), 0) as cogs
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.created_at >= ${intervalExpr}
            AND o.status NOT IN ('cancelled', 'refunded')
        `).catch(() => ({ rows: [{ cogs: 0 }] }));

        // Top products by revenue
        const topProductsRes = await db.execute(sql`
          SELECT 
            p.name,
            p.sku,
            SUM(oi.price * oi.quantity) as revenue,
            SUM(oi.quantity) as units_sold
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.created_at >= ${intervalExpr}
            AND o.status NOT IN ('cancelled', 'refunded')
            AND p.name IS NOT NULL
          GROUP BY p.name, p.sku
          ORDER BY revenue DESC
          LIMIT 10
        `).catch(() => ({ rows: [] }));

        // Orders by status
        const statusBreakdown = await db.execute(sql`
          SELECT status, COUNT(*) as count, SUM(total) as revenue
          FROM orders
          WHERE created_at >= ${intervalExpr}
          GROUP BY status
        `);

        // Monthly revenue comparison (current vs previous period)
        const prevSummary = await db.execute(sql`
          SELECT COALESCE(SUM(total), 0) as gross_revenue, COUNT(*) as total_orders
          FROM orders
          WHERE created_at >= ${intervalExpr} - (${intervalExpr} - NOW())
            AND created_at < ${intervalExpr}
            AND status NOT IN ('cancelled', 'refunded')
        `).catch(() => ({ rows: [{ gross_revenue: 0, total_orders: 0 }] }));

        const summary = summaryRes.rows[0] as any;
        const grossRevenue = Number(summary.gross_revenue || 0);
        const cogs = Number((cogsRes.rows[0] as any)?.cogs || 0);
        const taxBase = Math.round(grossRevenue / 1.21);
        const vatCollected = grossRevenue - taxBase;
        const grossProfit = grossRevenue - cogs;

        return res.json({
          period,
          summary: {
            totalOrders: Number(summary.total_orders || 0),
            grossRevenue,
            totalShipping: Number(summary.total_shipping || 0),
            totalDiscounts: Number(summary.total_discounts || 0),
            avgOrderValue: Math.round(Number(summary.avg_order_value || 0)),
            cogs,
            grossProfit,
            vatCollected,
            taxBase,
          },
          prevPeriod: {
            grossRevenue: Number((prevSummary.rows[0] as any)?.gross_revenue || 0),
            totalOrders: Number((prevSummary.rows[0] as any)?.total_orders || 0),
          },
          revenueByDay: revenueByDay.rows.map((r: any) => ({
            date: r.date,
            revenue: Number(r.revenue || 0),
            shipping: Number(r.shipping || 0),
            discounts: Number(r.discounts || 0),
            orderCount: Number(r.order_count || 0),
          })),
          topProducts: topProductsRes.rows.map((r: any) => ({
            name: r.name,
            sku: r.sku,
            revenue: Number(r.revenue || 0),
            unitsSold: Number(r.units_sold || 0),
          })),
          statusBreakdown: statusBreakdown.rows.map((r: any) => ({
            status: r.status,
            count: Number(r.count || 0),
            revenue: Number(r.revenue || 0),
          })),
        });
      }

      case 'export-accounting-csv': {
        const { period: csvPeriod = '30d' } = req.query as any;
        let csvIntervalExpr = sql`NOW() - INTERVAL '30 days'`;
        if (csvPeriod === '7d') csvIntervalExpr = sql`NOW() - INTERVAL '7 days'`;
        else if (csvPeriod === '90d') csvIntervalExpr = sql`NOW() - INTERVAL '90 days'`;
        else if (csvPeriod === '365d') csvIntervalExpr = sql`NOW() - INTERVAL '365 days'`;

        const csvOrders = await db.execute(sql`
          SELECT 
            o.id, o.created_at, o.status, o.total, 
            o.subtotal, o.shipping_cost, o.discount_amount, o.promo_code,
            o.shipping_data,
            i.invoice_number,
            i.tax_amount
          FROM orders o
          LEFT JOIN invoices i ON i.order_id = o.id
          WHERE o.created_at >= ${csvIntervalExpr}
          ORDER BY o.created_at DESC
        `);

        const csvRows = csvOrders.rows.map((r: any) => {
          const sd = (() => { try { return JSON.parse(r.shipping_data || '{}'); } catch { return {}; } })();
          const total = Number(r.total || 0);
          const taxAmt = r.tax_amount ? Number(r.tax_amount) : Math.round(total * 21 / 121);
          const taxBase = total - taxAmt;
          return [
            r.id,
            new Date(r.created_at).toLocaleDateString('es-ES'),
            r.status,
            r.invoice_number || '',
            `${sd.firstName || ''} ${sd.lastName || ''}`.trim(),
            sd.email || '',
            (Number(r.subtotal || total) / 100).toFixed(2),
            (Number(r.shipping_cost || 0) / 100).toFixed(2),
            (Number(r.discount_amount || 0) / 100).toFixed(2),
            (taxBase / 100).toFixed(2),
            (taxAmt / 100).toFixed(2),
            (total / 100).toFixed(2),
            r.promo_code || '',
          ].join(';');
        });

        const header = 'ID Pedido;Fecha;Estado;Nº Factura;Cliente;Email;Base Subtotal;Envío;Descuento;Base Imponible;IVA 21%;Total EUR;Cupón';
        const csvContent = [header, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="libro_ventas_${csvPeriod}_${new Date().toISOString().slice(0,10)}.csv"`);
        return res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8
      }

      case 'carts-list': {
        const cartsRes = await db.execute(sql`
          SELECT c.*, u.email as user_email, u.first_name as user_firstname, u.last_name as user_lastname, u.username as user_username
          FROM carts c
          LEFT JOIN users u ON c.user_id = u.wp_id OR c.user_id = u.id
          ORDER BY c.updated_at DESC
        `);
        const result = [];
        for (const row of cartsRes.rows) {
          const cart = row as any;
          result.push({
            id: cart.id,
            userId: cart.user_id,
            userEmail: cart.user_email || 'Invitado',
            userFirstName: cart.user_firstname,
            userLastName: cart.user_lastname,
            userUsername: cart.user_username,
            sessionToken: cart.session_token,
            isDeleted: cart.is_deleted || 0,
            items: cart.items ? JSON.parse(cart.items as string) : [],
            updatedAt: cart.updated_at
          });
        }
        return res.json(result);
      }

      case 'delete-cart': {
        if (req.method !== 'POST') return res.status(405).end();
        const { cartId } = req.body;
        if (!cartId) return res.status(400).json({ error: 'Falta cartId' });
        await db.execute(sql`
          UPDATE carts
          SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${parseInt(cartId)}
        `);
        return res.json({ success: true });
      }

      case 'permanently-delete-cart': {
        if (req.method !== 'POST') return res.status(405).end();
        const { cartId } = req.body;
        if (!cartId) return res.status(400).json({ error: 'Falta cartId' });
        await db.execute(sql`
          DELETE FROM carts
          WHERE id = ${parseInt(cartId)}
        `);
        return res.json({ success: true });
      }

      case 'send-abandoned-email': {
        if (req.method !== 'POST') return res.status(405).end();
        const { cartId, email, firstName, items } = req.body;
        if (!cartId || !email) return res.status(400).json({ error: 'Faltan datos' });

        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.buzondecorreo.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.SMTP_USER || "web@backendescapes.com",
              pass: process.env.SMTP_PASSWORD || "Pedrito2011P!"
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          await transporter.verify();

          const clientName = firstName || 'Motero';
          const itemsList = Array.isArray(items) ? items : [];

          let itemsHtml = '';
          let total = 0;
          for (const item of itemsList) {
            const price = parseFloat(item.price || 0);
            const qty = parseInt(item.quantity || 1);
            const subtotal = price * qty;
            total += subtotal;
            itemsHtml += `
              <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee;">
                  <strong style="color: #111111; font-size: 13px;">${item.name || 'Producto'}</strong><br/>
                  <span style="color: #666666; font-size: 11px;">Cantidad: ${qty} x ${price.toFixed(2)}€</span>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; color: #ff5500; font-size: 13px;">
                  ${subtotal.toFixed(2)}€
                </td>
              </tr>
            `;
          }

          const mailOptions = {
            from: '"Escapes y Más" <web@backendescapes.com>',
            to: email,
            subject: `🏍️ ¡Te guardamos tu carrito en Escapes y Más!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 12px; overflow: hidden; background-color: #ffffff; color: #333333;">
                <div style="background-color: #0c0c0c; padding: 25px; text-align: center; border-bottom: 4px solid #ff5500;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: 1px;">ESCAPES Y MÁS</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="margin-top: 0; color: #111111; font-size: 18px;">¡Hola, ${clientName}!</h2>
                  <p style="font-size: 13px; line-height: 1.6; color: #555555; margin-bottom: 20px;">
                    Vemos que has dejado algunos artículos espectaculares en tu carrito de compra. ¡No te preocupes! Los hemos guardado de forma segura para ti para que no pierdas tus selecciones.
                  </p>
                  
                  <h3 style="margin-top: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; color: #ff5500; font-weight: 800;">Tu Carrito Seleccionado</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    ${itemsHtml}
                    <tr>
                      <td style="padding: 15px 10px; font-weight: bold; font-size: 13px; color: #111111;">TOTAL ESTIMADO</td>
                      <td style="padding: 15px 10px; text-align: right; font-weight: 900; font-size: 15px; color: #ff5500;">${total.toFixed(2)}€</td>
                    </tr>
                  </table>

                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://escapesymas.com/cart" style="background-color: #ff5500; color: #ffffff; text-decoration: none; padding: 13px 25px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                      Completar mi Compra Ahora
                    </a>
                  </div>
                  
                  <p style="font-size: 11px; line-height: 1.5; color: #888888; text-align: center; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                    Si tienes alguna duda o necesitas ayuda para finalizar tu compra, ponte en contacto con nosotros respondiendo directamente a este email o escribiéndonos a <a href="mailto:info@escapesymas.com" style="color: #ff5500; text-decoration: none;">info@escapesymas.com</a>.
                  </p>
                </div>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 10px; color: #aaaaaa; border-top: 1px solid #eeeeee;">
                  &copy; 2026 Escapes y Más. Todos los derechos reservados.
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          return res.json({ success: true });
        } catch (e: any) {
          console.error('[SEND ABANDONED EMAIL ERROR]:', e);
          return res.status(500).json({ error: e.message });
        }
      }

      case 'users-list': {
        const usersRes = await db.execute(sql`
          SELECT id, email, first_name as "firstName", last_name as "lastName", role, rank_level as "rankLevel", rank_xp as "rankXp", created_at as "createdAt" FROM users ORDER BY id ASC
        `);
        return res.json(usersRes.rows);
      }

      case 'update-user-role': {
        if (req.method !== 'POST') return res.status(405).end();
        const { userId: targetUserId, role } = req.body;
        if (!targetUserId || !role) return res.status(400).json({ error: 'Faltan datos' });
        await db.execute(sql`
          UPDATE users
          SET role = ${role}
          WHERE id = ${parseInt(targetUserId)}
        `);
        return res.json({ success: true });
      }

      case 'moderate-thread': {
        if (req.method !== 'POST') return res.status(405).end();
        const { threadId, isPinned, isClosed, deleteThread, userId } = req.body;
        if (!threadId) return res.status(400).json({ error: 'Falta threadId' });
        
        // Allow if admin OR the thread owner
        if (userId && !isAdmin) {
          const owner = await db.execute(sql`SELECT user_id FROM forum_posts WHERE id = ${parseInt(threadId)}`);
          if (owner.rows[0]?.user_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'No puedes modificar un hilo que no te pertenece' });
          }
        }
        
        if (deleteThread) {
          await db.execute(sql`DELETE FROM forum_replies WHERE post_id = ${parseInt(threadId)}`);
          await db.execute(sql`DELETE FROM forum_likes WHERE content_type = 'post' AND content_id = ${parseInt(threadId)}`);
          await db.execute(sql`DELETE FROM forum_posts WHERE id = ${parseInt(threadId)}`);
        } else {
          let updateQuery = `UPDATE forum_posts SET `;
          const updates = [];
          if (isPinned !== undefined) updates.push(`is_pinned = ${parseInt(isPinned)}`);
          if (isClosed !== undefined) updates.push(`is_closed = ${parseInt(isClosed)}`);
          
          if (updates.length > 0) {
            updateQuery += updates.join(', ') + ` WHERE id = ${parseInt(threadId)}`;
            await db.execute(sql.raw(updateQuery));
          }
        }
        // Invalidate forum cache
        swrCache.invalidatePattern('/api/forum');
        return res.json({ success: true });
      }

      case 'moderate-reply': {
        if (req.method !== 'POST') return res.status(405).end();
        const { replyId } = req.body;
        if (!replyId) return res.status(400).json({ error: 'Falta replyId' });
        await db.execute(sql`DELETE FROM forum_replies WHERE id = ${parseInt(replyId)}`);
        // Invalidate forum cache
        swrCache.invalidatePattern('/api/forum');
        return res.json({ success: true });
      }

      case 'delete-product': {
        if (req.method !== 'POST') return res.status(405).end();
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'Falta productId' });
        
        await db.execute(sql`
          DELETE FROM order_items WHERE product_id = ${parseInt(productId)}
        `);
        await db.execute(sql`
          DELETE FROM products WHERE id = ${parseInt(productId)}
        `);
        return res.json({ success: true });
      }

      case 'update-product': {
        if (req.method !== 'POST') return res.status(405).end();
        const b = req.body;
        const productId = parseInt(b.id);
        if (!productId) return res.status(400).json({ error: 'Falta productId' });

        const safeName = (b.name || "Sin nombre").substring(0, 255);
        const safeSku = (b.sku || `SKU-${Date.now()}`).substring(0, 100);
        const raw = parseFloat(b.price);
        const priceInCents = isNaN(raw) ? 0 : Math.round(raw * 100);
        const rawSale = parseFloat(b.salePrice);
        const saleCents = isNaN(rawSale) ? null : Math.round(rawSale * 100);
        const stock = parseInt(b.stock) || 0;
        const desc = b.description || null;
        const imgs = b.images?.length > 0 ? JSON.stringify(b.images) : null;
        const compat = b.compatibility?.length > 0 ? JSON.stringify(b.compatibility) : null;
        const status = b.status || 'published';
        const brand = b.brand || '';
        const cost = b.cost ? Math.round(parseFloat(b.cost) * 100) : null;
        const category2Id = b.category2Id ? parseInt(b.category2Id) : null;
        const category3Id = b.category3Id ? parseInt(b.category3Id) : null;
        const dropshipping = b.dropshipping === true || b.dropshipping === 'true';
        const ondemand = b.ondemand === true || b.ondemand === 'true';
        const barcode = b.barcode || '';
        const supplierCode = b.supplierCode || '';
        const weightG = b.weight_g ? parseInt(b.weight_g) : null;
        const lengthMm = b.length_mm ? parseInt(b.length_mm) : null;
        const widthMm = b.width_mm ? parseInt(b.width_mm) : null;
        const heightMm = b.height_mm ? parseInt(b.height_mm) : null;
        const deliveryPlant = b.deliveryPlant || '';

        await db.execute(sql`
          UPDATE products
          SET name = ${safeName}, sku = ${safeSku}, price = ${priceInCents}, sale_price = ${saleCents},
              stock = ${stock}, description = ${desc}, images = ${imgs}, compatibility = ${compat},
              status = ${status}, brand = ${brand}, cost = ${cost},
              category2_id = ${category2Id}, category3_id = ${category3Id},
              dropshipping = ${dropshipping}, ondemand = ${ondemand},
              barcode = ${barcode}, supplier_code = ${supplierCode},
              weight_g = ${weightG}, length_mm = ${lengthMm},
              width_mm = ${widthMm}, height_mm = ${heightMm},
              delivery_plant = ${deliveryPlant}
          WHERE id = ${productId}
        `);
        return res.json({ success: true });
      }

      case 'coupons-list': {
        const couponsRes = await db.execute(sql`
          SELECT * FROM coupons ORDER BY created_at DESC
        `);
        return res.json(couponsRes.rows);
      }

      case 'create-coupon': {
        if (req.method !== 'POST') return res.status(405).end();
        const { code, type, value, active, expiresAt, maxUses } = req.body;
        if (!code || !type || value === undefined) {
          return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        const codeUpper = code.trim().toUpperCase();
        const expiresVal = expiresAt ? new Date(expiresAt) : null;
        
        await db.execute(sql`
          INSERT INTO coupons (code, type, value, active, expires_at, max_uses, times_used)
          VALUES (${codeUpper}, ${type}, ${parseInt(value)}, ${active !== undefined ? parseInt(active) : 1}, ${expiresVal}, ${maxUses !== undefined ? parseInt(maxUses) : 999999}, 0)
        `);
        return res.json({ success: true });
      }

      case 'delete-coupon': {
        if (req.method !== 'POST') return res.status(405).end();
        const { couponId } = req.body;
        if (!couponId) return res.status(400).json({ error: 'Falta couponId' });
        await db.execute(sql`
          DELETE FROM coupons WHERE id = ${parseInt(couponId)}
        `);
        return res.json({ success: true });
      }

      case 'seo-autolinks-list': {
        const linksRes = await db.execute(sql`
          SELECT * FROM seo_autolinks ORDER BY created_at DESC
        `);
        return res.json(linksRes.rows);
      }

      case 'seo-autolinks-save': {
        if (req.method !== 'POST') return res.status(405).end();
        const { keyword, url, active } = req.body;
        if (!keyword || !url) return res.status(400).json({ error: 'Faltan datos obligatorios' });
        
        await db.execute(sql`
          INSERT INTO seo_autolinks (keyword, url, active)
          VALUES (${keyword.trim()}, ${url.trim()}, ${active !== undefined ? parseInt(active) : 1})
          ON CONFLICT (keyword) DO UPDATE
          SET url = EXCLUDED.url, active = EXCLUDED.active
        `);
        return res.json({ success: true });
      }

      case 'seo-autolinks-delete': {
        if (req.method !== 'POST') return res.status(405).end();
        const { linkId } = req.body;
        if (!linkId) return res.status(400).json({ error: 'Falta linkId' });
        await db.execute(sql`
          DELETE FROM seo_autolinks WHERE id = ${parseInt(linkId)}
        `);
        return res.json({ success: true });
      }

      default:
        return res.json({ status: 'ok' });
    }
  } catch (err: any) {
    console.error('[ADMIN ERROR]:', err);
    res.status(500).json({ error: err.message, detail: err.detail });
  }
});

// ================================================================
// AUTH (Login/Register/Profile)
// ================================================================
app.get('/api/auth', async (req, res) => {
  const { action, email, id } = req.query as any;

  try {
    if (action === 'get-profile') {
      if (!email && !id) return res.status(400).json({ error: 'Falta email o id' });

      let query = `SELECT * FROM users WHERE 1=1`;
      if (email) {
        const safeEmail = sanitizeString(email);
        query += ` AND LOWER(email) = LOWER('${safeEmail}')`;
      } else if (id) {
        const safeId = parseIntSafe(id);
        if (!safeId) return res.status(400).json({ error: 'ID inválido' });
        query += ` AND id = ${safeId}`;
      }

      const userRes = await db.execute(sql.raw(query));
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = userRes.rows[0] as any;
      
      // Intentar decodificar metadatos o billing
      let billing = { address_1: '', city: '', postcode: '', phone: '' };
      try {
        if (user.billing) {
          billing = typeof user.billing === 'string' ? JSON.parse(user.billing) : user.billing;
        }
      } catch (e) {}

      let garage: any[] = [];
      try {
        if (user.garage) {
          garage = typeof user.garage === 'string' ? JSON.parse(user.garage) : user.garage;
        }
      } catch (e) {}

      let cart: any[] = [];
      try {
        if (user.cart) {
          cart = typeof user.cart === 'string' ? JSON.parse(user.cart) : user.cart;
        }
      } catch (e) {}

      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        avatarUrl: user.avatar_url || '',
        role: user.role || 'customer',
        rank: user.rank || 'Novato',
        xp: user.xp || 0,
        billing,
        garage,
        cart
      });
    } else if (action === 'search-users') {
      const { q } = req.query as any;
      if (!q) return res.json([]);

      const userRes = await db.execute(sql`
        SELECT id, username, first_name, last_name, avatar_url FROM users
        WHERE LOWER(username) LIKE ${'%' + q.toLowerCase() + '%'}
           OR LOWER(email) LIKE ${'%' + q.toLowerCase() + '%'}
           OR LOWER(first_name) LIKE ${'%' + q.toLowerCase() + '%'}
           OR LOWER(last_name) LIKE ${'%' + q.toLowerCase() + '%'}
        LIMIT 5
      `);

      const list = userRes.rows.map((row: any) => ({
        id: row.id,
        name: row.first_name ? `${row.first_name} ${row.last_name || ''}`.trim() : row.username,
        avatar: row.avatar_url || ''
      }));

      return res.json(list);
    }

    return res.status(400).json({ error: 'Acción no válida' });
  } catch (err: any) {
    console.error('[AUTH GET PROFILE ERROR]:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth', async (req, res) => {
  const { action } = req.query as any;
  const body = req.body;

  try {
    if (action === 'login' || action === 'social-login') {
      const { username, password } = body;
      if (!username) return res.status(400).json({ error: 'Falta email o usuario' });

      // Buscar por email o username en PostgreSQL
      const userRes = await db.execute(sql`
        SELECT * FROM users
        WHERE LOWER(email) = LOWER(${username}) OR LOWER(username) = LOWER(${username})
      `);

      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const user = userRes.rows[0] as any;
      const passHash = crypto.createHash('sha256').update(password || '').digest('hex');

      // Si el usuario no tiene contraseña establecida (migrado de WordPress), se la guardamos en el primer login
      if (!user.password_hash) {
        await db.execute(sql`
          UPDATE users
          SET password_hash = ${passHash}
          WHERE id = ${user.id}
        `);
        user.password_hash = passHash;
      }

      // Si es un login social (bypass de contraseña) o contraseña coincide
      const isSocial = !!(body.provider && body.token);
      if (!isSocial && user.password_hash && user.password_hash !== passHash) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // Generar respuesta de sesión limpia y compatible con el frontend
      const session = {
        token: `db-session-token-${user.id}-${Date.now()}`,
        user_id: user.id,
        user_email: user.email,
        user_nicename: user.username,
        user_display_name: user.first_name || user.username,
        avatarUrl: user.avatar_url || '',
        role: user.role || 'customer'
      };

      return res.json(session);

    } else if (action === 'register') {
      const { username, email, password, firstName, lastName, phone } = body;
      if (!username || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });

      // Comprobar si ya existe
      const existRes = await db.execute(sql`
        SELECT id FROM users
        WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${username})
      `);

      if (existRes.rows.length > 0) {
        return res.status(400).json({ error: 'El email o nombre de usuario ya está registrado' });
      }

      const passHash = crypto.createHash('sha256').update(password).digest('hex');
      const role = email.toLowerCase() === 'info@escapesymas.com' ? 'admin' : 'customer';
      const billingData = JSON.stringify({ address_1: '', city: '', postcode: '', phone: phone || '' });

      const insertRes = await db.execute(sql`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, billing)
        VALUES (${username}, ${email}, ${passHash}, ${firstName || username}, ${lastName || ''}, ${role}, ${billingData})
        RETURNING id
      `);

      const newId = insertRes.rows[0]?.id;

      // Auto-login
      const session = {
        token: `db-session-token-${newId}-${Date.now()}`,
        user_id: newId,
        user_email: email,
        user_nicename: username,
        user_display_name: firstName || username,
        avatarUrl: '',
        role: role
      };

      return res.json(session);
    } else if (action === 'update-profile') {
      const { userId, firstName, lastName, email, billing, garage, avatarUrl } = body;
      if (!userId) return res.status(400).json({ error: 'Falta userId' });

      // Cargar el usuario actual
      const userRes = await db.execute(sql`SELECT * FROM users WHERE id = ${parseInt(userId)}`);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      const user = userRes.rows[0] as any;

      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existRes = await db.execute(sql`
          SELECT id FROM users
          WHERE LOWER(email) = LOWER(${email}) AND id != ${parseInt(userId)}
        `);
        if (existRes.rows.length > 0) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
        }
      }

      let billingJson = user.billing;
      if (billing !== undefined) {
        billingJson = typeof billing === 'string' ? billing : JSON.stringify(billing);
      }

      let garageJson = user.garage;
      if (garage !== undefined) {
        garageJson = typeof garage === 'string' ? garage : JSON.stringify(garage);
      }

      await db.execute(sql`
        UPDATE users
        SET 
          first_name = COALESCE(${firstName || null}, first_name),
          last_name = COALESCE(${lastName || null}, last_name),
          email = COALESCE(${email || null}, email),
          billing = ${billingJson || null},
          garage = ${garageJson || null},
          avatar_url = COALESCE(${avatarUrl || null}, avatar_url)
        WHERE id = ${parseInt(userId)}
      `);

      return res.json({ success: true });
    } else if (action === 'save-cart') {
      const { userId, cart } = body;
      if (!userId) return res.status(400).json({ error: 'Falta userId' });
      await db.execute(sql`
        UPDATE users
        SET cart = ${cart ? JSON.stringify(cart) : null}
        WHERE id = ${parseInt(userId)}
      `);
      return res.json({ success: true });
    } else if (action === 'delete-account') {
      const { userId } = body;
      if (!userId) return res.status(400).json({ error: 'Falta userId' });

      const parsedId = parseInt(userId);
      try {
        await db.execute(sql`DELETE FROM users WHERE id = ${parsedId}`);
      } catch (err) {
        await db.execute(sql`
          UPDATE users
          SET 
            username = ${`eliminado_${parsedId}`},
            email = ${`eliminado_${parsedId}@escapesymas.com`},
            first_name = 'Usuario',
            last_name = 'Eliminado',
            password_hash = '',
            avatar_url = '',
            billing = null,
            garage = null,
            cart = null,
            role = 'customer'
          WHERE id = ${parsedId}
        `);
      }
    } else if (action === 'change-password') {
      const { userId, currentPassword, newPassword } = body;
      if (!userId || !currentPassword || !newPassword) return res.status(400).json({ error: 'Faltan campos obligatorios' });

      const userRes = await db.execute(sql`SELECT password_hash FROM users WHERE id = ${parseInt(userId)}`);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      const user = userRes.rows[0] as any;
      const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');

      if (user.password_hash && user.password_hash !== currentHash) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
      await db.execute(sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${parseInt(userId)}`);
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Acción no válida' });
  } catch (err: any) {
    console.error('[AUTH ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// FORUM (Paddock)
// ================================================================
const RANKS = [
  { level: 1, title: 'Novato', xpRequired: 0, icon: '🏍️' },
  { level: 2, title: 'Aprendiz', xpRequired: 50, icon: '⚡' },
  { level: 3, title: 'Piloto', xpRequired: 150, icon: '🏁' },
  { level: 4, title: 'Experto', xpRequired: 300, icon: '🔥' },
  { level: 5, title: 'Profesional', xpRequired: 500, icon: '💨' },
  { level: 6, title: 'Leyenda', xpRequired: 1000, icon: '👑' }
];
const XP = { POST: 15, REPLY: 10, RECV_LIKE: 5, GIVE_LIKE: 1 };
const calcRank = (xp: number) => { for (let i = RANKS.length - 1; i >= 0; i--) { if (xp >= RANKS[i].xpRequired) return RANKS[i]; } return RANKS[0]; };

app.all('/api/forum', async (req, res) => {
  const { action, category_id, thread_id } = req.query as any;

  try {
    switch (action) {
      case 'categories': {
        const cacheKey = '/api/forum?action=categories';
        const result = await executeSWR(cacheKey, async () => {
          return [
            { id: 1, title: '🔧 Mecánica y Taller', description: 'Consultas técnicas, bricos y mantenimiento.' },
            { id: 2, title: '🏍️ Compra-Venta', description: 'Mercadillo entre moteros.' },
            { id: 3, title: '🗺️ Rutas y Quedadas', description: 'Planea tu próxima salida.' },
            { id: 4, title: '🏁 General Paddock', description: 'Charlas generales sobre el mundo de las dos ruedas.' }
          ];
        }, 3600, 7200); // 1 hora de TTL fresco para categorías
        return res.json(result);
      }

      case 'threads': {
        const cacheKey = `/api/forum?action=threads&category_id=${category_id || ''}`;
        
        // Las listas de hilos se cachean por 10s frescos y 30s de gracia SWR
        const result = await executeSWR(cacheKey, async () => {
          const threads = await db.select({
            id: forumPosts.id, title: forumPosts.title, createdAt: forumPosts.createdAt,
            likes: forumPosts.likes, authorName: users.username, authorAvatar: users.avatarUrl,
            isPinned: forumPosts.isPinned, isClosed: forumPosts.isClosed
          }).from(forumPosts).leftJoin(users, eq(forumPosts.userId, users.id))
            .where(category_id ? eq(forumPosts.category, category_id) : undefined)
            .orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt));
          return { data: threads };
        }, 10, 30);
        return res.json(result);
      }

      case 'thread-detail': {
        if (!thread_id) return res.status(400).json({ error: 'Falta thread_id' });
        const cacheKey = `/api/forum?action=thread-detail&thread_id=${thread_id}`;

        // Detalle de hilos: 5s frescos y 15s de gracia SWR
        const result = await executeSWR(cacheKey, async () => {
          const thread = await db.select().from(forumPosts).where(eq(forumPosts.id, parseInt(thread_id))).limit(1);
          const replies = await db.select({
            id: forumReplies.id, content: forumReplies.content, createdAt: forumReplies.createdAt,
            authorName: users.username, authorAvatar: users.avatarUrl, authorXP: users.rankXp
          }).from(forumReplies).leftJoin(users, eq(forumReplies.userId, users.id))
            .where(eq(forumReplies.postId, parseInt(thread_id))).orderBy(forumReplies.createdAt);
          return { thread: thread[0], replies: replies.map(r => ({ ...r, authorRank: calcRank(r.authorXP || 0) })) };
        }, 5, 15);
        return res.json(result);
      }

      case 'create-thread': {
        if (req.method !== 'POST') return res.status(405).end();
        const { title, content, userId, category } = req.body;
        const [newPost] = await db.insert(forumPosts).values({ userId, title, content, category: category || 'general' }).returning();
        await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.POST}` }).where(eq(users.id, userId));
        
        // Purgar de inmediato la caché del foro al haber escritura
        swrCache.invalidatePattern('/api/forum');

        return res.json({ success: true, id: newPost.id });
      }

      case 'reply': {
        if (req.method !== 'POST') return res.status(405).end();
        const { postId, replyUserId, replyContent } = req.body;
        
        // Comprobar si el hilo está cerrado
        const thread = await db.select().from(forumPosts).where(eq(forumPosts.id, postId)).limit(1);
        if (thread[0]?.isClosed) {
          return res.status(400).json({ error: 'Este tema está cerrado y no admite más respuestas.' });
        }

        await db.insert(forumReplies).values({ postId, userId: replyUserId, content: replyContent });
        await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.REPLY}` }).where(eq(users.id, replyUserId));
        
        // Purgar de inmediato la caché del foro al haber escritura
        swrCache.invalidatePattern('/api/forum');

        return res.json({ success: true });
      }

      case 'toggle-like': {
        if (req.method !== 'POST') return res.status(405).end();
        const { targetType, targetId, currentUserId } = req.body;
        const existing = await db.select().from(forumLikes).where(
          and(eq(forumLikes.userId, currentUserId), eq(forumLikes.contentType, targetType), eq(forumLikes.contentId, targetId))
        ).limit(1);

        if (existing.length > 0) {
          await db.delete(forumLikes).where(eq(forumLikes.id, existing[0].id));
          if (targetType === 'post') await db.update(forumPosts).set({ likes: sql`${forumPosts.likes} - 1` }).where(eq(forumPosts.id, targetId));
          
          swrCache.invalidatePattern('/api/forum');
          return res.json({ success: true, liked: false });
        } else {
          await db.insert(forumLikes).values({ userId: currentUserId, contentType: targetType, contentId: targetId });
          if (targetType === 'post') await db.update(forumPosts).set({ likes: sql`${forumPosts.likes} + 1` }).where(eq(forumPosts.id, targetId));
          await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.GIVE_LIKE}` }).where(eq(users.id, currentUserId));
          
          swrCache.invalidatePattern('/api/forum');
          return res.json({ success: true, liked: true });
        }
      }

      default:
        return res.status(400).json({ error: 'Acción no reconocida' });
    }
  } catch (err: any) {
    console.error('[FORUM ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// USER RANK (nativo PostgreSQL)
// ================================================================
app.get('/api/user/:id/rank', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId || isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

    const uRes = await db.execute(sql`SELECT rank_xp, rank_level, username FROM users WHERE id = ${userId}`);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = uRes.rows[0] as any;
    const xp: number = user.rank_xp || 0;
    const rank = calcRank(xp);
    const nextRank = RANKS.find(r => r.xpRequired > xp);

    return res.json({
      level: rank.level,
      title: rank.title,
      xp,
      next_xp: nextRank ? nextRank.xpRequired : xp,
      discount: Math.min((rank.level - 1) * 2, 10),
      icon: rank.icon
    });
  } catch (err: any) {
    console.error('[RANK ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GARAGE
// ================================================================
app.all('/api/garage', async (req, res) => {
  const { userEmail } = req.query as any;
  if (!userEmail) return res.status(401).json({ error: 'No autorizado' });

  try {
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const userId = user[0].id;

    if (req.method === 'GET') {
      const vehicles = await db.select().from(garage).where(eq(garage.userId, userId));
      return res.json(vehicles);
    }
    if (req.method === 'POST') {
      const { brand, model, year } = req.body;
      if (!brand || !model || !year) return res.status(400).json({ error: 'Faltan datos' });
      const [v] = await db.insert(garage).values({ userId, brand, model, year }).returning();
      return res.status(201).json(v);
    }
    if (req.method === 'DELETE') {
      const { vehicleId } = req.body;
      await db.delete(garage).where(and(eq(garage.id, vehicleId), eq(garage.userId, userId)));
      return res.json({ success: true });
    }
    res.status(405).json({ error: 'Método no permitido' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUBLIC VALIDATIONS & dynamic mappings
// ================================================================
app.post('/api/coupons/validate', async (req: any, res: any) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, error: 'Falta el código de cupón' });

  try {
    const codeUpper = code.trim().toUpperCase();
    const coupRes = await db.execute(sql`
      SELECT * FROM coupons WHERE UPPER(code) = ${codeUpper} AND active = 1
    `);

    if (coupRes.rows.length > 0) {
      const c = coupRes.rows[0] as any;
      const now = new Date();
      const expiry = c.expires_at ? new Date(c.expires_at) : null;
      const underLimit = c.max_uses === null || c.times_used < c.max_uses;

      if ((!expiry || expiry > now) && underLimit) {
        return res.json({
          valid: true,
          code: c.code,
          type: c.type,
          value: c.value // en céntimos (si es fixed) o porcentaje (si es percent)
        });
      } else {
        return res.json({ valid: false, error: 'El cupón ha expirado o alcanzado su límite de uso' });
      }
    } else {
      // Legacy hardcoded fallbacks
      if (codeUpper === 'WELCOME10') {
        return res.json({ valid: true, code: 'WELCOME10', type: 'percent', value: 10 });
      } else if (codeUpper === 'RIDER20') {
        return res.json({ valid: true, code: 'RIDER20', type: 'percent', value: 20 });
      } else if (codeUpper === 'ENVIOFREE') {
        return res.json({ valid: true, code: 'ENVIOFREE', type: 'free_shipping', value: 0 });
      }
      return res.json({ valid: false, error: 'Cupón no válido' });
    }
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

app.get('/api/seo/autolinks', async (req, res) => {
  try {
    const linksRes = await db.execute(sql`
      SELECT keyword, url FROM seo_autolinks WHERE active = 1
    `);
    const mapping: Record<string, string> = {};
    linksRes.rows.forEach((row: any) => {
      mapping[row.keyword] = row.url;
    });
    return res.json(mapping);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PEDIDOS & CHECKOUT CUSTOM (PostgreSQL)
// ================================================================
app.post('/api/orders/create', async (req: any, res: any) => {
  try {
    const { userEmail, cart, shippingData, paymentMethod, promoCode } = req.body;
    if (!cart || cart.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });
    if (!shippingData) return res.status(400).json({ error: 'Faltan datos de envío' });

    let dbUserId = null;
    if (userEmail) {
      const uRes = await db.execute(sql`SELECT id FROM users WHERE email = ${userEmail}`);
      if (uRes.rows.length > 0) dbUserId = uRes.rows[0].id;
    }

    // Calcular total seguro en céntimos consultando los productos en la BD
    let subtotalCents = 0;
    const itemsToInsert = [];

    for (const item of cart) {
      const pRes = await db.execute(sql`SELECT price, sale_price FROM products WHERE id = ${parseInt(item.id as string)}`);
      if (pRes.rows.length === 0) return res.status(400).json({ error: `Producto con ID ${item.id} no existe` });
      
      const dbRow = pRes.rows[0] as any;
      const dbPrice = dbRow.sale_price || dbRow.price || 0; // en céntimos
      subtotalCents += (dbPrice as number) * parseInt(item.quantity as string);
      
      itemsToInsert.push({
        productId: parseInt(item.id as string),
        quantity: parseInt(item.quantity as string),
        price: dbPrice
      });
    }

    // Aplicar lógica de Tiers
    let discountPercent = 0;
    let shippingCents = 1500; // 15.00€ por defecto

    const subtotalEur = subtotalCents / 100;
    if (subtotalEur >= 500) {
      discountPercent = 15;
      shippingCents = 0;
    } else if (subtotalEur >= 300) {
      discountPercent = 10;
      shippingCents = 0;
    } else if (subtotalEur >= 150) {
      discountPercent = 5;
      shippingCents = 0;
    }

    // Aplicar lógica de Cupones/Promo Codes
    let promoDiscountPercent = 0;
    let promoFreeShipping = false;
    let promoFixedDiscountCents = 0;

    if (promoCode) {
      const codeUpper = promoCode.trim().toUpperCase();
      const coupRes = await db.execute(sql`
        SELECT * FROM coupons WHERE UPPER(code) = ${codeUpper} AND active = 1
      `);
      if (coupRes.rows.length > 0) {
        const c = coupRes.rows[0] as any;
        const now = new Date();
        const expiry = c.expires_at ? new Date(c.expires_at) : null;
        const underLimit = c.max_uses === null || c.times_used < c.max_uses;

        if ((!expiry || expiry > now) && underLimit) {
          if (c.type === 'percent') {
            promoDiscountPercent = c.value;
          } else if (c.type === 'fixed') {
            promoFixedDiscountCents = c.value; // en céntimos
          } else if (c.type === 'free_shipping') {
            promoFreeShipping = true;
          }
          
          // Incrementar contador de usos
          await db.execute(sql`
            UPDATE coupons SET times_used = times_used + 1 WHERE id = ${c.id}
          `);
        }
      } else {
        // Fallbacks legacy
        if (codeUpper === 'WELCOME10') {
          promoDiscountPercent = 10;
        } else if (codeUpper === 'RIDER20') {
          promoDiscountPercent = 20;
        } else if (codeUpper === 'ENVIOFREE') {
          promoFreeShipping = true;
        }
      }
    }

    const totalDiscountPercent = discountPercent + promoDiscountPercent;
    let discountCents = Math.round((subtotalCents * totalDiscountPercent) / 100) + promoFixedDiscountCents;
    
    if (promoFreeShipping) {
      shippingCents = 0;
    }

    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);

    // Enriquecer shippingData con una traza financiera auditada de doble entrada
    const enrichedShippingData = {
      ...shippingData,
      financials: {
        subtotal: subtotalEur,
        discountPercent: totalDiscountPercent,
        discountAmount: discountCents / 100,
        shippingCost: shippingCents / 100,
        total: totalCents / 100,
        promoCode: promoCode || null,
        timestamp: new Date().toISOString()
      }
    };
    const shippingJson = JSON.stringify(enrichedShippingData);

    // Crear la orden en PostgreSQL con las columnas de contabilidad dedicadas
    const upperPromo = promoCode ? promoCode.trim().toUpperCase() : null;
    const orderInsert = await db.execute(sql`
      INSERT INTO orders (user_id, total, status, shipping_data, subtotal, discount_amount, shipping_cost, promo_code)
      VALUES (${dbUserId}, ${totalCents}, 'pending', ${shippingJson}, ${subtotalCents}, ${discountCents}, ${shippingCents}, ${upperPromo})
      RETURNING id
    `);
    
    const newOrderId = orderInsert.rows[0].id;

    // Insertar items de la orden
    for (const item of itemsToInsert) {
      await db.execute(sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${newOrderId}, ${item.productId}, ${item.quantity}, ${item.price})
      `);
    }

    res.status(201).json({
      success: true,
      orderId: newOrderId,
      total: totalCents / 100, // en euros
      subtotal: subtotalEur,
      discount: discountCents / 100,
      shipping: shippingCents / 100
    });
  } catch (err: any) {
    console.error('[ORDER CREATE ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/my-orders', async (req: any, res: any) => {
  const { userEmail } = req.query as any;
  if (!userEmail) return res.status(400).json({ error: 'Falta userEmail' });

  try {
    const uRes = await db.execute(sql`SELECT id FROM users WHERE email = ${userEmail}`);
    if (uRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const userId = uRes.rows[0].id;

    const ordersRes = await db.execute(sql`
      SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC
    `);

    const result = [];
    for (const rawOrder of ordersRes.rows) {
      const order = rawOrder as any;
      const itemsRes = await db.execute(sql`
        SELECT oi.*, p.name as product_name, p.images as product_images
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ${order.id}
      `);
      
      let parsedShipping = {};
      try { parsedShipping = order.shipping_data ? JSON.parse(order.shipping_data as string) : {}; } catch { }

      result.push({
        id: order.id,
        total: (order.total as number) / 100, // en euros
        status: order.status,
        paymentId: order.payment_id,
        shippingData: parsedShipping,
        createdAt: order.created_at,
        items: itemsRes.rows.map(rawItem => {
          const item = rawItem as any;
          let imgs = [];
          try { imgs = item.product_images ? JSON.parse(item.product_images as string) : []; } catch { }
          return {
            id: item.id,
            productId: item.product_id,
            productName: item.product_name || 'Producto eliminado',
            image: imgs[0]?.src || imgs[0] || '',
            quantity: item.quantity,
            price: (item.price as number) / 100 // en euros
          };
        })
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[MY ORDERS ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/finalize', async (req: any, res: any) => {
  try {
    const { orderId, paymentId, status } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

    // Actualizar el estado y el payment_id en la base de datos
    await db.execute(sql`
      UPDATE orders
      SET status = ${status || 'processing'}, payment_id = ${paymentId || null}
      WHERE id = ${parseInt(orderId)}
    `);

    // Reducir stock si la orden se marca como pagada
    const finalStatus = status || 'processing';
    if (finalStatus === 'processing' || finalStatus === 'completed') {
      const itemsRes = await db.execute(sql`
        SELECT product_id, quantity FROM order_items WHERE order_id = ${parseInt(orderId)}
      `);
      
      for (const rawItem of itemsRes.rows) {
        const item = rawItem as any;
        await db.execute(sql`
          UPDATE products
          SET stock = GREATEST(0, stock - ${parseInt(item.quantity as string)})
          WHERE id = ${parseInt(item.product_id as string)}
        `);
      }

      // Auto-generate invoice when paid
      try {
        await createInvoiceForOrder(parseInt(orderId));
        console.log(`[AUTO-INVOICE] Invoice auto-generated successfully for Order ${orderId}`);
      } catch (e: any) {
        console.error(`[AUTO-INVOICE ERROR] Failed to auto-generate invoice for Order ${orderId}:`, e);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('[ORDER FINALIZE ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PERSISTENT CART ENDPOINTS
// ================================================================
app.post('/api/cart', async (req: any, res: any) => {
  try {
    const { userId, sessionToken, items, userEmail, userFirstName, userLastName, userUsername } = req.body;
    if (!sessionToken) return res.status(400).json({ error: 'Falta sessionToken' });
    const itemsStr = JSON.stringify(items || []);

    const safeUserId = userId && userId !== 'undefined' ? parseInt(userId) : null;

    if (safeUserId) {
      // Auto-sync WordPress customer profile to PostgreSQL users table
      const emailVal = userEmail || `wp_user_${safeUserId}@escapesymas.com`;
      const usernameVal = userUsername || `wp_user_${safeUserId}`;
      const fnameVal = userFirstName || '';
      const lnameVal = userLastName || '';

      const userExists = await db.execute(sql`
        SELECT id, wp_id FROM users WHERE wp_id = ${safeUserId} OR LOWER(email) = LOWER(${emailVal})
      `);

      if (userExists.rows.length > 0) {
        const matched = userExists.rows[0] as any;
        await db.execute(sql`
          UPDATE users
          SET wp_id = ${safeUserId}, email = ${emailVal}, username = ${usernameVal}, first_name = ${fnameVal}, last_name = ${lnameVal}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${matched.id}
        `);
      } else {
        const usernameExists = await db.execute(sql`
          SELECT id FROM users WHERE LOWER(username) = LOWER(${usernameVal})
        `);
        const finalUsername = usernameExists.rows.length > 0 ? `${usernameVal}_${safeUserId}` : usernameVal;

        await db.execute(sql`
          INSERT INTO users (wp_id, username, email, first_name, last_name, role)
          VALUES (${safeUserId}, ${finalUsername}, ${emailVal}, ${fnameVal}, ${lnameVal}, 'customer')
        `);
      }
    }

    const existing = await db.execute(sql`
      SELECT id FROM carts WHERE session_token = ${sessionToken}
    `);

    if (existing.rows.length > 0) {
      await db.execute(sql`
        UPDATE carts
        SET user_id = ${safeUserId}, items = ${itemsStr}, updated_at = CURRENT_TIMESTAMP
        WHERE session_token = ${sessionToken}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO carts (user_id, session_token, items)
        VALUES (${safeUserId}, ${sessionToken}, ${itemsStr})
      `);
    }
    return res.json({ success: true });
  } catch (e: any) {
    console.error('[CART SAVE ERROR]:', e);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/cart', async (req: any, res: any) => {
  try {
    const { sessionToken, userId } = req.query as any;
    if (!sessionToken) return res.status(400).json({ error: 'Falta sessionToken' });

    let cartRes;
    if (userId && userId !== 'undefined') {
      cartRes = await db.execute(sql`
        SELECT * FROM carts 
        WHERE user_id = ${parseInt(userId)} OR session_token = ${sessionToken}
        ORDER BY updated_at DESC LIMIT 1
      `);
    } else {
      cartRes = await db.execute(sql`
        SELECT * FROM carts WHERE session_token = ${sessionToken}
      `);
    }

    if (cartRes.rows.length > 0) {
      const cart = cartRes.rows[0] as any;
      return res.json({
        id: cart.id,
        userId: cart.user_id,
        sessionToken: cart.session_token,
        items: cart.items ? JSON.parse(cart.items as string) : [],
        updatedAt: cart.updated_at
      });
    } else {
      return res.json({ items: [] });
    }
  } catch (e: any) {
    console.error('[CART GET ERROR]:', e);
    return res.status(500).json({ error: e.message });
  }
});

// ================================================================
// COMPLEMENTARY ENDPOINTS (Checkout, Contact, Warranty)
// ================================================================
const SUMUP_API_KEY = process.env.SUMUP_SECRET_KEY || 'sup_sk_s1ekP4mYZVZvgbU52Df6AdjxEwbC98wmT';

app.post('/api/checkout', async (req: any, res: any) => {
  const { amount, orderRef, currency, merchantEmail } = req.body;
  if (!SUMUP_API_KEY) return res.status(500).json({ message: "Configuración incompleta: Falta SUMUP_SECRET_KEY" });

  try {
    const finalMerchantEmail = merchantEmail || 'info@escapesymas.com';
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: orderRef,
        amount,
        currency: currency || 'EUR',
        pay_to_email: finalMerchantEmail,
        description: `Pedido ${orderRef}`,
        return_url: `https://${req.get('host')}/?payment_success=true&order=${orderRef}`
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return res.json(data);
  } catch (error: any) {
    console.error('[CHECKOUT ERROR]:', error);
    return res.status(500).json({ message: "Error interno en la pasarela de pagos" });
  }
});

app.post('/api/contact', async (req: any, res: any) => {
  const { name, email, subject, message } = req.body;

  console.log("[CONTACT] Received request from:", name, email);

  if (!name || !email || !message) {
    console.log("[CONTACT] Missing required fields");
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    console.log("[CONTACT] Creating transporter...");
    const transporter = nodemailer.createTransport({
      host: "smtp.buzondecorreo.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || "web@backendescapes.com",
        pass: process.env.SMTP_PASSWORD || "Pedrito2011P!"
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log("[CONTACT] Verifying transporter connection...");
    await transporter.verify();
    console.log("[CONTACT] Transporter verified successfully");

    const mailOptions = {
      from: '"Escapes y Más Web" <web@backendescapes.com>',
      to: "info@escapesymas.com",
      replyTo: email,
      subject: `Consulta de ${subject || 'General'}`,
      html: `
        <h3>Nueva Consulta desde la Web</h3>
        <p><strong>De:</strong> ${name} (${email})</p>
        <p><strong>Asunto:</strong> ${subject || 'General'}</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 5px solid #ff4500;">
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `
    };

    console.log("[CONTACT] Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("[CONTACT] ✅ Email sent successfully:", info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error("[CONTACT] ❌ Email error:", error.message);
    return res.status(500).json({ error: "Error al enviar el correo: " + error.message });
  }
});

app.post('/api/warranty', async (req: any, res: any) => {
  const { invoiceNumber, purchaseDate, installationDate, buyerName, email, phone, products, images } = req.body;

  console.log("[WARRANTY] Received request from:", buyerName, email);

  if (!invoiceNumber || !email || !buyerName) {
    console.log("[WARRANTY] Missing required fields");
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    console.log("[WARRANTY] Creating transporter...");
    const transporter = nodemailer.createTransport({
      host: 'smtp.buzondecorreo.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'web@backendescapes.com',
        pass: process.env.SMTP_PASSWORD || 'Pedrito2011P!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const productRows = (products || []).map((p: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.issue}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <h2>Nueva Solicitud de Garantía</h2>
      <p><strong>Factura:</strong> ${invoiceNumber}</p>
      <p><strong>Fecha Compra:</strong> ${purchaseDate}</p>
      <p><strong>Fecha Instalación:</strong> ${installationDate || 'No indicada'}</p>
      <p><strong>Titular:</strong> ${buyerName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      
      <h3>Productos e Incidencias</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Producto</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Incidencia</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    `;

    const attachments = (images || []).map((img: string, index: number) => {
      const split = img.split(',');
      const typeMatch = split[0].match(/:(.*?);/);
      const type = typeMatch ? typeMatch[1] : 'image/jpeg';
      const itemContent = split[1];
      const ext = type.split('/')[1] || 'jpg';

      return {
        filename: `evidencia_${index + 1}.${ext}`,
        content: itemContent,
        encoding: 'base64'
      };
    });

    try {
      await transporter.sendMail({
        from: '"Portal Garantías" <web@backendescapes.com>',
        to: 'garantiasydevoluciones@escapesymas.com',
        replyTo: email,
        subject: `[GARANTÍA] ${invoiceNumber} - ${buyerName}`,
        html: htmlContent,
        attachments: attachments
      });

      await transporter.sendMail({
        from: '"Escapes y Más" <web@backendescapes.com>',
        to: email,
        replyTo: 'garantiasydevoluciones@escapesymas.com',
        subject: 'Hemos recibido tu solicitud de garantía',
        html: `
          <h3>Hola ${buyerName},</h3>
          <p>Hemos recibido tu solicitud de garantía asociada a la factura <strong>${invoiceNumber}</strong>.</p>
          <p>Nuestro equipo revisará la información y te contactará en breve.</p>
          <p>Gracias por confiar en Escapes y Más.</p>
        `
      });

      return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

    } catch (error: any) {
      console.error('Error enviando correo:', error);
      return res.status(500).json({ success: false, message: 'Error al enviar el correo: ' + error.message });
    }
  } catch (err: any) {
    console.error('[WARRANTY] Outer error:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ================================================================
// WP PROXY — ELIMINADO (WordPress fue desinstalado, endpoint removido)
// ================================================================
// El endpoint /wp-json/* fue eliminado. Todas las peticiones deben usar /api/*

// ================================================================
// UTILIDADES
// ================================================================
function mapProductToFrontend(row: any) {
  const priceEur = (row.price || 0) / 100;
  const salePriceEur = row.sale_price ? row.sale_price / 100 : null;
  let images: any[] = [];
  try { images = row.images ? JSON.parse(row.images) : []; } catch { }
  images = (Array.isArray(images) ? images : []).map((img: any) => {
    if (typeof img === 'string') return { src: img, alt: row.name };
    if (img.srcSet && typeof img.srcSet === 'object') {
      return {
        src: img.src,
        srcMobile: img.srcSet.mobile || img.srcSet['mobile'],
        srcCardDesktop: img.srcSet['card-desktop'] || img.srcSet.cardDesktop,
        srcCardMobile: img.srcSet['card-mobile'] || img.srcSet.cardMobile,
        alt: img.alt || row.name
      };
    }
    return img;
  });
  let compatibility: any[] = [];
  try { compatibility = row.compatibility ? JSON.parse(row.compatibility) : []; } catch { }

  const categoryMap: Record<number, { name: string; slug: string }> = {
    1: { name: "Sistemas de Escape", slug: "escapes" },
    2: { name: "Frenos de Competición", slug: "frenos" },
    3: { name: "Parte ciclo & Chasis", slug: "suspensiones" },
    4: { name: "Electrónica & ECU", slug: "electronica" },
    5: { name: "Transmisión & Desarrollo", slug: "transmision" },
    6: { name: "Mantenimiento & Fluidos", slug: "mantenimiento" },
    7: { name: "Neumáticos & Paddock", slug: "neumaticos" },
    8: { name: "Cascos", slug: "cascos" },
    9: { name: "Equipación Piloto", slug: "equipacion" },
    10: { name: "Accesorios & Maletas", slug: "accesorios" },

    101: { name: "Línea Completa (Racing)", slug: "linea-completa" },
    102: { name: "Slip-On (Silenciosos)", slug: "silenciadores" },
    103: { name: "Colectores", slug: "colectores" },
    104: { name: "Accesorios Escape", slug: "accesorios-escape" },

    201: { name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas" },
    202: { name: "Discos de Freno", slug: "discos-freno" },
    203: { name: "Bombas Radiales", slug: "bombas-radiales" },
    204: { name: "Latiguillos Metálicos", slug: "latiguillos-metalicos" },

    301: { name: "Amortiguadores Traseros", slug: "amortiguadores-traseros" },
    302: { name: "Cartuchos Horquilla", slug: "cartuchos-horquilla" },
    303: { name: "Amortiguadores Dirección", slug: "amortiguadores-direccion" },
    304: { name: "Estriberas", slug: "estriberas" },

    401: { name: "Centralitas (ECU)", slug: "centralitas" },
    402: { name: "Quickshifters", slug: "quickshifters" },
    403: { name: "Módulos ABS/TC", slug: "modulos-abs-tc" },
    404: { name: "Baterías Litio", slug: "baterias-litio" },

    501: { name: "Kits Cadena Completos", slug: "kits-cadena" },
    502: { name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre" },
    503: { name: "Piñones", slug: "pinones" },
    504: { name: "Coronas Ergal", slug: "coronas" },

    601: { name: "Filtros Aire Racing", slug: "filtros-aire" },
    602: { name: "Filtros Aceite", slug: "filtros-aceite" },
    603: { name: "Aceites Motor Pro", slug: "aceites-motor" },
    604: { name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos" },

    701: { name: "Neumáticos Slick/Sport", slug: "neumaticos-slick" },
    702: { name: "Calentadores", slug: "calentadores" },
    703: { name: "Caballetes", slug: "caballetes" },
    704: { name: "Manómetros & Accesorios", slug: "manometros-accesorios" },

    801: { name: "Cascos Integrales", slug: "cascos-integrales" },
    802: { name: "Cascos Modulares", slug: "cascos-modulares" },
    803: { name: "Cascos Jet", slug: "cascos-jet" },
    804: { name: "Cascos Off-Road", slug: "cascos-off-road" },

    901: { name: "Chaquetas Moto", slug: "chaquetas-moto" },
    902: { name: "Monos", slug: "monos" },
    903: { name: "Guantes de Competición", slug: "guantes-competicion" },
    904: { name: "Botas Racing", slug: "botas-racing" },

    1001: { name: "Maletas & Baúles", slug: "maletas-baules" },
    1002: { name: "Soportes Quad Lock", slug: "soportes-quad-lock" },
    1003: { name: "Intercomunicadores", slug: "intercomunicadores" },
    1004: { name: "Personalización & Espejos", slug: "personalizacion-espejos" }
  };
  const catInfo = categoryMap[row.category_id] || { name: "General", slug: "general" };

  const productImage = images[0]?.src || '';
  const hasLocalImage = productImage.includes('/uploads/optimized/') && !productImage.includes('placehold.co');
  const placeholderImg = `https://placehold.co/800x800/18181b/f97316?text=${encodeURIComponent(row.name?.substring(0, 20) || 'ESCAPES+Y+MAS')}`;
  const finalImage = productImage || placeholderImg;

  // Subcategorías
  const cat2Info = row.category2_id ? categoryMap[row.category2_id] : null;
  const cat3Info = row.category3_id ? categoryMap[row.category3_id] : null;

  return {
    id: row.id, title: row.name, name: row.name,
    slug: row.sku?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `product-${row.id}`,
    price: salePriceEur || priceEur, regularPrice: priceEur, salePrice: salePriceEur,
    sku: row.sku || '', image: finalImage, images: images.length ? images : [{ src: placeholderImg, alt: row.name }],
    inStock: (row.stock || 0) > 0, stock: row.stock || 0,
    category: catInfo.name, categorySlug: catInfo.slug, categoryId: row.category_id || 0,
    category2: row.category2 || '', category3: row.category3 || '',
    category2Id: row.category2_id || null, category3Id: row.category3_id || null,
    category2Name: cat2Info?.name || '', category2Slug: cat2Info?.slug || '',
    category3Name: cat3Info?.name || '', category3Slug: cat3Info?.slug || '',
    description: row.description || '',
    shortDescription: row.description ? row.description.substring(0, 150) + '...' : '',
    status: row.status, compatibility, attributes: [],
    brand: row.brand || '', barcode: row.barcode || '',
    supplierCode: row.supplier_code || '', oldPartNumber: row.old_part_number || '',
    weight_g: row.weight_g || null, length_mm: row.length_mm || null,
    width_mm: row.width_mm || null, height_mm: row.height_mm || null,
    volume_cm3: row.volume_cm3 || null,
    dropshipping: row.dropshipping || false, ondemand: row.ondemand || false,
    deliveryPlant: row.delivery_plant || '', commodityCode: row.commodity_code || '',
    averageRating: 0, ratingCount: 0, source: 'postgresql'
  };
}

// ================================================================
// CATEGORÍAS (público)
// ================================================================
app.get('/api/catalog/categories', (req, res) => {
  const categoryMap: Record<number, { name: string; slug: string }> = {
    1: { name: "Sistemas de Escape", slug: "escapes" },
    2: { name: "Frenos de Competición", slug: "frenos" },
    3: { name: "Parte ciclo & Chasis", slug: "suspensiones" },
    4: { name: "Electrónica & ECU", slug: "electronica" },
    5: { name: "Transmisión & Desarrollo", slug: "transmision" },
    6: { name: "Mantenimiento & Fluidos", slug: "mantenimiento" },
    7: { name: "Neumáticos & Paddock", slug: "neumaticos" },
    8: { name: "Cascos", slug: "cascos" },
    9: { name: "Equipación Piloto", slug: "equipacion" },
    10: { name: "Accesorios & Maletas", slug: "accesorios" },

    101: { name: "Línea Completa (Racing)", slug: "linea-completa" },
    102: { name: "Slip-On (Silenciosos)", slug: "silenciadores" },
    103: { name: "Colectores", slug: "colectores" },
    104: { name: "Accesorios Escape", slug: "accesorios-escape" },

    201: { name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas" },
    202: { name: "Discos de Freno", slug: "discos-freno" },
    203: { name: "Bombas Radiales", slug: "bombas-radiales" },
    204: { name: "Latiguillos Metálicos", slug: "latiguillos-metalicos" },

    301: { name: "Amortiguadores Traseros", slug: "amortiguadores-traseros" },
    302: { name: "Cartuchos Horquilla", slug: "cartuchos-horquilla" },
    303: { name: "Amortiguadores Dirección", slug: "amortiguadores-direccion" },
    304: { name: "Estriberas", slug: "estriberas" },

    401: { name: "Centralitas (ECU)", slug: "centralitas" },
    402: { name: "Quickshifters", slug: "quickshifters" },
    403: { name: "Módulos ABS/TC", slug: "modulos-abs-tc" },
    404: { name: "Baterías Litio", slug: "baterias-litio" },

    501: { name: "Kits Cadena Completos", slug: "kits-cadena" },
    502: { name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre" },
    503: { name: "Piñones", slug: "pinones" },
    504: { name: "Coronas Ergal", slug: "coronas" },

    601: { name: "Filtros Aire Racing", slug: "filtros-aire" },
    602: { name: "Filtros Aceite", slug: "filtros-aceite" },
    603: { name: "Aceites Motor Pro", slug: "aceites-motor" },
    604: { name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos" },

    701: { name: "Neumáticos Slick/Sport", slug: "neumaticos-slick" },
    702: { name: "Calentadores", slug: "calentadores" },
    703: { name: "Caballetes", slug: "caballetes" },
    704: { name: "Manómetros & Accesorios", slug: "manometros-accesorios" },

    801: { name: "Cascos Integrales", slug: "cascos-integrales" },
    802: { name: "Cascos Modulares", slug: "cascos-modulares" },
    803: { name: "Cascos Jet", slug: "cascos-jet" },
    804: { name: "Cascos Off-Road", slug: "cascos-off-road" },
    805: { name: "Recambios Cascos", slug: "recambios-cascos" },

    901: { name: "Chaquetas Moto", slug: "chaquetas-moto" },
    902: { name: "Monos", slug: "monos" },
    903: { name: "Guantes de Competición", slug: "guantes-competicion" },
    904: { name: "Botas Racing", slug: "botas-racing" },

    1001: { name: "Maletas & Baúles", slug: "maletas-baules" },
    1002: { name: "Soportes Quad Lock", slug: "soportes-quad-lock" },
    1003: { name: "Intercomunicadores", slug: "intercomunicadores" },
    1004: { name: "Personalización & Espejos", slug: "personalizacion-espejos" },
    1005: { name: "Promocional", slug: "promocional" }
  };

  const subcategories = Object.entries(categoryMap)
    .filter(([id]) => parseInt(id) >= 100)
    .map(([id, cat]) => {
      const catId = parseInt(id);
      const parentId = Math.floor(catId / 100);
      const parent = categoryMap[parentId];
      return {
        id: catId,
        name: cat.name,
        slug: cat.slug,
        parentId,
        parentName: parent?.name || '',
        parentSlug: parent?.slug || ''
      };
    });

  res.json(subcategories);
});

// ================================================================
// DROPSHIPPING STATUS & TRACKING DAEMON
// ================================================================

async function sendShipmentNotificationEmail(orderId: number, email: string, firstName: string, trackingNumber: string, trackingUrl: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.buzondecorreo.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || "web@backendescapes.com",
        pass: process.env.SMTP_PASSWORD || "Pedrito2011P!"
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const clientName = firstName || 'Motero';
    const trackLink = trackingUrl || `https://www.google.com/search?q=tracking+${trackingNumber}`;

    const mailOptions = {
      from: '"Escapes y Más" <web@backendescapes.com>',
      to: email,
      subject: `🏍️ ¡Tu pedido #${orderId} ha sido enviado!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff5722; font-style: italic; text-transform: uppercase;">Escapes y Más</h1>
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Confirmación de Envío</p>
          </div>
          <p>Hola <strong>${clientName}</strong>,</p>
          <p>¡Buenas noticias! Tu pedido de escapes y recambios <strong>#${orderId}</strong> ha sido empaquetado y enviado a través de nuestro distribuidor (Bihr).</p>
          
          <div style="background-color: #111; border: 1px solid #222; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Número de Seguimiento (Tracking)</p>
            <div style="font-size: 20px; font-weight: bold; color: #ff5722; font-family: monospace; letter-spacing: 1px;">${trackingNumber}</div>
            <a href="${trackLink}" target="_blank" style="display: inline-block; margin-top: 15px; background-color: #ff5722; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 12px;">Seguir mi Envío</a>
          </div>

          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
            Si tienes alguna duda con tu pedido, responde directamente a este correo.<br/>
            ¡Gasss! 🏍️💨
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SHIPMENT EMAIL]: Sent shipment email to ${email} for order #${orderId}`);
  } catch (error) {
    console.error(`[SHIPMENT EMAIL ERROR] Failed to send email to ${email}:`, error);
  }
}

async function checkPendingDropshippingOrders() {
  try {
    const { getBihrOrderStatus } = await import('./bihrService.js');
    const pendingOrdersRes = await db.execute(sql`
      SELECT id, bihr_ticket_id, tracking_number, shipping_data FROM orders
      WHERE dropshipping_status = 'pending_bihr' AND bihr_ticket_id IS NOT NULL AND bihr_ticket_id <> ''
    `);

    for (const row of pendingOrdersRes.rows) {
      const order = row as any;
      try {
        const statusData = await getBihrOrderStatus(order.bihr_ticket_id);
        const bihrStatus = (statusData.status || statusData.Status || '').toLowerCase();
        
        let dropshippingStatus = 'pending_bihr';
        if (bihrStatus === 'shipped') {
          dropshippingStatus = 'shipped';
        } else if (bihrStatus === 'cancelled' || bihrStatus === 'canceled') {
          dropshippingStatus = 'cancelled';
        }

        const trackingNumber = statusData.trackingNumber || statusData.TrackingNumber || order.tracking_number || null;
        const trackingUrl = statusData.trackingUrl || statusData.TrackingUrl || null;

        await db.execute(sql`
          UPDATE orders
          SET dropshipping_status = ${dropshippingStatus},
              tracking_number = ${trackingNumber},
              tracking_url = ${trackingUrl},
              status = CASE WHEN ${dropshippingStatus} = 'shipped' THEN 'completed' ELSE status END
          WHERE id = ${order.id}
        `);

        // Enviar correo si acaba de pasar a enviado
        if (dropshippingStatus === 'shipped' && trackingNumber && trackingNumber !== order.tracking_number) {
          const shippingData = order.shipping_data ? JSON.parse(order.shipping_data as string) : {};
          const clientEmail = shippingData.email;
          const clientName = shippingData.firstName;
          if (clientEmail) {
            await sendShipmentNotificationEmail(order.id, clientEmail, clientName, trackingNumber, trackingUrl || '');
          }
        }
      } catch (err) {
        console.error(`[DROPSHIPPING CRON]: Error checking order #${order.id}:`, err);
      }
    }
  } catch (error) {
    console.error('[DROPSHIPPING CRON]: Error running periodic dropshipping status update:', error);
  }
}

// Daemon de Tracking (cada 15 minutos)
setInterval(() => {
  checkPendingDropshippingOrders().catch(e => console.error('[DROPSHIPPING DAEMON INTERVAL ERROR]:', e));
}, 15 * 60 * 1000);

// Ejecución al iniciar
checkPendingDropshippingOrders().catch(e => console.error('[DROPSHIPPING DAEMON INITIAL RUN ERROR]:', e));

// ================================================================
// ARRANQUE
// ================================================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  🏍️  ESCAPES Y MÁS — Backend API v1.0              ║
║  📡  Puerto: ${PORT}                                    ║
║  🗄️  DB: PostgreSQL (localhost)                      ║
║  🌐  WordPress proxy: ${WP_URL}        ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
