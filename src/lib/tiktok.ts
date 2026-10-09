'use client';

/**
 * Píxel de TikTok. Solo se carga si el visitante acepta las cookies de
 * marketing del aviso (CookieBanner): sin ese permiso no se pide nada a TikTok.
 *
 * La compra también se envía desde el servidor (Events API) al confirmar el
 * pedido, con el mismo event_id para que TikTok no la cuente dos veces.
 */

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'DB4IV33C77U89E740R6G';

const CONSENT_KEY = 'cookie_consent';
const TTCLID_KEY = 'tt_ttclid';

type Ttq = {
  load: (id: string, opts?: Record<string, unknown>) => void;
  page: () => void;
  track: (event: string, props?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  grantConsent: () => void;
  revokeConsent: () => void;
  [k: string]: unknown;
};

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

let loaded = false;

export function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.preferences?.marketing === 'accepted';
  } catch {
    return false;
  }
}

/**
 * Guarda el ttclid de la URL (llegada desde un anuncio de TikTok) solo en esta
 * pestaña. Se envía a TikTok únicamente si el visitante da su permiso.
 */
export function captureTtclid() {
  if (typeof window === 'undefined') return;
  try {
    const id = new URLSearchParams(window.location.search).get('ttclid');
    if (id) sessionStorage.setItem(TTCLID_KEY, id.slice(0, 300));
  } catch { /* sin storage */ }
}

/** Código oficial del píxel de TikTok, sin el ttq.page() del final (lo lanza loadTikTokPixel). */
function installSnippet() {
  type Stub = unknown[] & Record<string, unknown>;
  const w = window as unknown as Record<string, Stub>;
  const t = 'ttq';
  (window as Window).TiktokAnalyticsObject = t;
  const ttq: Stub = (w[t] = w[t] || ([] as unknown as Stub));
  const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group',
    'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
  ttq.methods = methods;
  const setAndDefer = (obj: Stub, method: string) => {
    obj[method] = (...args: unknown[]) => { obj.push([method, ...args]); };
  };
  ttq.setAndDefer = setAndDefer;
  for (const m of methods) setAndDefer(ttq, m);
  const instances = () => (ttq._i = (ttq._i as Record<string, Stub>) || {}) as Record<string, Stub>;
  ttq.instance = (id: string) => {
    const inst = instances()[id] || ([] as unknown as Stub);
    for (const m of methods) setAndDefer(inst, m);
    return inst;
  };
  ttq.load = (id: string, opts?: Record<string, unknown>) => {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    const inst = [] as unknown as Stub;
    inst._u = src;
    instances()[id] = inst;
    ttq._t = { ...((ttq._t as Record<string, number>) || {}), [id]: Date.now() };
    ttq._o = { ...((ttq._o as Record<string, unknown>) || {}), [id]: opts || {} };
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = `${src}?sdkid=${id}&lib=${t}`;
    document.head.appendChild(s);
  };
}

/** Carga el píxel una sola vez, si hay permiso. Devuelve si está activo. */
export function loadTikTokPixel(): boolean {
  if (typeof window === 'undefined' || !TIKTOK_PIXEL_ID) return false;
  if (loaded) return true;
  if (!hasMarketingConsent()) return false;
  installSnippet();
  window.ttq?.load(TIKTOK_PIXEL_ID);
  window.ttq?.page();
  loaded = true;
  return true;
}

export function revokeTikTokConsent() {
  if (loaded) window.ttq?.revokeConsent();
}

export function tiktokPage() {
  if (loaded && hasMarketingConsent()) window.ttq?.page();
}

export interface TikTokContent {
  content_id: string;
  content_name?: string;
  quantity?: number;
  price?: number;
}

/** Evento estándar de TikTok (ViewContent, AddToCart, InitiateCheckout, CompletePayment…). */
export function tiktokTrack(
  event: string,
  props: { value?: number; contents?: TikTokContent[] } & Record<string, unknown> = {},
  eventId?: string,
) {
  if (!loaded || !hasMarketingConsent()) return;
  try {
    window.ttq?.track(
      event,
      { currency: 'EUR', content_type: 'product', ...props },
      eventId ? { event_id: eventId } : undefined,
    );
  } catch { /* nunca romper la tienda por el píxel */ }
}

function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : '';
  } catch {
    return '';
  }
}

/**
 * Datos para que el servidor envíe la compra a TikTok (Events API). Si no hay
 * permiso de marketing, solo va `marketing: false` y el servidor no envía nada.
 */
export function tiktokServerContext(): Record<string, unknown> {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return { marketing: false };
  let ttclid = '';
  try { ttclid = sessionStorage.getItem(TTCLID_KEY) || ''; } catch { /* sin storage */ }
  return {
    marketing: true,
    ttp: readCookie('_ttp').slice(0, 200),
    ttclid,
    url: window.location.origin + window.location.pathname,
  };
}
