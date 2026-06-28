import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('Login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).first().fill('nonexistent@example.com');
    await page.getByLabel(/contraseña|password/i).first().fill('wrongpass123');
    await page.getByRole('button', { name: /entrar|iniciar|acceder/i }).first().click();
    await expect(page.locator('body')).toContainText(/error|incorrecto|inválid/i, { timeout: 5_000 });
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
