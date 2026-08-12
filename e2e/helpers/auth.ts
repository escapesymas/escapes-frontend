import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'e2e-test@escapesymas.com',
  password: 'E2ETestPass123!',
};

export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email|correo/i).first().fill(TEST_USER.email);
  await page.getByLabel(/contraseña|password/i).first().fill(TEST_USER.password);
  await Promise.all([
    page.waitForURL(/\/(account|profile|paddock|mis-pedidos|catalogo|universales|$)/, { timeout: 10_000 }),
    page.getByRole('button', { name: /entrar|iniciar|acceder/i }).first().click(),
  ]);
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
  });
  await page.context().clearCookies();
  await page.goto('/');
}
