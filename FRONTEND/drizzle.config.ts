import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:EscapesPostgres2026!@212.227.134.161:5432/escapes_db',
  },
});
