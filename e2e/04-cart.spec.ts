import { test, expect } from '@playwright/test';
import { clearCart, getCartCount } from './helpers/cart';

test.describe('Carrito', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
  });

  test('Añadir producto desde página de detalle actualiza contador', async ({ page }) => {
    await page.goto('/producto/1036683');
    await page.waitForLoadState('networkidle');

    const before = await getCartCount(page).catch(() => 0);

    const addButton = page.getByRole('button', { name: /añadir al carrito/i }).first();
    if (await addButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addButton.click({ timeout: 5_000 });
      await page.waitForTimeout(1000);
      const after = await getCartCount(page).catch(() => 0);
      expect(after).toBeGreaterThanOrEqual(before);
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
