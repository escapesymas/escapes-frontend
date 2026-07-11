import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'e2e-test@escapesymas.com',
  password: 'E2ETestPass123!',
};

export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').first().fill(TEST_USER.email);
  await page.locator('input[type="password"]').first().fill(TEST_USER.password);
  await Promise.all([
    page.waitForURL(/\/(account|profile|paddock|mis-pedidos|catalogo|universales|$)/, { timeout: 10_000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
  });
  await page.context().clearCookies();
  await page.goto('/');
}
