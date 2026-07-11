import type { Page } from '@playwright/test';

export async function clearCart(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('escapes_cart_session_token');
      localStorage.removeItem('escapesymas_cart');
      sessionStorage.removeItem('begin_checkout_event_id');
      sessionStorage.removeItem('stripe_redirect_result');
    } catch {}
  });
}

export async function getCartCount(page: Page): Promise<number> {
  const txt = await page.locator('[data-testid="cart-count"], .cart-count, [aria-label*="carrito" i] span').first().textContent().catch(() => '0');
  return parseInt(txt?.trim() || '0', 10);
}

export async function seedCart(page: Page, items: Array<{ id: number; sku: string; name: string; price: number; quantity: number }>): Promise<void> {
  await page.evaluate((cartItems) => {
    localStorage.setItem('escapesymas_cart', JSON.stringify(cartItems));
    if (!localStorage.getItem('escapes_cart_session_token')) {
      const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `token_${Date.now()}`;
      localStorage.setItem('escapes_cart_session_token', `token_${uuid}`);
    }
  }, items);
}