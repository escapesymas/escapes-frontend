import { test, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE || 'https://backendescapes.com/api';

test.describe('Stock checks', () => {
  test('GET /catalog/stock-check con IDs devuelve disponibilidad', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/stock-check?ids=56996,213855`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.checks).toBeDefined();
    expect(Array.isArray(body.checks)).toBe(true);
  });

  test('GET /catalog/stock-check sin IDs devuelve array vacío', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/stock-check`);
    expect(r.status()).toBe(400);
  });

  test('POST /orders/create con stock insuficiente devuelve 409', async ({ request }) => {
    const r = await request.post(`${API_BASE}/orders/create`, {
      data: {
        userEmail: 'test@example.com',
        cart: [{ id: 56996, quantity: 9999999 }],
        shippingData: {
          firstName: 'Test', lastName: 'User', address1: 'Calle 1', city: 'Madrid', postcode: '28001', phone: '600123456', email: 'test@example.com', nif: '12345678Z',
        },
        paymentMethod: 'stripe',
      },
    });
    expect(r.status()).toBe(409);
    const body = await r.json();
    expect(body.error).toMatch(/stock/i);
    expect(Array.isArray(body.stockErrors)).toBe(true);
  });
});
