import { test, expect } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE || 'https://backendescapes.com/api';

test.describe('Backend endpoints públicos', () => {
  test('GET /catalog/products con paginación', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/products?per_page=12&page=1`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /catalog/filters devuelve opciones', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/filters`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toBeDefined();
  });

  test('GET /catalog/stock-check no requiere auth', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/stock-check?ids=56996`);
    expect(r.status()).toBe(200);
  });

  test('GET /catalog/frequently-bought-together/:id responde array', async ({ request }) => {
    const r = await request.get(`${API_BASE}/catalog/frequently-bought-together/69475`);
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /image-proxy con URL de mybihr devuelve imagen', async ({ request }) => {
    const r = await request.get(`${API_BASE}/image-proxy?url=https%3A%2F%2Fapi.mybihr.com%2Fmedias%2F1036683-1-800Wx800H%3Fcontext%3DbWFzdGVyfHJvb3R8NTkyNjd8aW1hZ2UvanBlZ3xhR1E1TDJnMk1DODRPVEF4T1RJMU5qazVOakUwTHpFd016WTJPRE10TVY4NE1EQlhlRGd3TUVnfDU2OWE4MzQwZjVjZjdmNzQ3MWE3ZWJhYjM0YTk0MTFkNDM1ZDFjYjg0NDUxYjkwNzI4ODQ5YWQ4OGE0NTNkZDQ`);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/image/);
  });

  test('GET /image-proxy con host no permitido rechazado', async ({ request }) => {
    const r = await request.get(`${API_BASE}/image-proxy?url=https%3A%2F%2Fevil.com%2Fimage.jpg`);
    expect(r.status()).toBe(400);
  });
});
