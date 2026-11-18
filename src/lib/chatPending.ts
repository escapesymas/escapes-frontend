/**
 * «Hablar con un asesor» pedido por alguien sin cuenta: se guarda hasta que tenga sesión y entonces el chat lo retoma.
 *
 * Va en localStorage (no en sessionStorage) porque el correo de confirmación de la cuenta se abre en otra pestaña. Caduca a las
 * 48 h. Si el cliente vuelve enseguida (entró desde el propio chat) se le pasa con el asesor solo; si ha pasado más tiempo
 * (confirmó el correo más tarde) se le pregunta antes: pasar con un asesor avisa al equipo y no debe pasar sin que lo espere.
 */

export const PENDING_ADVISOR_KEY = 'tg_chat_pending_advisor';
export const PENDING_TTL_MS = 48 * 3_600_000;
/** Hasta aquí se retoma sin preguntar (el cliente acaba de entrar desde el chat). */
export const AUTO_RESUME_MS = 3 * 60_000;

export interface PendingAdvisor { ctx: string; at: number }

export function savePending(ctx: string): void {
  try { localStorage.setItem(PENDING_ADVISOR_KEY, JSON.stringify({ ctx, at: Date.now() })); } catch { /* sin almacenamiento: no se recuerda */ }
}

export function readPending(now: number = Date.now()): PendingAdvisor | null {
  try {
    const raw = localStorage.getItem(PENDING_ADVISOR_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.at !== 'number' || now - p.at > PENDING_TTL_MS || p.at > now + 60_000) {
      localStorage.removeItem(PENDING_ADVISOR_KEY);
      return null;
    }
    return { ctx: typeof p.ctx === 'string' ? p.ctx : '', at: p.at };
  } catch {
    return null;
  }
}

export function clearPending(): void {
  try {
    localStorage.removeItem(PENDING_ADVISOR_KEY);
    sessionStorage.removeItem(PENDING_ADVISOR_KEY); // el de antes de pasar a localStorage
  } catch { /* nada que borrar */ }
}

/** ¿Se puede retomar sin preguntar? */
export function canAutoResume(p: PendingAdvisor, now: number = Date.now()): boolean {
  return now - p.at <= AUTO_RESUME_MS;
}
