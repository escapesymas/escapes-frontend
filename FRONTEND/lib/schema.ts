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
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
