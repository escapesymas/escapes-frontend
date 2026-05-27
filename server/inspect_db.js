import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
});

async function main() {
  const client = await pool.connect();
  try {
    // Check tables
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    console.log("Tables found:", tablesRes.rows.map(r => r.table_name));

    // Get 5 products
    const productsRes = await client.query(`
      SELECT id, name, description, brand, category_id FROM products LIMIT 5
    `);
    console.log("\nProducts Sample:");
    for (const p of productsRes.rows) {
      console.log(`- ID: ${p.id}, Brand: ${p.brand}, Name: "${p.name}"`);
      console.log(`  Desc: "${p.description?.substring(0, 150)}..."`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
