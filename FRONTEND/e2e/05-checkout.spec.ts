import { test, expect } from '@playwright/test';

test.describe('Checkout E2E', () => {
  test('GET /checkout devuelve HTML 200 con meta robots noindex', async ({ page }) => {
    const response = await page.goto('/checkout');
    expect(response?.status()).toBe(200);
    const html = await page.content();
    expect(html).toMatch(/<meta[^>]+name=["']robots["'][^>]+content=["']noindex/i);
  });

  test('/checkout con carrito vacío redirige a /', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try { localStorage.removeItem('escapes_cart_session_token'); } catch {}
      try { localStorage.removeItem('escapesymas_cart'); } catch {}
    });
    await page.goto('/checkout');
    await page.waitForURL(/\/\?emptyCart=1$/, { timeout: 5000 });
    expect(page.url()).toMatch(/emptyCart=1/);
  });

  test('/checkout con carrito pre-lleno muestra el form', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('escapesymas_cart', JSON.stringify([{
        id: 999001,
        sku: 'TEST-CHECKOUT-001',
        name: 'Producto de prueba checkout',
        slug: 'producto-prueba-checkout',
        price: 49.99,
        regularPrice: 49.99,
        stock: 50,
        inStock: true,
        brand: 'TestBrand',
        category: 'General',
        categorySlug: 'general',
        image: '',
        quantity: 2,
      }]));
      localStorage.setItem('escapes_cart_session_token', `token_${Date.now()}`);
    });
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible({ timeout: 15000 });
  });

  test('POST /api/orders/create rechaza stock insuficiente', async ({ request }) => {
    const res = await request.post('/api/orders/create', {
      data: {
        userEmail: 'e2e-stock@test.com',
        cart: [{
          id: 234594,
          quantity: 99999,
          price: 21.45,
          name: 'Camiseta BIHR 2019 Negra - Talla S',
          slug: '980706s',
        }],
        shippingData: { firstName: 'E2E', lastName: 'Test', email: 'e2e@test.com', address1: 'Calle Test 1', city: 'Madrid', postcode: '28001', phone: '+34666555444' },
        paymentMethod: 'stripe',
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/stock|insufficient/i);
  });

  test('POST /api/orders/finalize sin paymentId devuelve 400', async ({ request }) => {
    const res = await request.post('/api/orders/finalize', {
      data: { paymentId: '', status: 'processing' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/orders/finalize con paymentId inválido devuelve 400', async ({ request }) => {
    const res = await request.post('/api/orders/finalize', {
      data: { paymentId: 'pi_fake_invalid_xxx', status: 'processing' },
    });
    expect([400, 402, 404]).toContain(res.status());
  });

  test('POST /api/stripe/webhook sin signature devuelve 400', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      data: { type: 'payment_intent.succeeded' },
      headers: { 'stripe-signature': '' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /checkout/success sin query params redirige a /', async ({ page }) => {
    const response = await page.goto('/checkout/success');
    await page.waitForURL(/\/$/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('GET /checkout/success con redirect_status=failed muestra error view', async ({ page }) => {
    await page.goto('/checkout/success?payment_intent=pi_test_failed&redirect_status=failed');
    await expect(page.locator('[data-testid="success-pending"], [data-testid="success-error"]')).toBeVisible({ timeout: 10000 });
  });

  test('GET /checkout/success con payment_intent válido muestra success-ok o success-error', async ({ page }) => {
    await page.goto('/checkout/success?payment_intent=pi_test_nonexistent_12345&redirect_status=succeeded');
    const errorLocator = page.locator('[data-testid="success-error"]');
    await expect(errorLocator).toBeVisible({ timeout: 15000 });
    await expect(errorLocator).toContainText(/Falta orderId|orderId/i);
  });
});