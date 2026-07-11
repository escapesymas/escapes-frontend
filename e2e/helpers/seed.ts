import { Pool } from 'pg';

const SEED_USER = {
  email: 'e2e-test@escapesymas.com',
  username: 'e2e_test_user',
  first_name: 'E2E',
  last_name: 'Tester',
  password: 'E2ETestPass123!',
};

const SEED_PRODUCTS = [
  {
    sku: 'E2E-001',
    name: 'Filtro de aire E2E Test',
    brand: 'E2E Brand',
    price: 1999,
    stock: 50,
    status: 'published',
  },
  {
    sku: 'E2E-002',
    name: 'Pastillas de freno E2E Test',
    brand: 'E2E Brand',
    price: 4598,
    stock: 20,
    status: 'published',
  },
  {
    sku: 'E2E-003',
    name: 'Aceite motor E2E Test',
    brand: 'E2E Brand',
    price: 1199,
    stock: 100,
    status: 'published',
  },
  {
    sku: 'E2E-004',
    name: 'Casco E2E Test',
    brand: 'E2E Brand',
    price: 8999,
    stock: 5,
    status: 'published',
  },
  {
    sku: 'E2E-005',
    name: 'Escape E2E Test',
    brand: 'E2E Brand',
    price: 15999,
    stock: 0,
    status: 'published',
  },
];

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no configurada para E2E');
  pool = new Pool({ connectionString: url, max: 5 });
  return pool;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

export async function seedDatabase(): Promise<{ testUserEmail: string; testProducts: { id: number; sku: string }[] }> {
  const db = getPool();

  await db.query("DELETE FROM products WHERE sku LIKE 'E2E-%'");
  await db.query("DELETE FROM users WHERE email = $1", [SEED_USER.email]);

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash(SEED_USER.password, 10);

  const userResult = await db.query(
    `INSERT INTO users (username, email, first_name, last_name, password_hash, role, billing, garage, cart, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'customer', '{}', '[]', '{}', NOW(), NOW())
     RETURNING id, email`,
    [SEED_USER.username, SEED_USER.email, SEED_USER.first_name, SEED_USER.last_name, passwordHash]
  );

  const testProducts: { id: number; sku: string }[] = [];
  for (const p of SEED_PRODUCTS) {
    const r = await db.query(
      `INSERT INTO products (sku, name, brand, price, stock, status, images, attributes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb, '{}'::jsonb, NOW(), NOW())
       RETURNING id, sku`,
      [p.sku, p.name, p.brand, p.price, p.stock, p.status]
    );
    testProducts.push({ id: r.rows[0].id, sku: r.rows[0].sku });
  }

  return { testUserEmail: userResult.rows[0].email, testProducts };
}

export async function cleanupDatabase(): Promise<void> {
  const db = getPool();
  await db.query("DELETE FROM products WHERE sku LIKE 'E2E-%'");
  await db.query("DELETE FROM users WHERE email = $1", [SEED_USER.email]);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const SEED = {
  user: SEED_USER,
  products: SEED_PRODUCTS,
};
