import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT category_id, COUNT(*), MIN(name) as sample_name
      FROM products
      GROUP BY category_id
      ORDER BY category_id
    `);
    console.log("Category IDs in DB:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
