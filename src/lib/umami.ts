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

export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number>
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.umami?.track !== 'function') return;
  try {
    window.umami.track(eventName, eventData);
  } catch {
    // Swallow — analytics must never break the page.
  }
}