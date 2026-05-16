import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL no está configurada. Las funciones de PostgreSQL estarán desactivadas.");
}

// Configuración de la conexión a PostgreSQL (VPS)
const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
export { schema };
