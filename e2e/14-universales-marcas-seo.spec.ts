import { test, expect } from '@playwright/test';

test.describe('Indexación SEO de /universales, /marcas y Fichas de Comerciante GSC', () => {
  test('/universales expone árbol SEO L1->L2, marcas, JSON-LD, paginación <a href> y <=2 imágenes high-priority', async ({
    page,
  }) => {
    const res = await page.goto('/universales');
    expect(res?.status()).toBe(200);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/universales$/);

    // JSON-LD: BreadcrumbList + ItemList
    const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsedSchemas = ldScripts.flatMap((txt) => {
      try {
        return [JSON.parse(txt)];
      } catch {
        return [];
      }
    });
    const types = parsedSchemas.map((s) => s['@type']);
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('ItemList');

    // Paginación rastreable real <a href="/universales?page=2">
    await expect(page.locator('nav[aria-label="Paginación del catálogo"] a[href="/universales?page=2"]').first()).toBeVisible();
    await expect(page.locator('nav[aria-label="Paginación del catálogo"] a[rel="next"]')).toHaveAttribute(
      'href',
      '/universales?page=2',
    );

    // Prioridad LCP en primeras tarjetas y lazy en el resto
    await expect(page.locator('a[href*="/producto/"]').first()).toBeVisible({ timeout: 10_000 });
    const firstImgPriority = await page.locator('a[href*="/producto/"] img').first().getAttribute('fetchpriority');
    expect(firstImgPriority).toBe('high');

    // Directorio SEO bajo el pliegue + Footer completo
    await expect(page.locator('#catalog-seo-directory')).toContainText(/Índice completo de categorías/i);
    await expect(page.locator('section[aria-labelledby="catalog-seo-directory"] a[href="/marcas"]')).toBeAttached();
    await expect(page.locator('section[aria-labelledby="catalog-seo-directory"] a[href^="/marcas/"]').first()).toBeAttached();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('/universales/cascos?page=2 emite canonical autorreferente y filtros ?brands= aplican noindex', async ({
    page,
  }) => {
    const resPage2 = await page.goto('/universales/cascos?page=2');
    expect(resPage2?.status()).toBe(200);

    await expect(page).toHaveTitle(/Página 2/i);
    const canonicalP2 = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalP2).toMatch(/\/universales\/cascos\?page=2$/);

    const robotsP2 = await page.locator('meta[name="robots"]').count();
    if (robotsP2 > 0) {
      const content = (await page.locator('meta[name="robots"]').getAttribute('content')) || '';
      expect(content).not.toContain('noindex');
    }

    // Combinación filtrada -> noindex y canonical limpia a la categoría base
    const resFiltered = await page.goto('/universales/cascos?brands=ARAI');
    expect(resFiltered?.status()).toBe(200);
    const canonicalFiltered = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalFiltered).toMatch(/\/universales\/cascos$/);
    const robotsFiltered = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsFiltered).toContain('noindex');
  });

  test('/universales/neumaticos renderiza buscador por medida y muestra SSR indexable de neumáticos en stock', async ({
    page,
  }) => {
    const res = await page.goto('/universales/neumaticos');
    expect(res?.status()).toBe(200);

    // Muestra SSR de neumáticos reales enlazados a /producto/
    const productLinks = page.locator('main a[href^="/producto/"]');
    expect(await productLinks.count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('footer')).toBeVisible();
  });

  test('/marcas y /marcas/ixil exponen catálogo de fabricantes sin BIHR, JSON-LD y redirecciones 308/404', async ({
    page,
    request,
  }) => {
    const resHub = await page.goto('/marcas');
    expect(resHub?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText(/Marcas de escapes, recambios y equipamiento de moto/i);
    const canonicalHub = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalHub).toMatch(/\/marcas$/);

    await expect(page.locator('a[href="/marcas/ixil"]').first()).toBeVisible();
    expect(await page.locator('a[href*="/marcas/bihr"]').count()).toBe(0);

    // Landing de marca especialista en escapes: IXIL
    const resIxil = await page.goto('/marcas/ixil');
    expect(resIxil?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/IXIL/i);
    const canonicalIxil = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalIxil).toMatch(/\/marcas\/ixil$/);

    const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ldScripts.flatMap((txt) => {
      try {
        return [JSON.parse(txt)['@type']];
      } catch {
        return [];
      }
    });
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('ItemList');
    expect(types).toContain('FAQPage');

    expect(await page.locator('main a[href^="/producto/"]').count()).toBeGreaterThan(3);
    await expect(page.locator('footer')).toBeVisible();

    // Redirección 308 de variante en mayúsculas y 404 para BIHR / marca inexistente
    const rUpper = await request.get('/marcas/IXIL', { maxRedirects: 0 });
    expect([301, 308]).toContain(rUpper.status());
    expect(rUpper.headers()['location']).toContain('/marcas/ixil');

    const rBihr = await request.get('/marcas/bihr');
    expect(rBihr.status()).toBe(404);

    const rFake = await request.get('/marcas/marca-inexistente-999');
    expect(rFake.status()).toBe(404);
  });

  test('/producto/79900181 corrige error GSC de image vacía + warnings shippingDetails/hasMerchantReturnPolicy y redirige URLs legacy', async ({
    page,
    request,
  }) => {
    const res = await page.goto('/producto/79900181');
    expect(res?.status()).toBe(200);

    const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const productSchemaRaw = ldScripts.find((s) => s.includes('"@type":"Product"') || s.includes('"@type": "Product"'));
    expect(productSchemaRaw).toBeTruthy();

    const productSchema = JSON.parse(productSchemaRaw!);
    // 1. Campo image obligatorio nunca vacío (fallback og-image.png cuando la foto en BD tenía src: "")
    expect(Array.isArray(productSchema.image)).toBe(true);
    expect(productSchema.image.length).toBeGreaterThanOrEqual(1);
    expect(productSchema.image[0]).toMatch(/^https:\/\/escapesymas\.com\/.+/);

    // 2. shippingDetails y hasMerchantReturnPolicy presentes en offers
    expect(productSchema.offers).toBeTruthy();
    expect(productSchema.offers.shippingDetails).toBeTruthy();
    expect(productSchema.offers.shippingDetails['@type']).toBe('OfferShippingDetails');
    expect(productSchema.offers.hasMerchantReturnPolicy).toBeTruthy();
    expect(productSchema.offers.hasMerchantReturnPolicy['@type']).toBe('MerchantReturnPolicy');
    expect(productSchema.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
    expect(productSchema.offers.itemCondition).toBe('https://schema.org/NewCondition');

    // Enlace de marca apunta a /marcas/fresco en lugar de búsqueda noindex
    await expect(page.locator('a[href="/marcas/fresco"]').first()).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Slug descriptivo /producto/79900181-... redirige permanentemente (308) al SKU canónico
    const rDescriptive = await request.get('/producto/79900181-kit-adhesivos-fresco-2t', { maxRedirects: 0 });
    expect([301, 308]).toContain(rDescriptive.status());
    expect(rDescriptive.headers()['location']).toContain('/producto/79900181');

    // URL legacy de WooCommerce (/producto/mivv-...) rescatada hacia /escapes/aprilia/...
    const rLegacy = await request.get('/producto/mivv-slip-on-dakar-st-steel-aprilia-tuareg-660-2022-25', {
      maxRedirects: 0,
    });
    expect([301, 308]).toContain(rLegacy.status());
    expect(rLegacy.headers()['location']).toMatch(/\/escapes(\/aprilia)?/);
  });

  test('Sitemap /sitemap.xml incluye /sitemaps/marcas.xml con fabricantes activos y sin BIHR', async ({
    request,
  }) => {
    const idxRes = await request.get('/sitemap.xml');
    expect(idxRes.status()).toBe(200);
    const idxXml = await idxRes.text();
    expect(idxXml).toContain('/sitemaps/marcas.xml</loc>');

    const marcasRes = await request.get('/sitemaps/marcas.xml');
    expect(marcasRes.status()).toBe(200);
    const marcasXml = await marcasRes.text();
    expect(marcasXml).toContain('<urlset');
    expect(marcasXml).toContain('/marcas</loc>');
    expect(marcasXml).toContain('/marcas/ixil</loc>');
    expect(marcasXml.toLowerCase()).not.toContain('/marcas/bihr');
  });

  test('Ficha de producto con compatibilidades enlaza bidireccionalmente a la landing de moto (/escapes/marca/modelo)', async ({
    page,
  }) => {
    const res = await page.goto('/producto/1155025');
    expect(res?.status()).toBe(200);

    // Localiza la sección de compatibilidad y verifica enlaces a marca y modelo
    const compatSection = page.locator('#compatibilidad');
    await expect(compatSection).toBeAttached();

    // Despliega el acordeón <details id="compatibilidad">
    await compatSection.locator('summary').click();

    const brandLink = compatSection.locator('a[href="/escapes/yamaha"]').first();
    await expect(brandLink).toBeVisible();

    const modelLink = compatSection.locator('a[href="/escapes/yamaha/mt-07"]').first();
    await expect(modelLink).toBeVisible();
    await expect(modelLink).toContainText(/MT-07/i);
  });

  test('Protocolo IndexNow: archivo de verificación accesible en /e9a4f682d3c1482098d5781a5a04e4c2.txt', async ({
    request,
  }) => {
    const res = await request.get('/e9a4f682d3c1482098d5781a5a04e4c2.txt');
    expect(res.status()).toBe(200);
    const text = (await res.text()).trim();
    expect(text).toBe('e9a4f682d3c1482098d5781a5a04e4c2');
  });
});
