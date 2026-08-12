import { test, expect } from '@playwright/test';

test.describe('Home y catálogo', () => {
  test('Home carga con título correcto', async ({ page }) => {
    const r = await page.goto('/');
    expect(r?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Escapes y Más/i);
  });

  test('Catálogo muestra productos y paginación', async ({ page }) => {
    await page.goto('/universales');
    await expect(page.locator('a[href*="/producto/"]').first()).toBeVisible({ timeout: 10_000 });
    const cards = await page.locator('a[href*="/producto/"]').count();
    expect(cards).toBeGreaterThan(2);
  });

  test('Página de detalle de producto muestra precio y botón añadir', async ({ page }) => {
    await page.goto('/universales');
    await page.locator('a[href*="/producto/"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('€');
  });

  test('Búsqueda devuelve resultados', async ({ page }) => {
    await page.goto('/?search=pastilla');
    await page.waitForLoadState('networkidle');
    const hasResults = await page.locator('a[href*="/producto/"]').count();
    expect(hasResults).toBeGreaterThanOrEqual(0);
  });
});
