'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getApiUrl } from '../lib/constants';

function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'Directo';

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) return utmSource.slice(0, 30);

    const ref = document.referrer;
    if (!ref) return 'Directo';

    const refUrl = new URL(ref);
    const host = refUrl.hostname.toLowerCase();
    if (host.includes('escapesymas.com')) return 'Interno';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('google.')) return 'Google';
    if (host.includes('facebook.com')) return 'Facebook';
    if (host.includes('youtube.com')) return 'YouTube';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X / Twitter';

    return host.replace(/^www\./, '').slice(0, 30);
  } catch {
    return 'Directo';
  }
}

function sendVisitorEvent(payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  try {
    const url = getApiUrl('/push/visitor-event');
    const body = JSON.stringify(payload);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {});
  } catch {
    // Analytics / tracking nunca debe lanzar errores ni romper la interfaz
  }
}

function isStaffOrBot(): boolean {
  if (typeof window === 'undefined') return true;
  if (navigator.webdriver) return true;
  try {
    if (localStorage.getItem('escapesymas_admin_session')) return true;
    const sess = localStorage.getItem('tg_session');
    if (sess) {
      const parsed = JSON.parse(sess);
      if (parsed?.role === 'admin' || parsed?.role === 'asesor') return true;
    }
  } catch {}
  return false;
}

/**
 * Rastreador discreto para notificar visitas nuevas y avance en la tienda
 * al panel de administración móvil. Filtra bots, recargas y personal interno.
 */
export default function VisitorTracker() {
  const pathname = usePathname();
  const initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Inicialización y visita inicial
  useEffect(() => {
    if (isStaffOrBot()) return;

    let sid = '';
    try {
      sid = sessionStorage.getItem('eym_sid') || '';
      if (!sid) {
        sid = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem('eym_sid', sid);
      }
    } catch {
      sid = `sid_${Date.now()}`;
    }

    // Si ya enviamos el aviso de entrada en esta sesión, no repetimos
    const entrySent = sessionStorage.getItem('eym_entry_sent');
    if (!entrySent) {
      // Esperamos 2.5s para no contar rebotes instantáneos de 0s y dar tiempo al título
      initTimer.current = setTimeout(() => {
        try {
          const source = detectTrafficSource();
          const title = document.title || 'Escapes y Más';
          sendVisitorEvent({
            event: 'visit',
            sessionId: sid,
            page: window.location.pathname,
            title,
            source,
            referrer: document.referrer || undefined,
          });
          sessionStorage.setItem('eym_entry_sent', '1');
        } catch {}
      }, 2500);
    }

    // Escuchar adición al carrito
    const handleAddToCart = (e: Event) => {
      if (isStaffOrBot()) return;
      const customEvent = e as CustomEvent<{ product?: { name?: string; price?: number; salePrice?: number }; quantity?: number }>;
      const product = customEvent.detail?.product;
      const price = product?.salePrice ?? product?.price;
      const currentSid = sessionStorage.getItem('eym_sid') || sid;

      sendVisitorEvent({
        event: 'engaged',
        sessionId: currentSid,
        action: 'add_to_cart',
        productName: product?.name || 'Producto',
        productPrice: price,
        page: window.location.pathname,
      });
    };

    window.addEventListener('eym_add_to_cart', handleAddToCart);

    return () => {
      if (initTimer.current) clearTimeout(initTimer.current);
      window.removeEventListener('eym_add_to_cart', handleAddToCart);
    };
  }, []);

  // 2. Avance en la navegación (cambio de ruta)
  useEffect(() => {
    if (!pathname || isStaffOrBot()) return;

    let sid = '';
    let pageCount = 1;
    try {
      sid = sessionStorage.getItem('eym_sid') || '';
      pageCount = parseInt(sessionStorage.getItem('eym_pcount') || '0', 10) + 1;
      sessionStorage.setItem('eym_pcount', String(pageCount));
    } catch {}

    if (!sid) return;

    // Hito A: Consulta de producto específica (permanece al menos 3.5 segundos en la ficha)
    if (pathname.startsWith('/producto/')) {
      const prodKey = `eym_viewed_${pathname}`;
      if (!sessionStorage.getItem(prodKey)) {
        if (productTimer.current) clearTimeout(productTimer.current);
        productTimer.current = setTimeout(() => {
          if (window.location.pathname !== pathname) return;
          const cleanTitle = (document.title || '').replace(/\s*[-|]\s*Escapes y Más.*$/i, '').trim();
          sendVisitorEvent({
            event: 'engaged',
            sessionId: sid,
            action: 'view_product',
            productName: cleanTitle,
            page: pathname,
            pageCount,
          });
          sessionStorage.setItem(prodKey, '1');
        }, 3500);
      }
    }

    // Hito B: Navegación profunda (3 páginas vistas)
    if (pageCount === 3 && !sessionStorage.getItem('eym_engaged_browse')) {
      sendVisitorEvent({
        event: 'engaged',
        sessionId: sid,
        action: 'browse',
        pageCount,
        page: pathname,
      });
      sessionStorage.setItem('eym_engaged_browse', '1');
    }

    // Hito C: Paso por checkout
    if (pathname.includes('/checkout') && !sessionStorage.getItem('eym_engaged_checkout')) {
      sendVisitorEvent({
        event: 'engaged',
        sessionId: sid,
        action: 'checkout',
        page: pathname,
      });
      sessionStorage.setItem('eym_engaged_checkout', '1');
    }

    return () => {
      if (productTimer.current) clearTimeout(productTimer.current);
    };
  }, [pathname]);

  return null;
}
