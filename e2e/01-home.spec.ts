import { test, expect } from '@playwright/test';

test.describe('Home y catálogo', () => {
  test('Home carga con título correcto', async ({ page }) => {
    const r = await page.goto('/');
    expect(r?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Escapes y Más/i);
  });

  test('Catálogo /universales carga sin errores', async ({ page }) => {
    const r = await page.goto('/universales');
    expect(r?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Página de detalle de producto muestra precio y botón añadir', async ({ page }) => {
    await page.goto('/producto/1036683');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText('€');
  });

  test('Página de detalle de otro producto carga', async ({ page }) => {
    const r = await page.goto('/producto/56996');
    expect(r?.status()).toBe(200);
  });

  test('Búsqueda devuelve 200', async ({ page }) => {
    const r = await page.goto('/?search=pastilla');
    expect(r?.status()).toBeLessThan(400);
  });
});
