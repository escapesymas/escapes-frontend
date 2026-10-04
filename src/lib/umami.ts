/**
 * Umami client-side event helper.
 *
 * Calls `window.umami.track(eventName, eventData)` if the Umami script has
 * loaded. No-ops when `window.umami` is missing — that covers the three
 * normal "Umami isn't there" cases:
 *   - NEXT_PUBLIC_UMAMI_ENABLED !== 'true' (script tag never rendered)
 *   - The script is still loading (race between mount and inject)
 *   - The user has an ad-blocker / privacy extension that strips Umami
 *
 * Umami's `track` API: https://umami.is/docs/tracker-functions
 * - eventName is the event key configured in the Umami dashboard.
 * - eventData must be a flat object of string|number values.
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}

// Eventos lanzados antes de que cargue el script (p. ej. la ficha de producto
// al entrar directamente): se guardan y se envían en cuanto está, hasta 10 s.
const pending: [string, Record<string, string | number> | undefined][] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function send(eventName: string, eventData?: Record<string, string | number>) {
  try {
    window.umami!.track(eventName, eventData);
  } catch {
    // Swallow — analytics must never break the page.
  }
}

export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number>
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.umami?.track === 'function') { send(eventName, eventData); return; }
  if (pending.length >= 20) return;
  pending.push([eventName, eventData]);
  if (flushTimer) return;
  const started = Date.now();
  flushTimer = setInterval(() => {
    const ready = typeof window.umami?.track === 'function';
    if (!ready && Date.now() - started < 10_000) return;
    clearInterval(flushTimer!);
    flushTimer = null;
    const queued = pending.splice(0);
    if (ready) queued.forEach(([n, d]) => send(n, d));
  }, 500);
}

/** Texto corto para los datos del evento (Umami guarda cadenas de hasta 500 caracteres). */
export const short = (v: unknown, max = 80) => String(v ?? '').slice(0, max);