/** Permiso de cookies de analítica del aviso (CookieBanner): sin él no se guarda ningún identificador de visita. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('cookie_consent');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // Formato actual ({ preferences: { analytics: 'accepted' } }) o antiguo ({ analytics: true }).
    return parsed?.preferences ? parsed.preferences.analytics === 'accepted' : parsed?.analytics === true;
  } catch {
    return false;
  }
}

/** Borra lo que el rastreador de visitas guarda en la pestaña (se llama al retirar el permiso). */
export function clearVisitorStorage() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('eym_')) sessionStorage.removeItem(k);
  } catch { /* sin storage */ }
}
