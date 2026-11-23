/**
 * Filtro de las páginas vistas de Umami (`data-before-send`, ver UmamiScript).
 *
 * Los chips de año de las páginas de moto (`?year=2021`) y las pestañas de la portada (`?tab=garage`) navegan con `history.pushState`,
 * y Umami cuenta cada una como una página vista nueva (23/11/2026: el 46 % de las segundas «páginas» de las visitas a una moto eran un
 * cambio de año, y salían 3 páginas vistas por visita). Aquí se descartan: misma ruta que la última página vista contada y una
 * query que solo lleva `year` o `tab`. Cualquier otra navegación (otra ruta, un `?q=` de búsqueda, una campaña con UTM) se cuenta igual.
 *
 * No usa nada de fuera (solo `URL` y `location`) porque UmamiScript lo inyecta como texto (`createBeforeSend.toString()`) antes de que cargue el
 * script de Umami: así la primera página vista ya pasa por el filtro.
 */
export function createBeforeSend() {
  let last: string | null = null;
  const cosmetic: Record<string, number> = { year: 1, tab: 1 };
  return function (type: string, payload: { name?: string; url?: string } | null) {
    try {
      // Una página vista es un evento SIN nombre; los eventos propios (add_to_cart…) llevan `name` y pasan siempre.
      if (type === 'event' && payload && !payload.name && payload.url) {
        const u = new URL(payload.url, location.href);
        let onlyCosmetic = true;
        u.searchParams.forEach(function (_value, key) {
          if (cosmetic[key] !== 1) onlyCosmetic = false;
        });
        if (last === u.pathname && onlyCosmetic) return null;
        last = u.pathname;
      }
    } catch (e) {
      // Nunca romper la medición por el filtro.
    }
    return payload;
  };
}
