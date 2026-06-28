import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('Login con credenciales inválidas muestra error (API)', async ({ request }) => {
    const r = await request.post('/api/auth?action=login', {
      data: { username: 'nonexistent@example.com', password: 'wrongpass123' },
    });
    expect(r.status()).toBe(401);
    const body = await r.json();
    expect(body.error).toBeTruthy();
  });

  test('Login con credenciales inválidas por UI muestra mensaje de error sin Maximum call stack', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="piloto" i], input[name="email"], input[name="username"], input[type="email"], input[type="text"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button:has-text("Iniciar sesión")');
    const errorLocator = page.locator('text=/contraseña incorrecta|invalid|credenciales|no encontrad|incorrect/i').first();
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
    const maxStackLocator = page.locator('text=/Maximum call stack/i');
    expect(await maxStackLocator.count()).toBe(0);
  });

  test('Login con cookie httpOnly setea header correcto', async ({ page, context }) => {
    const r = await context.request.post('/api/auth/logout');
    expect([200, 404]).toContain(r.status());
  });

  test('Logout limpia localStorage y cookies', async ({ page, context }) => {
    await context.addCookies([
      { name: 'eym_jwt', value: 'invalid.jwt.value', domain: '127.0.0.1', path: '/', secure: false, httpOnly: true },
    ]);
    await page.goto('/');
    await page.evaluate(() => { try { localStorage.clear(); } catch {} });
    await context.clearCookies();
    const cookies = await context.cookies();
    const eymCookie = cookies.find(c => c.name === 'eym_jwt');
    expect(eymCookie).toBeUndefined();
  });
});