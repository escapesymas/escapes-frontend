import type { SessionData } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProduct {
  id: number;
  sku: string;
  name: string;
  brand: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image: string | null;
  slug: string | null;
  in_stock: boolean;
}

const SESSION_KEY = 'tg_session';
const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionData;
    return session.token || null;
  } catch {
    return null;
  }
}

export interface ChatStreamHandlers {
  onDelta: (delta: string) => void;
  onProducts: (products: ChatProduct[]) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  handlers: ChatStreamHandlers
): Promise<void> {
  const token = getToken();
  if (!token) {
    handlers.onError('No has iniciado sesión. Inicia sesión para usar el asistente.');
    return;
  }

  const res = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('session-expired'));
    handlers.onError('Tu sesión ha expirado. Inicia sesión de nuevo.');
    return;
  }

  if (res.status === 429) {
    const data = await res.json().catch(() => ({ error: 'Demasiadas peticiones' }));
    handlers.onError(data.error || 'Has alcanzado el límite de mensajes.');
    return;
  }

  if (res.status === 503) {
    handlers.onError('El asistente no está configurado todavía.');
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Error desconocido' }));
    if (data.reply) {
      handlers.onDelta(data.reply);
      handlers.onDone();
      return;
    }
    handlers.onError(data.error || `Error ${res.status}`);
    return;
  }

  if (!res.body) {
    handlers.onError('El servidor no envió respuesta.');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) {
          handlers.onError('La respuesta se interrumpió.');
          return;
        }
        if (parsed.done) {
          handlers.onDone();
          return;
        }
        if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
          handlers.onProducts(parsed.products);
        }
        if (parsed.delta) {
          handlers.onDelta(parsed.delta);
        }
      } catch {
      }
    }
  }
  handlers.onDone();
}

export async function checkChatHealth(): Promise<{ ok: boolean; configured: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/chat/health`);
    if (!res.ok) return { ok: false, configured: false };
    const data = await res.json();
    return { ok: data.status === 'ok', configured: !!data.configured };
  } catch {
    return { ok: false, configured: false };
  }
}
