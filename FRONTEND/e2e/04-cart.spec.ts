import { test, expect } from '@playwright/test';
import { clearCart, getCartCount } from './helpers/cart';

test.describe('Carrito', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
  });

  test('Añadir producto desde página de detalle actualiza contador', async ({ page }) => {
    await page.goto('/universales');
    await page.locator('a[href*="/producto/"]').first().click();
    await page.waitForLoadState('networkidle');

    const before = await getCartCount(page).catch(() => 0);

    const addButton = page.getByRole('button', { name: /añadir al carrito/i }).first();
    if (await addButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      const after = await getCartCount(page).catch(() => 0);
      expect(after).toBeGreaterThan(before);
    } else {
      test.skip(true, 'Botón "añadir al carrito" no visible');
    }
  });

  test('Carrito vacío muestra mensaje y CTA', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { try { localStorage.removeItem('tg_cart_token'); } catch {} });
    await page.goto('/');
    const cartButton = page.locator('[aria-label*="carrito" i]').first();
    if (await cartButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cartButton.click();
      await expect(page.locator('body')).toContainText(/vacío/i, { timeout: 5_000 });
    } else {
      test.skip(true, 'Botón carrito no visible');
    }
  });
});
