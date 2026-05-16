import { pgTable, serial, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

// Tabla de Usuarios (Sincronizada con WP o independiente en el futuro)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  wpId: integer('wp_id').unique(), // ID de WordPress para migración
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  rankLevel: integer('rank_level').default(1),
  rankXp: integer('rank_xp').default(0),
  role: varchar('role', { length: 20 }).default('customer'), // customer, admin, moderator
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla del Garaje (Relación 1:N con usuarios)
export const garage = pgTable('garage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: varchar('year', { length: 20 }).notNull(),
  isPrimary: integer('is_primary').default(0), // 1 si es la moto principal
  createdAt: timestamp('created_at').defaultNow(),
});

// Tablas para el Foro (Paddock) - Fase 5
export const forumPosts = pgTable('forum_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('general'),
  likes: integer('likes').default(0), // Mantenemos el nombre original para evitar preguntas de rename
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const forumReplies = pgTable('forum_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumLikes = pgTable('forum_likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(), // 'post' o 'reply'
  contentId: integer('content_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- SISTEMA E-COMMERCE MAESTRO (ADMIN) ---

// Tabla de Productos (Nativa para sustituir a WP)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  providerId: varchar('provider_id', { length: 100 }), // ID del CSV/API del proveedor
  sku: varchar('sku', { length: 100 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // En céntimos para evitar decimales
  salePrice: integer('sale_price'),
  stock: integer('stock').default(0),
  images: text('images'), // JSON array de URLs
  compatibility: text('compatibility'), // JSON con marcas/modelos/años
  categoryId: integer('category_id'),
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, out_of_stock
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla de Pedidos
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  total: integer('total').notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // pending, paid, shipped, cancelled
  paymentId: varchar('payment_id', { length: 255 }),
  shippingData: text('shipping_data'), // JSON con dirección, tlf, etc.
  createdAt: timestamp('created_at').defaultNow(),
});

// Líneas de Pedido
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
});
