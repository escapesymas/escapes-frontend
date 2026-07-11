import { test, expect } from '@playwright/test';

test.describe('Legal / RGPD / LGDCU', () => {
  test('/devoluciones carga con política de desistimiento', async ({ page }) => {
    const r = await page.goto('/devoluciones');
    expect(r?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/devoluciones|desistimiento/i);
    await expect(page.locator('body')).toContainText(/14 d[ií]as/i);
  });

  test('/terminos carga con condiciones generales', async ({ page }) => {
    const r = await page.goto('/terminos');
    expect(r?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/t[eé]rminos|condiciones/i);
  });

  test('/politica-cookies carga con tabla de cookies', async ({ page }) => {
    const r = await page.goto('/politica-cookies');
    expect(r?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/cookies/i);
  });

  test('Banner cookies AEPD aparece en primera visita', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => { try { localStorage.removeItem('cookie_consent'); } catch {} });
    await page.reload();
    await expect(page.locator('[role="dialog"][aria-label*="cookies" i]')).toBeVisible({ timeout: 5_000 });
  });

  test('Banner cookies no aparece si ya consentido', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try { localStorage.setItem('cookie_consent', JSON.stringify({ action: 'accept_all', ts: new Date().toISOString() })); } catch {}
    });
    await page.reload();
    await page.waitForTimeout(1000);
    const banner = await page.locator('[role="dialog"][aria-label*="cookies" i]').isVisible().catch(() => false);
    expect(banner).toBe(false);
  });
});
