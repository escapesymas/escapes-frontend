import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db",
  ssl: false
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Añadiendo columnas de envíos y reembolsos a orders...');
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS carrier VARCHAR(50)
    `);

    console.log('Creando tabla order_notes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_notes (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        is_customer_note BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `);

    await client.query('COMMIT');
    console.log('Migración de Fase 3 completada con éxito.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en migración:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
