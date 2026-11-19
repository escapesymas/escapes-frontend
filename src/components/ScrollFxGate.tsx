'use client';

import { useEffect } from 'react';

/**
 * Enciende las animaciones de scroll (`.reveal`, `.reveal-block`, que usan `animation-timeline: view()`) solo en un Chromium de verdad.
 *
 * En el iPhone (Safari, Chrome y Brave usan el WebKit de iOS) la web se caía en cuanto esas animaciones se activaban (19/11/2026):
 * decenas de líneas de tiempo por scroll en una portada con cientos de tarjetas. Safari de escritorio comparte motor, así que tampoco
 * se arriesga. `navigator.userAgentData` solo existe en Chromium (Chrome, Edge, Brave, Opera en Android y escritorio); en iOS no.
 * Sin la clase `scroll-fx` la página se ve igual, solo que sin ese movimiento.
 */
export default function ScrollFxGate() {
  useEffect(() => {
    try {
      const brands = (navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData?.brands;
      if (brands?.some((b) => /chromium/i.test(b.brand))) document.documentElement.classList.add('scroll-fx');
    } catch { /* sin datos del navegador: sin animación de scroll */ }
  }, []);
  return null;
}
