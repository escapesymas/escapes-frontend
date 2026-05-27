import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
});

export default pool;
