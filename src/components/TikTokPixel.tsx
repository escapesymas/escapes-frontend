'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { captureTtclid, hasMarketingConsent, loadTikTokPixel, revokeTikTokConsent, tiktokPage } from '../lib/tiktok';

/**
 * Activa el píxel de TikTok cuando hay permiso de marketing (al cargar o al
 * aceptarlo en el aviso de cookies) y registra las visitas al cambiar de página.
 */
export default function TikTokPixel() {
  const pathname = usePathname();
  const firstPath = useRef(true);

  useEffect(() => {
    captureTtclid();
    loadTikTokPixel();
    const onConsent = () => {
      if (hasMarketingConsent()) loadTikTokPixel();
      else revokeTikTokConsent();
    };
    window.addEventListener('cookie_consent_update', onConsent);
    return () => window.removeEventListener('cookie_consent_update', onConsent);
  }, []);

  useEffect(() => {
    // La primera visita ya la registra loadTikTokPixel().
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    tiktokPage();
  }, [pathname]);

  return null;
}
