import { test, expect } from '@playwright/test';

test.describe('Landing Pages SEO de Escapes por Marca y Modelo de Moto', () => {
  test('Home y Footer exponen enlaces SSR rastreables hacia /escapes y modelos populares', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);

    await expect(page.locator('a[href="/escapes/yamaha/mt-07"]').first()).toBeVisible();
    await expect(page.locator('a[href="/escapes/kawasaki/z-900"]').first()).toBeVisible();
    await expect(page.locator('footer a[href="/escapes/yamaha"]')).toBeVisible();
    await expect(page.locator('footer a[href="/escapes"]')).toBeVisible();
  });

  test('/escapes carga directorio completo, JSON-LD, FAQs <details> y selector rápido', async ({ page }) => {
    const res = await page.goto('/escapes');
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/Escapes por Marca y Modelo de Moto/i);
    await expect(page.locator('h1')).toContainText(/Escapes y Recambios por Marca y Modelo de Moto/i);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/escapes$/);

    // JSON-LD: BreadcrumbList + ItemList + FAQPage
    const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ldScripts.flatMap((txt) => {
      try {
        const parsed = JSON.parse(txt);
        return [parsed['@type']];
      } catch {
        return [];
      }
    });
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('ItemList');
    expect(types).toContain('FAQPage');

    // FAQs con <details name="escapes-hub-faq"> nativo
    const faqDetails = page.locator('details[name="escapes-hub-faq"]');
    expect(await faqDetails.count()).toBeGreaterThanOrEqual(3);

    // Enlaces a marcas reales
    await expect(page.locator('a[href="/escapes/yamaha"]').first()).toBeVisible();
    await expect(page.locator('a[href="/escapes/honda"]').first()).toBeVisible();

    // Selector rápido Marca -> Modelo
    await page.selectOption('#moto-hub-brand', 'yamaha');
    await expect(page.locator('#moto-hub-model option[value="mt-07"]')).toBeAttached({ timeout: 10_000 });
    await page.selectOption('#moto-hub-model', 'mt-07');
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL('**/escapes/yamaha/mt-07');
  });

  test('/escapes/yamaha muestra escapes destacados, buscador de modelos y enlaces SSR', async ({ page }) => {
    const res = await page.goto('/escapes/yamaha');
    expect(res?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText(/Yamaha/i);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/escapes\/yamaha$/);

    await expect(page.locator('a[href="/escapes/yamaha/mt-07"]').first()).toBeVisible();

    // Filtro instantáneo de modelos
    const searchInput = page.getByLabel(/Buscar modelo de Yamaha/i);
    await searchInput.fill('MT-07');
    await expect(page.locator('a[href="/escapes/yamaha/mt-07"]')).toBeVisible();
  });

  test('/escapes/yamaha/mt-07 y /escapes/honda/cb-650-r priorizan escapes reales, guardan garaje y añaden al carrito', async ({ page }) => {
    const res = await page.goto('/escapes/yamaha/mt-07');
    expect(res?.status()).toBe(200);

    await expect(page).toHaveTitle(/Escapes Yamaha MT-07/i);
    await expect(page.locator('h1')).toContainText(/Yamaha MT-07/i);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/escapes\/yamaha\/mt-07$/);

    // Sección protagonista de escapes completos y silenciosos
    await expect(page.locator('#escapes-principales-heading')).toContainText(/Escapes, silenciosos y colectores para Yamaha MT-07/i);
    const productCards = page.locator('a[href*="/producto/"]');
    expect(await productCards.count()).toBeGreaterThan(5);

    // Prioridad LCP en primeras imágenes y lazy sin fetchpriority="low" en el resto
    const firstImgPriority = await page.locator('a[href*="/producto/"] img').first().getAttribute('fetchpriority');
    expect(firstImgPriority).toBe('high');

    // JSON-LD completo con productos y precios
    const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const itemListRaw = ldScripts.find((s) => s.includes('"ItemList"'));
    expect(itemListRaw).toBeTruthy();
    const itemList = JSON.parse(itemListRaw!);
    expect(itemList.numberOfItems).toBeGreaterThan(0);
    expect(itemList.itemListElement[0].item['@type']).toBe('Product');

    // Guardar en Mi Garaje
    const garageBtn = page.getByRole('button', { name: /Guardar en Mi Garaje/i });
    await garageBtn.click();
    await expect(page.getByRole('button', { name: /Moto activa en Mi Garaje/i })).toBeVisible();
    const storedBike = await page.evaluate(() => localStorage.getItem('tg_selected_bike'));
    expect(storedBike).toBe('YAMAHA MT-07');

    // Añadir un producto compatible en stock al carrito
    const addBtn = page.locator('button[aria-label="Añadir al carrito"]').first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();
      await expect(page.locator('header button[aria-label="Abrir carrito"] span')).toContainText('1');
    }

    // Honda CB 650 R (ediciones cosméticas NEO SPORTS CAFE unificadas al modelo base)
    const resHonda = await page.goto('/escapes/honda/cb-650-r');
    expect(resHonda?.status()).toBe(200);
    await expect(page.locator('#escapes-principales-heading')).toContainText(/Honda CB 650 R/i);
  });

  test('Filtro ?year= aplica noindex manteniendo canonical limpia al modelo', async ({ page }) => {
    const res = await page.goto('/escapes/yamaha/mt-07?year=2021');
    expect(res?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText(/2021/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/escapes\/yamaha\/mt-07$/);

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('Variantes de URL no canónicas redirigen permanentemente (308) y modelos falsos dan 404', async ({ request }) => {
    const rKawa = await request.get('/escapes/kawasaki/z900', { maxRedirects: 0 });
    expect([301, 308]).toContain(rKawa.status());
    expect(rKawa.headers()['location']).toContain('/escapes/kawasaki/z-900');

    const rKtm = await request.get('/escapes/ktm/duke-125', { maxRedirects: 0 });
    expect([301, 308]).toContain(rKtm.status());
    expect(rKtm.headers()['location']).toContain('/escapes/ktm/125-duke');

    const rHondaTrim = await request.get('/escapes/honda/cb-650-r-neo-sports-cafe', { maxRedirects: 0 });
    expect([301, 308]).toContain(rHondaTrim.status());
    expect(rHondaTrim.headers()['location']).toContain('/escapes/honda/cb-650-r');

    const r404Brand = await request.get('/escapes/marca-inventada-xyz');
    expect(r404Brand.status()).toBe(404);

    const r404Model = await request.get('/escapes/yamaha/modelo-inventado-999');
    expect(r404Model.status()).toBe(404);
  });

  test('Sitemap /sitemap.xml enlaza /sitemaps/motos.xml con modelos activos verificados', async ({ request }) => {
    const indexRes = await request.get('/sitemap.xml');
    expect(indexRes.status()).toBe(200);
    const indexXml = await indexRes.text();
    expect(indexXml).toContain('/sitemaps/motos.xml</loc>');

    const motosRes = await request.get('/sitemaps/motos.xml');
    expect(motosRes.status()).toBe(200);
    const motosXml = await motosRes.text();
    expect(motosXml).toContain('<urlset');
    expect(motosXml).toContain('/escapes</loc>');
    expect(motosXml).toContain('/escapes/yamaha</loc>');
    expect(motosXml).toContain('/escapes/yamaha/mt-07</loc>');
    expect(motosXml).toContain('/escapes/kawasaki/z-900</loc>');
  });
});
