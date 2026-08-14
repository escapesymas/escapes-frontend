'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Manejo de errores de carga de chunks obsoletos (404 tras un nuevo despliegue)
    const handleChunkError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('Loading chunk') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('_next/static/chunks')
      ) {
        const reloadKey = 'sw_chunk_reload_attempts';
        const attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
        if (attempts < 2) {
          sessionStorage.setItem(reloadKey, String(attempts + 1));
          window.location.reload();
        }
      }
    };
    window.addEventListener('error', handleChunkError);

    // En entorno de desarrollo (localhost), desregistrar cualquier SW activo para evitar caches stale
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      }
      return;
    }

    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js?v=6')
      .then((registration) => {
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
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    return () => {
      window.removeEventListener('error', handleChunkError);
    };
  }, []);


  return null;
}