import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

const UUID_REGEX = /^[0-9a-f-]{36}$/i;

function getDb(): Pool | null {
  const url = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) return null;
  return new Pool({ connectionString: url, max: 2 });
}

const dbAvailable = !!getDb();

test.describe('Carrito abandonado', () => {
  let db: Pool | null;

  test.beforeAll(() => { db = getDb(); });
  test.afterAll(async () => { if (db) await db.end(); });

  test('POST /api/cart con email + items crea snapshot en BD', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `abandoned-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-abandoned-${Date.now()}`;

    const cartRes = await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [
          { id: 999001, sku: 'E2E-ABN-001', name: 'Producto Abandonado Test', slug: 'producto-abandonado-test', price: 4999, quantity: 2 },
        ],
      },
    });
    expect(cartRes.ok()).toBeTruthy();

    const r = await db.query(
      'SELECT user_email, cart_snapshot, cart_total_cents, recovered_at FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(r.rows.length).toBe(1);
    expect(r.rows[0].recovered_at).toBeNull();
    expect(parseInt(r.rows[0].cart_total_cents)).toBe(9998);

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });

  test('POST /api/cart con múltiples items calcula total correcto', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `abandoned-multi-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-abandoned-multi-${Date.now()}`;

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [
          { id: 999002, sku: 'A', name: 'A', slug: 'a', price: 1000, quantity: 3 },
          { id: 999003, sku: 'B', name: 'B', slug: 'b', price: 2500, quantity: 1 },
        ],
      },
    });

    const r = await db.query(
      'SELECT cart_total_cents FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(r.rows.length).toBe(1);
    expect(parseInt(r.rows[0].cart_total_cents)).toBe(5500);

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });

  test('POST /api/cart sin email NO crea snapshot', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const sessionToken = `e2e-no-email-${Date.now()}`;
    const cartRes = await request.post('/api/cart', {
      data: {
        sessionToken,
        items: [{ id: 999004, sku: 'NO-EMAIL', name: 'X', slug: 'x', price: 100, quantity: 1 }],
      },
    });
    expect(cartRes.ok()).toBeTruthy();

    const r = await db.query(
      "SELECT COUNT(*)::int AS c FROM cart_abandoned_emails WHERE user_email = '' OR user_email IS NULL"
    );
    expect(r.rows[0].c).toBe(0);
  });

  test('GET /api/cart/recover/:token con token inválido devuelve 400', async ({ request }) => {
    const res = await request.get('/api/cart/recover/not-a-uuid');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Token inválido/);
  });

  test('GET /api/cart/recover/:token con UUID inexistente devuelve 404', async ({ request }) => {
    const fake = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`/api/cart/recover/${fake}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/Carrito no encontrado/);
  });

  test('GET /api/cart/recover/:token devuelve snapshot cuando existe', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `recover-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-recover-${Date.now()}`;

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [{ id: 999005, sku: 'REC-1', name: 'Recuperable', slug: 'recuperable', price: 7500, quantity: 1 }],
      },
    });

    const r = await db.query(
      'SELECT recovery_token FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(r.rows.length).toBe(1);
    const token = r.rows[0].recovery_token;
    expect(token).toMatch(UUID_REGEX);

    const res = await request.get(`/api/cart/recover/${token}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.email).toBe(testEmail);
    expect(body.cart).toBeInstanceOf(Array);
    expect(body.cart.length).toBe(1);
    expect(body.cart[0].sku).toBe('REC-1');
    expect(body.already_recovered).toBe(false);
    expect(parseInt(body.total_cents)).toBe(7500);

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });

  test('POST /api/cart/recover/:token marca recovered_at', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `mark-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-mark-${Date.now()}`;

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [{ id: 999006, sku: 'MARK-1', name: 'Mark', slug: 'mark', price: 1000, quantity: 1 }],
      },
    });

    const r = await db.query(
      'SELECT recovery_token FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    const token = r.rows[0].recovery_token;

    const res = await request.post(`/api/cart/recover/${token}`);
    expect(res.ok()).toBeTruthy();

    const after = await db.query(
      'SELECT recovered_at FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(after.rows[0].recovered_at).not.toBeNull();

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });

  test('Re-add del mismo email resetea emails_sent a 0', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `reset-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-reset-${Date.now()}`;

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [{ id: 999007, sku: 'RST-1', name: 'Reset', slug: 'reset', price: 1000, quantity: 1 }],
      },
    });

    await db.query(
      'UPDATE cart_abandoned_emails SET emails_sent = 2, last_emailed_at = NOW() WHERE user_email = $1',
      [testEmail]
    );

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [{ id: 999008, sku: 'RST-2', name: 'Reset 2', slug: 'reset-2', price: 2000, quantity: 1 }],
      },
    });

    const after = await db.query(
      'SELECT emails_sent, last_emailed_at FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(after.rows[0].emails_sent).toBe(0);
    expect(after.rows[0].last_emailed_at).toBeNull();

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });

  test('GET /api/cart/recover/:token sobre cart ya recuperado resetea recovered_at', async ({ request }) => {
    test.skip(!dbAvailable, 'Requiere acceso a BD (E2E_DATABASE_URL) — solo en CI');
    const testEmail = `recover-reset-${Date.now()}@e2e-test.com`;
    const sessionToken = `e2e-rreset-${Date.now()}`;

    await request.post('/api/cart', {
      data: {
        sessionToken,
        userEmail: testEmail,
        items: [{ id: 999009, sku: 'RST-3', name: 'Reopen', slug: 'reopen', price: 999, quantity: 1 }],
      },
    });

    const r = await db.query(
      'SELECT recovery_token FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    const token = r.rows[0].recovery_token;

    await request.post(`/api/cart/recover/${token}`);

    const reopenRes = await request.get(`/api/cart/recover/${token}`);
    expect(reopenRes.ok()).toBeTruthy();
    const body = await reopenRes.json();
    expect(body.already_recovered).toBe(true);

    const after = await db.query(
      'SELECT recovered_at, emails_sent FROM cart_abandoned_emails WHERE user_email = $1',
      [testEmail]
    );
    expect(after.rows[0].recovered_at).toBeNull();
    expect(after.rows[0].emails_sent).toBe(0);

    await db.query('DELETE FROM cart_abandoned_emails WHERE user_email = $1', [testEmail]);
  });
});