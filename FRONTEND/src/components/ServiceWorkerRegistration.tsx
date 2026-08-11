'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Register in production AND dev — local testing needs the SW to validate
    // the offline flow and the cache-first strategy.
    navigator.serviceWorker
      .register('/sw.js?v=4')
      .then((registration) => {
        // If a new SW is waiting, ask it to take over immediately so users
        // get the latest caching behavior after a deploy without a hard reload.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              next.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
        // eslint-disable-next-line no-console
        console.log('[SW] Registered:', registration.scope);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[SW] Registration failed:', error);
      });
  }, []);

  return null;
}