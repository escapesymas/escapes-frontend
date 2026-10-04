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

function getSelectedBike(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('tg_selected_bike') || null;
  } catch {
    return null;
  }
}

export interface ChatStreamHandlers {
  onDelta: (delta: string) => void;
  onProducts: (products: ChatProduct[]) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  /** El asistente no ha podido resolverlo y hay un asesor disponible. */
  onOfferHuman?: (agentName: string) => void;
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
    // La moto elegida en la web («Mi garaje» de la cabecera) tiene prioridad.
    body: JSON.stringify({ messages, selectedBike: getSelectedBike() }),
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
        if (parsed.offerHuman) {
          handlers.onOfferHuman?.(parsed.agentName || 'un asesor');
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


// ── Chat con un asesor humano ────────────────────────────────────────────

export interface LiveOrderPayload {
  chatOrderId: number;
  url: string;
  /** unit: precio pactado; list: precio sin el descuento del asesor (si lo hay). */
  lines: { id: number; quantity: number; name: string; image: string | null; unit: number; list?: number | null; discount?: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  note: string | null;
}

export interface LiveMessage {
  id: number;
  sender: 'customer' | 'ai' | 'agent' | 'system';
  /** text · product (tarjeta) · image · order (pedido con botón de pago) */
  kind?: 'text' | 'product' | 'image' | 'order';
  content: string;
  payload?: any;
  created_at: string;
}

export interface LiveConversation {
  id: number;
  status: 'waiting' | 'open' | 'closed';
  closedBy?: string | null;
  agentName: string;
}

async function liveFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}

/** Pasa la conversación a un asesor (con lo hablado con la IA como contexto). */
export function requestHandoff(messages: ChatMessage[]) {
  return liveFetch<{ conversation: LiveConversation }>('/chat/handoff', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

/** Conversación con el asesor y mensajes posteriores a `after`. */
export function fetchLive(after = 0, active = false) {
  return liveFetch<{ conversation: LiveConversation | null; messages: LiveMessage[] }>(
    `/chat/live?after=${after}${active ? '&active=1' : ''}`
  );
}

export function sendLiveMessage(content: string) {
  return liveFetch<{ message: LiveMessage }>('/chat/live/message', { method: 'POST', body: JSON.stringify({ content }) });
}

export function closeLive() {
  return liveFetch<{ ok: boolean }>('/chat/live/close', { method: 'POST' });
}

// ── Avisos push de las respuestas del asesor ─────────────────────────────

export type ChatPushState = 'unsupported' | 'denied' | 'default' | 'granted';

/** ¿Puede este navegador recibir avisos? (en iPhone, solo con la web añadida a la pantalla de inicio). */
export function chatPushState(): ChatPushState {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as ChatPushState;
}

function base64ToUint8(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Pide permiso (debe llamarse desde un clic) y registra el dispositivo para que
 * le lleguen las respuestas del asesor aunque cierre la web.
 */
export async function enableChatPush(): Promise<ChatPushState> {
  const state = chatPushState();
  if (state === 'unsupported' || state === 'denied') return state;
  const permission = state === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission as ChatPushState;
  try {
    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await fetch(`${API_BASE}/push/vapid-public-key`).then((r) => r.json());
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8(publicKey) as BufferSource,
      });
    }
    await liveFetch('/chat/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) });
  } catch (err) {
    console.warn('[chat] no se pudieron activar los avisos:', err);
  }
  return 'granted';
}
