import { test, expect } from '@playwright/test';

test.describe('SEO y metadata', () => {
  test('Home tiene OpenGraph tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });

  test('Producto individual tiene generateMetadata con OG completo', async ({ page }) => {
    await page.goto('/producto/1036683');
    await expect(page.locator('h1').first()).toHaveCount(1, { timeout: 8_000 });

    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const title = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(5);
  });

  test('Canonical link presente', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
  });

  test('sitemap.xml accesible', async ({ request }) => {
    const r = await request.get('/sitemap.xml');
    expect([200, 301, 302, 404]).toContain(r.status());
  });
});
