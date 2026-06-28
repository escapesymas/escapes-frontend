// Minimal SW v3: clean up old broken SWs from previous deployments.
// v1 had a cache.addAll that failed on missing icons → never installed →
// users saw stale HTML + "Maximum call stack size exceeded".
// v2 was network-first but didn't clean up v1 caches.
// This v3 just unregisters everything and stops itself.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))),
      self.registration.unregister(),
    ]).then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});