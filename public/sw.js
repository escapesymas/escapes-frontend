/* Escapes y Más — Service Worker v6 */

const SW_VERSION = 'v6';
const STATIC_CACHE = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;
const HTML_FALLBACK = '/offline';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/logo-cabecera.svg',
  '/logo-cabecera-negro.svg',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/manifest.json' ||
    /\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  );
}

function isNavigation(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html'))
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match(HTML_FALLBACK);
    if (fallback) return fallback;
    return new Response(
      '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Sin conexión</title></head><body style="font-family:system-ui;padding:2rem;max-width:32rem;margin:0 auto;"><h1>Estás sin conexión</h1><p>No pudimos cargar esta página y no hay una versión en caché disponible. Comprueba tu conexión y vuelve a intentarlo.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass SW completely in local dev (localhost / 127.0.0.1)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/data/')) return;

  if (isNavigation(request)) {
    event.respondWith(navigationStrategy(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API + image responses: try network, fall back to cache.
  event.respondWith(networkFirst(request));
});
