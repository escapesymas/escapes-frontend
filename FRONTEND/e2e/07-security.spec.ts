import { test, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE || 'https://backendescapes.com/api';

test.describe('Security / fraude bloqueado', () => {
  test('POST /orders/finalize sin paymentId es rechazado', async ({ request }) => {
    const r = await request.post(`${API_BASE}/orders/finalize`, {
      data: { orderId: 1, status: 'processing' },
    });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.error).toMatch(/paymentId/i);
  });

  test('POST /orders/finalize con paymentId falso es rechazado', async ({ request }) => {
    const r = await request.post(`${API_BASE}/orders/finalize`, {
      data: { orderId: 1, paymentId: 'pi_fake_invalid_123', status: 'processing' },
    });
    expect(r.status()).toBeGreaterThanOrEqual(400);
    expect(r.status()).toBeLessThan(500);
  });

  test('GET /orders/my-orders sin userEmail devuelve 400', async ({ request }) => {
    const r = await request.get(`${API_BASE}/orders/my-orders`);
    expect(r.status()).toBe(400);
  });

  test('POST /auth/register con email admin hardcodeado crea role=customer', async ({ request }) => {
    const r = await request.post(`${API_BASE}/auth?action=register`, {
      data: {
        username: `e2e_admin_check_${Date.now()}`,
        email: `e2e-admin-${Date.now()}@escapesymas.com`,
        password: 'Test12345!',
        firstName: 'Test',
      },
    });
    expect([200, 201, 400, 409]).toContain(r.status());
    if (r.status() === 200 || r.status() === 201) {
      const body = await r.json();
      expect(body.role).toBe('customer');
    }
  });

  test('POST /stripe/webhook sin signature es rechazado', async ({ request }) => {
    const r = await request.post(`${API_BASE}/stripe/webhook`, {
      data: { type: 'payment_intent.succeeded' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(r.status()).toBe(400);
  });

  test('CORS bloquea origen no permitido', async ({ request }) => {
    const r = await request.get(`${API_BASE}/health`, {
      headers: { Origin: 'https://evil-attacker.com' },
    });
    const allowOrigin = r.headers()['access-control-allow-origin'];
    expect(allowOrigin === undefined || !allowOrigin.includes('evil-attacker.com')).toBe(true);
  });
});
