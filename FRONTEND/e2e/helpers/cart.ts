import type { Page } from '@playwright/test';

export async function clearCart(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('tg_cart_token');
      if (raw) localStorage.removeItem('tg_cart_token');
      const user = localStorage.getItem('tg_user');
      if (user) {
        const u = JSON.parse(user);
        if (u && u.cart) u.cart = {};
        localStorage.setItem('tg_user', JSON.stringify(u));
      }
    } catch {}
  });
}

export async function getCartCount(page: Page): Promise<number> {
  const txt = await page.locator('[data-testid="cart-count"], .cart-count, [aria-label*="carrito" i] span').first().textContent().catch(() => '0');
  return parseInt(txt?.trim() || '0', 10);
}
