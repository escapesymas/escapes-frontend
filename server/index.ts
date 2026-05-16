import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq, desc, and } from 'drizzle-orm';
import {
  pgTable, serial, text, varchar, timestamp, integer
} from 'drizzle-orm/pg-core';

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

// Esquema inline (replica de lib/schema.ts)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  wpId: integer('wp_id').unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
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

// ================================================================
// EXPRESS APP
// ================================================================
const app = express();

app.use(cors({
  origin: ['https://escapesymas.com', 'https://www.escapesymas.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ================================================================
// HEALTH CHECK
// ================================================================
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', db: 'postgresql', timestamp: new Date().toISOString() });
});

// ================================================================
// CATÁLOGO PÚBLICO (sin autenticación)
// ================================================================
app.get('/api/catalog/products', async (req, res) => {
  try {
    const { search, page = '1', per_page = '20' } = req.query as any;
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const offset = (pageNum - 1) * perPage;

    let countQuery = `SELECT count(*) as total FROM products WHERE status = 'published'`;
    let selectQuery = `SELECT * FROM products WHERE status = 'published'`;

    if (search) {
      const s = search.replace(/'/g, "''");
      const clause = ` AND (LOWER(name) LIKE LOWER('%${s}%') OR LOWER(sku) LIKE LOWER('%${s}%') OR LOWER(description) LIKE LOWER('%${s}%'))`;
      countQuery += clause;
      selectQuery += clause;
    }

    selectQuery += ` ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`;

    const countRes = await db.execute(sql.raw(countQuery));
    const total = Number(countRes.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / perPage) || 1;

    const productsRes = await db.execute(sql.raw(selectQuery));
    const products = productsRes.rows.map(mapProductToFrontend);

    res.setHeader('X-WP-Total', total.toString());
    res.setHeader('X-WP-TotalPages', totalPages.toString());
    res.json(products);
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

  if (!isAdmin) return res.status(401).json({ error: 'No autorizado' });

  try {
    switch (action) {
      case 'dashboard-stats': {
        const uR = await db.execute(sql`SELECT count(*) as count FROM users`);
        const pR = await db.execute(sql`SELECT count(*) as count FROM forum_posts`);
        const oR = await db.execute(sql`SELECT count(*) as count FROM orders`);
        const sR = await db.execute(sql`SELECT COALESCE(SUM(total), 0) as total FROM orders`);
        return res.json({
          users: Number(uR.rows[0]?.count || 0),
          posts: Number(pR.rows[0]?.count || 0),
          orders: Number(oR.rows[0]?.count || 0),
          sales: Number(sR.rows[0]?.total || 0)
        });
      }

      case 'products-list': {
        const products = await db.execute(sql`SELECT * FROM products ORDER BY created_at DESC`);
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

        await db.execute(sql`
          INSERT INTO products (name, sku, price, sale_price, stock, description, images, compatibility, status)
          VALUES (${safeName}, ${safeSku}, ${priceInCents}, ${saleCents}, ${stock}, ${desc}, ${imgs}, ${compat}, ${status})
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
// AUTH (Login/Register)
// ================================================================
app.post('/api/auth', async (req, res) => {
  const { action } = req.query as any;
  const body = req.body;

  try {
    if (action === 'login' || action === 'social-login') {
      const isSocial = !!(body.provider && body.token);
      const wpUrl = isSocial
        ? `${WP_URL}/wp-json/escapes/v1/social-login`
        : `${WP_URL}/wp-json/jwt-auth/v1/token`;

      const wpRes = await fetch(wpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSocial ? { provider: body.provider, token: body.token } : { username: body.username, password: body.password })
      });

      const text = await wpRes.text();
      let wpData;
      try { wpData = JSON.parse(text); } catch { return res.status(500).json({ error: 'WP no devolvió JSON' }); }
      if (!wpRes.ok) return res.status(wpRes.status).json({ error: wpData.message || 'Login failed' });

      // Avatar
      if (wpData.user_email) {
        try {
          const creds = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
          const wooRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(wpData.user_email)}`, {
            headers: { 'Authorization': `Basic ${creds}` }
          });
          if (wooRes.ok) {
            const customers = await wooRes.json() as any[];
            if (customers?.[0]) {
              const c = customers[0];
              const customAvatar = c.meta_data?.find((m: any) => m.key === '_custom_avatar');
              wpData.avatarUrl = customAvatar?.value || c.avatar_url || '';
            }
          }
        } catch (e) { console.warn('[AUTH] Avatar fetch failed'); }
      }

      // Sync PostgreSQL
      if (wpData.user_email) {
        try {
          const email = wpData.user_email;
          const role = email.toLowerCase() === 'info@escapesymas.com' ? 'admin' : 'customer';
          const username = wpData.user_nicename || email.split('@')[0];

          await db.execute(sql`
            INSERT INTO users (wp_id, username, email, first_name, avatar_url, role)
            VALUES (${wpData.user_id || 0}, ${username}, ${email}, ${wpData.user_display_name || username}, ${wpData.avatarUrl || ''}, ${role})
            ON CONFLICT (email) DO UPDATE SET role = ${role}, updated_at = NOW()
          `);
          wpData.role = role;
        } catch (dbErr: any) {
          console.error('[DB] Sync failed:', dbErr.message);
        }
      }

      return res.json(wpData);

    } else if (action === 'register') {
      const { username, email, password } = body;
      if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

      const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
      const wcRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, first_name: username, billing: { email } })
      });
      const wcData = await wcRes.json();
      if (!wcRes.ok) return res.status(wcRes.status).json({ error: (wcData as any).message || 'Registration failed' });

      // Auto-login
      const loginRes = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginData = await loginRes.json();
      return res.json(loginRes.ok ? loginData : { token: '', user_email: email, user_display_name: username, warning: 'Please log in manually' });
    }

    res.status(400).json({ error: 'Invalid action' });
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
      case 'categories':
        return res.json([
          { id: 1, title: '🔧 Mecánica y Taller', description: 'Consultas técnicas, bricos y mantenimiento.' },
          { id: 2, title: '🏍️ Compra-Venta', description: 'Mercadillo entre moteros.' },
          { id: 3, title: '🗺️ Rutas y Quedadas', description: 'Planea tu próxima salida.' },
          { id: 4, title: '🏁 General Paddock', description: 'Charlas generales sobre el mundo de las dos ruedas.' }
        ]);

      case 'threads': {
        const threads = await db.select({
          id: forumPosts.id, title: forumPosts.title, createdAt: forumPosts.createdAt,
          likes: forumPosts.likes, authorName: users.username, authorAvatar: users.avatarUrl
        }).from(forumPosts).leftJoin(users, eq(forumPosts.userId, users.id))
          .where(category_id ? eq(forumPosts.category, category_id) : undefined)
          .orderBy(desc(forumPosts.createdAt));
        return res.json({ data: threads });
      }

      case 'thread-detail': {
        if (!thread_id) return res.status(400).json({ error: 'Falta thread_id' });
        const thread = await db.select().from(forumPosts).where(eq(forumPosts.id, parseInt(thread_id))).limit(1);
        const replies = await db.select({
          id: forumReplies.id, content: forumReplies.content, createdAt: forumReplies.createdAt,
          authorName: users.username, authorAvatar: users.avatarUrl, authorXP: users.rankXp
        }).from(forumReplies).leftJoin(users, eq(forumReplies.userId, users.id))
          .where(eq(forumReplies.postId, parseInt(thread_id))).orderBy(forumReplies.createdAt);
        return res.json({ thread: thread[0], replies: replies.map(r => ({ ...r, authorRank: calcRank(r.authorXP || 0) })) });
      }

      case 'create-thread': {
        if (req.method !== 'POST') return res.status(405).end();
        const { title, content, userId, category } = req.body;
        const [newPost] = await db.insert(forumPosts).values({ userId, title, content, category: category || 'general' }).returning();
        await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.POST}` }).where(eq(users.id, userId));
        return res.json({ success: true, id: newPost.id });
      }

      case 'reply': {
        if (req.method !== 'POST') return res.status(405).end();
        const { postId, replyUserId, replyContent } = req.body;
        await db.insert(forumReplies).values({ postId, userId: replyUserId, content: replyContent });
        await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.REPLY}` }).where(eq(users.id, replyUserId));
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
          return res.json({ success: true, liked: false });
        } else {
          await db.insert(forumLikes).values({ userId: currentUserId, contentType: targetType, contentId: targetId });
          if (targetType === 'post') await db.update(forumPosts).set({ likes: sql`${forumPosts.likes} + 1` }).where(eq(forumPosts.id, targetId));
          await db.update(users).set({ rankXp: sql`${users.rankXp} + ${XP.GIVE_LIKE}` }).where(eq(users.id, currentUserId));
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
// WP PROXY (para WooCommerce legacy)
// ================================================================
app.all('/wp-json/*', async (req, res) => {
  try {
    const targetUrl = `${WP_URL}${req.originalUrl}`;
    const headers: any = { 'Content-Type': 'application/json' };

    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    else {
      const auth = Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const wpRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['POST', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined
    });

    const data = await wpRes.json();
    
    // Forward WP pagination headers
    const wpTotal = wpRes.headers.get('x-wp-total');
    const wpPages = wpRes.headers.get('x-wp-totalpages');
    if (wpTotal) res.setHeader('X-WP-Total', wpTotal);
    if (wpPages) res.setHeader('X-WP-TotalPages', wpPages);

    res.status(wpRes.status).json(data);
  } catch (err: any) {
    console.error('[WP PROXY ERROR]:', err);
    res.status(502).json({ error: 'WordPress no disponible', detail: err.message });
  }
});

// ================================================================
// UTILIDADES
// ================================================================
function mapProductToFrontend(row: any) {
  const priceEur = (row.price || 0) / 100;
  const salePriceEur = row.sale_price ? row.sale_price / 100 : null;
  let images: any[] = [];
  try { images = row.images ? JSON.parse(row.images) : []; } catch { }
  images = (Array.isArray(images) ? images : []).map((img: any) =>
    typeof img === 'string' ? { src: img, alt: row.name } : img
  );
  let compatibility: any[] = [];
  try { compatibility = row.compatibility ? JSON.parse(row.compatibility) : []; } catch { }

  return {
    id: row.id, title: row.name, name: row.name,
    slug: row.sku?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `product-${row.id}`,
    price: salePriceEur || priceEur, regularPrice: priceEur, salePrice: salePriceEur,
    sku: row.sku || '', image: images[0]?.src || '', images,
    inStock: (row.stock || 0) > 0, stock: row.stock || 0,
    category: 'General', categorySlug: 'general', categoryId: row.category_id || 0,
    description: row.description || '',
    shortDescription: row.description ? row.description.substring(0, 150) + '...' : '',
    status: row.status, compatibility, attributes: [],
    averageRating: 0, ratingCount: 0, source: 'postgresql'
  };
}

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
