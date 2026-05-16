import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

// Configuración de la conexión a PostgreSQL (VPS)
// DATABASE_URL debe estar configurada en Vercel o en el archivo .env
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
export { schema };
