'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  sendChatMessage, requestHandoff, fetchLive, sendLiveMessage, closeLive, enableChatPush, chatPushState,
  sendLiveTyping, sendLiveImage, rateLive,
  type ChatPushState, type LiveOrderPayload,
  type ChatMessage, type ChatProduct, type LiveConversation, type LiveMessage,
} from '../lib/chatApi';
import { tiktokAddToCart, trackEvent } from '../lib/analytics';
import ProductCardMessage from './chat/ProductCardMessage';

const SUGGESTIONS = [
  'Pastillas de freno para mi moto',
  '¿Cuánto cuesta el envío?',
  '¿Cómo va mi pedido?',
  '¿Cómo hago una devolución?',
];

const eur = (cents: number) => `${(cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Pedido preparado por el asesor: productos, importe orientativo y botón al checkout. */
function OrderCard({ order }: { order: LiveOrderPayload }) {
  return (
    <div className="bg-card border-2 border-accent rounded-xl overflow-hidden text-foreground">
      <div className="px-3 py-2 bg-accent/10 border-b border-card-border">
        <p className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold">Tu pedido preparado</p>
        {order.note && <p className="text-xs mt-0.5 whitespace-pre-wrap">{order.note}</p>}
      </div>
      <ul className="divide-y divide-card-border">
        {order.lines.map((l) => (
          <li key={l.id} className="flex items-center gap-2 px-3 py-2">
            {l.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={l.image} alt="" className="w-10 h-10 object-contain bg-background rounded" loading="lazy" />
              : <span className="w-10 h-10 bg-background rounded" />}
            <span className="flex-1 text-xs leading-tight line-clamp-2">
              {l.name}
              {!!l.discount && <span className="ml-1 text-[10px] font-bold text-emerald-600">−{String(l.discount).replace('.', ',')} %</span>}
            </span>
            <span className="text-xs whitespace-nowrap text-right">
              {l.list ? <span className="block text-[10px] text-muted-foreground line-through">{eur(l.list)}</span> : null}
              {l.quantity} × {eur(l.unit)}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-3 py-2 text-xs space-y-0.5 border-t border-card-border">
        {order.discount > 0 && <p className="flex justify-between text-emerald-600"><span>Descuento</span><span>−{eur(order.discount)}</span></p>}
        <p className="flex justify-between"><span>Envío (Península)</span><span>{order.shipping > 0 ? eur(order.shipping) : 'Gratis'}</span></p>
        <p className="flex justify-between font-bold text-sm"><span>Total aprox.</span><span>{eur(order.total)}</span></p>
        <p className="text-[10px] text-muted-foreground">El importe final se calcula con tu dirección de envío.</p>
      </div>
      <a
        href={order.url}
        className="block text-center px-3 py-2.5 bg-accent text-accent-foreground font-mono uppercase font-bold text-xs hover:bg-accent/90"
      >
        Ir al envío y pago
      </a>
    </div>
  );
}

// La conversación se guarda en la pestaña para no perderla al recargar.
const STORAGE_KEY = 'tg_chat_v1';
// Conversación con asesor ya cerrada que el cliente ha dejado atrás.
const DISMISSED_LIVE_KEY = 'tg_chat_live_dismissed';

/** **negrita** dentro de una línea. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>
  );
}

/** Formato mínimo de las respuestas: párrafos, listas con guiones y negritas. */
function ChatText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc pl-4 space-y-0.5">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) { list.push(item[1]); continue; }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    blocks.push(<p key={`p${blocks.length}`}>{heading ? <strong>{heading[1]}</strong> : inline(line)}</p>);
  }
  flush();
  return <div className="space-y-1.5">{blocks}</div>;
}

export default function ChatWidget() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [proactiveBike, setProactiveBike] = useState<string | null>(null);
  const [dismissedProactive, setDismissedProactive] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || dismissedProactive) {
      setProactiveBike(null);
      return;
    }
    try {
      const bike = localStorage.getItem('tg_selected_bike');
      if (bike) {
        const timer = setTimeout(() => setProactiveBike(bike), 45000);
        return () => clearTimeout(timer);
      }
    } catch {}
    setProactiveBike(null);
  }, [isAuthenticated, dismissedProactive]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [productsByMessage, setProductsByMessage] = useState<Record<number, ChatProduct[]>>({});
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat con un asesor humano.
  // «Hablar con un asesor» (hay alguien conectado) o «Dejar un mensaje» (fuera de horario).
  const [offer, setOffer] = useState<{ index: number; agentName: string; kind: 'human' | 'message' } | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSent, setRatingSent] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);
  const [live, setLive] = useState<LiveConversation | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [liveUnread, setLiveUnread] = useState(0);
  const [handoffBusy, setHandoffBusy] = useState(false);
  // Imagen del asesor ampliada en un visor (antes se abría en otra pestaña).
  const [imageView, setImageView] = useState<string | null>(null);
  useEffect(() => {
    if (!imageView) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setImageView(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imageView]);
  const [pushState, setPushState] = useState<ChatPushState>('unsupported');
  const lastLiveIdRef = useRef(0);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);
  const liveActive = !!live && live.status !== 'closed';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, productsByMessage, liveMessages]);

  // Mensajes nuevos de la conversación con el asesor (cada 3 s con el chat
  // abierto, cada 15 s cerrado para avisar con el contador del botón).
  const pollLive = async () => {
    try {
      const data = await fetchLive(lastLiveIdRef.current, openRef.current);
      if (!data.conversation) { setLive(null); return; }
      let dismissed = 0;
      try { dismissed = Number(sessionStorage.getItem(DISMISSED_LIVE_KEY)) || 0; } catch {}
      if (data.conversation.status === 'closed' && data.conversation.id === dismissed) { setLive(null); return; }
      setLive(data.conversation);
      if (data.messages.length) {
        lastLiveIdRef.current = data.messages[data.messages.length - 1].id;
        setLiveMessages((prev) => [...prev, ...data.messages.filter((m) => !prev.some((p) => p.id === m.id))]);
        const fromAgent = data.messages.filter((m) => m.sender === 'agent').length;
        if (fromAgent && !openRef.current) setLiveUnread((n) => n + fromAgent);
      }
    } catch { /* sin conexión: se reintenta en la siguiente vuelta */ }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    lastLiveIdRef.current = 0;
    setLiveMessages([]);
    pollLive();
    // Enlace del email «te hemos respondido» (/?chat=1): abre el chat.
    try {
      if (new URLSearchParams(window.location.search).get('chat') === '1') setOpen(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!liveActive) return;
    const id = setInterval(pollLive, open ? 3000 : 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveActive, open]);

  useEffect(() => { if (open) setLiveUnread(0); }, [open]);

  // Al pulsar la notificación con la web abierta, el service worker pide abrir el chat.
  useEffect(() => {
    setPushState(chatPushState());
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'open-chat') { setOpen(true); pollLive(); }
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activatePush = async () => setPushState(await enableChatPush());


  useEffect(() => {
    const handleExpired = () => setOpen(false);
    window.addEventListener('session-expired', handleExpired);
    return () => window.removeEventListener('session-expired', handleExpired);
  }, []);

  // Recuperar la conversación de esta pestaña (y olvidarla al cerrar sesión).
  // No se guarda nada hasta haberla recuperado: al cargar, la sesión aparece
  // antes que el perfil y el guardado borraba la conversación vacía.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    try {
      if (!isAuthenticated) { sessionStorage.removeItem(STORAGE_KEY); return; }
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.messages)) {
        setMessages(saved.messages);
        setProductsByMessage(saved.products || {});
      }
    } catch {} finally {
      restoredRef.current = isAuthenticated;
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (streaming || !isAuthenticated || isLoading || !restoredRef.current) return;
    try {
      if (messages.length === 0) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-30), products: productsByMessage }));
    } catch {}
  }, [messages, productsByMessage, streaming, isAuthenticated, isLoading]);

  if (isLoading) return null;

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || streaming) return;

    if (liveActive) {
      setInput('');
      setError(null);
      try {
        const { message } = await sendLiveMessage(clean);
        lastLiveIdRef.current = Math.max(lastLiveIdRef.current, message.id);
        setLiveMessages((prev) => [...prev, message]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
        setInput(clean);
      }
      return;
    }

    setError(null);
    trackEvent.chatInteraction('message');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: clean }];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    const assistantIndex = newMessages.length;

    await sendChatMessage(newMessages, {
      onDelta: (delta) => {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + delta };
          }
          return copy;
        });
      },
      onProducts: (products) => {
        setProductsByMessage((prev) => ({
          ...prev,
          [assistantIndex]: products,
        }));
      },
      onOfferHuman: (agentName) => setOffer({ index: assistantIndex, agentName, kind: 'human' }),
      onOfferMessage: () => setOffer({ index: assistantIndex, agentName: '', kind: 'message' }),
      onDone: () => setStreaming(false),
      onError: (msg) => {
        setError(msg);
        setMessages((m) => {
          if (m[m.length - 1]?.role === 'assistant' && m[m.length - 1]?.content === '') {
            return m.slice(0, -1);
          }
          return m;
        });
        setStreaming(false);
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([]);
    setProductsByMessage({});
    setError(null);
    setOffer(null);
  };

  const startHandoff = async (offline = false) => {
    setHandoffBusy(true);
    setError(null);
    // Los avisos no se piden aquí: primero se explica para qué se usan (tarjeta
    // en la conversación) y el permiso del navegador solo sale al aceptarlo.
    try {
      await requestHandoff(messages, offline);
      setRating(0); setRatingComment(''); setRatingSent(false);
      trackEvent.chatInteraction(offline ? 'leave_message' : 'advisor');
      setOffer(null);
      lastLiveIdRef.current = 0;
      setLiveMessages([]);
      await pollLive();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo avisar al asesor');
    } finally {
      setHandoffBusy(false);
    }
  };

  const sendPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se pueden enviar imágenes.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('La foto supera los 12 MB.'); return; }
    setPhotoBusy(true);
    setError(null);
    try {
      const { message } = await sendLiveImage(file, input.trim());
      setInput('');
      lastLiveIdRef.current = Math.max(lastLiveIdRef.current, message.id);
      setLiveMessages((prev) => [...prev, message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la foto');
    } finally {
      setPhotoBusy(false);
    }
  };

  const submitRating = async () => {
    if (!rating) return;
    try {
      await rateLive(rating, ratingComment.trim());
      setRatingSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la valoración');
    }
  };

  const endLive = async () => {
    if (!window.confirm('¿Terminar la conversación con el asesor?')) return;
    try { await closeLive(); } catch {}
    await pollLive();
  };

  const backToAssistant = () => {
    try { if (live) sessionStorage.setItem(DISMISSED_LIVE_KEY, String(live.id)); } catch {}
    setLive(null);
    setLiveMessages([]);
    lastLiveIdRef.current = 0;
    reset();
  };

  const handleAddToCart = (product: ChatProduct) => {
    addToCart(
      {
        id: product.id,
        title: product.name,
        name: product.name,
        slug: product.slug || String(product.id),
        price: product.sale_price ?? product.price,
        regularPrice: product.sale_price ? product.price : undefined,
        sku: product.sku,
        image: product.image || '',
        inStock: product.in_stock,
        stock: product.stock,
        category: product.brand,
      },
      1
    );
    tiktokAddToCart({ id: product.id, name: product.name, price: product.sale_price ?? product.price, salePrice: null }, 1);
    showToast({ message: 'Producto añadido al carrito', type: 'success' });
  };

  const handleViewProduct = (product: ChatProduct) => {
    const url = `/producto/${encodeURIComponent(product.slug || String(product.id))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-20 z-40 group"
        role="presentation"
      >
        <div className="relative">
          {proactiveBike && !open && (
            <div
              className="absolute -top-12 -right-16 md:-top-10 md:-right-12 z-10"
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(true); setDismissedProactive(true); }}
                className="whitespace-nowrap bg-card border border-accent text-foreground text-[10px] font-mono uppercase font-bold px-3 py-1.5 rounded-full shadow-md animate-bounce hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                aria-label="Abrir sugerencia del asistente"
              >
                💬 Sugerencia para tu {proactiveBike?.split(' ').slice(0, 2).join(' ')}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDismissedProactive(true); }}
                className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Cerrar sugerencia"
              >
                ✕
              </button>
            </div>
          )}
          {liveUnread > 0 ? (
            <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none z-10">
              {liveUnread}
            </div>
          ) : (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse pointer-events-none" />
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => { if (!v) trackEvent.chatInteraction('open'); return !v; })}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full p-3.5 shadow-lg transition-all duration-300 group-hover:scale-110 cursor-pointer"
            aria-label="Abrir asistente IA"
            aria-expanded={open}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 right-4 md:right-20 z-40 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[640px] flex flex-col bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
          role="dialog"
          aria-label="Asistente IA de Escapes y Más"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card">
            <div>
              <p className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
                {live ? 'Chat con un asesor' : 'Asistente IA'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                {live ? (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${live.status === 'open' ? 'bg-emerald-500' : live.status === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground'}`} />
                    {live.status === 'waiting' ? (live.offline ? 'Mensaje enviado al equipo' : 'Avisando a un asesor…') : live.status === 'open' ? live.agentName : 'Conversación cerrada'}
                  </>
                ) : isAuthenticated ? `Hola${user?.firstName ? `, ${user.firstName}` : ''} · Recambios, pedidos y envíos` : 'Recambios, pedidos y envíos'}
              </p>
            </div>
            <div className="flex gap-2">
              {liveActive && (
                <button
                  onClick={endLive}
                  className="text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground px-2"
                  aria-label="Terminar la conversación con el asesor"
                >
                  Finalizar
                </button>
              )}
              {!live && messages.length > 0 && (
                <button
                  onClick={reset}
                  className="text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground px-2"
                  aria-label="Nueva conversación"
                >
                  Nueva
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {!isAuthenticated && (
              <div className="space-y-3 text-sm">
                <p className="text-foreground">
                  Te ayudo a encontrar recambios compatibles con tu moto, a seguir tus pedidos y con envíos o devoluciones.
                </p>
                <p className="text-xs text-muted-foreground">
                  Inicia sesión para usar el asistente: así puedo consultar tus pedidos y las motos de tu garaje.
                </p>
                <Link
                  href="/login?tab=login"
                  onClick={() => setOpen(false)}
                  className="block text-center px-3 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-mono uppercase font-bold"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Crear una cuenta
                </Link>
              </div>
            )}
            {live && (
              <div className="space-y-2.5">
                {liveMessages.map((m) => (
                  m.sender === 'system' ? (
                    <p key={m.id} className="text-[11px] text-center text-muted-foreground px-4">{m.content}</p>
                  ) : (
                    m.kind === 'product' && m.payload ? (
                      <div key={m.id} className="space-y-1">
                        <p className="text-[9px] font-mono uppercase tracking-wider text-accent">{live.agentName} te recomienda</p>
                        <ProductCardMessage product={m.payload} onAddToCart={handleAddToCart} onView={handleViewProduct} />
                      </div>
                    ) : m.kind === 'order' && m.payload ? (
                      <div key={m.id}><OrderCard order={m.payload} /></div>
                    ) : m.kind === 'image' && m.payload?.url ? (
                      <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%] space-y-1">
                          <button type="button" onClick={() => setImageView(m.payload.url)} className="block cursor-zoom-in" aria-label="Ampliar imagen">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.payload.url} alt={m.content || (m.sender === 'customer' ? 'Tu foto' : 'Imagen del asesor')} className="rounded-xl border border-card-border max-h-64 object-contain bg-background" loading="lazy" />
                          </button>
                          {m.content && <p className="text-xs px-1">{m.content}</p>}
                        </div>
                      </div>
                    ) : (
                    <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm break-words ${
                        m.sender === 'customer'
                          ? 'bg-accent text-accent-foreground rounded-br-sm whitespace-pre-wrap'
                          : m.sender === 'agent'
                            ? 'bg-card border-2 border-accent/60 text-foreground rounded-bl-sm whitespace-pre-wrap'
                            : 'bg-card border border-card-border text-muted-foreground rounded-bl-sm'
                      }`}>
                        {m.sender !== 'customer' && (
                          <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5 text-accent">
                            {m.sender === 'agent' ? live.agentName : 'Asistente IA'}
                          </p>
                        )}
                        {m.sender === 'ai' ? <ChatText text={m.content} /> : m.content}
                      </div>
                    </div>
                    )
                  )
                ))}
                {(() => {
                  // «Visto» bajo tu último mensaje cuando el asesor lo ha leído.
                  const lastMine = [...liveMessages].reverse().find((m) => m.sender === 'customer');
                  return lastMine && (live.agentReadId || 0) >= lastMine.id && live.status !== 'waiting'
                    ? <p className="text-[10px] text-right text-muted-foreground -mt-1.5">Visto</p> : null;
                })()}
                {live.agentTyping && liveActive && (
                  <p className="text-[11px] text-muted-foreground italic">{live.agentName} está escribiendo…</p>
                )}
                {live.status === 'waiting' && (
                  <div className="text-xs bg-accent/10 border border-accent/30 rounded-xl p-3 text-foreground">
                    {live.offline
                      ? 'Mensaje recibido. Te responderemos en cuanto un asesor se conecte y te avisaremos con una notificación y por email.'
                      : !live.queuePosition || live.queuePosition <= 1
                        ? 'Eres el siguiente: un asesor te atenderá enseguida.'
                        : `Hay ${live.queuePosition - 1} persona${live.queuePosition - 1 === 1 ? '' : 's'} delante de ti. Te atenderemos en cuanto un asesor quede libre.`}
                  </div>
                )}
                {live.status === 'closed' && !live.rated && live.closedBy !== 'auto' && (
                  ratingSent ? (
                    <p className="text-xs text-center text-muted-foreground">¡Gracias por tu valoración!</p>
                  ) : (
                    <div className="text-xs bg-card border border-card-border rounded-xl p-3 space-y-2 text-center">
                      <p className="text-foreground font-bold">¿Qué tal te hemos atendido?</p>
                      <div className="flex justify-center gap-1" role="radiogroup" aria-label="Valoración">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
                            className={`text-2xl leading-none ${n <= rating ? 'text-accent' : 'text-muted-foreground/40'}`}>★</button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <>
                          <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} rows={2} maxLength={500}
                            placeholder="Cuéntanos algo más (opcional)"
                            className="w-full px-2 py-1.5 text-xs bg-background border border-card-border rounded-lg resize-none" />
                          <button type="button" onClick={submitRating} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-mono uppercase font-bold text-[10px]">
                            Enviar valoración
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}
                {liveActive && pushState === 'default' && (
                  <div className="text-xs bg-card border border-card-border rounded-xl p-3 space-y-2">
                    <p className="text-foreground font-bold">¿Te avisamos cuando te respondamos, aunque cierres la web?</p>
                    <p className="text-muted-foreground">
                      Solo usaremos las notificaciones para la atención de tu asesor: sus respuestas y el pedido que te prepare.
                      Nunca te enviaremos publicidad por este medio.
                    </p>
                    <div className="flex items-center gap-3">
                      <button onClick={activatePush} className="px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground font-mono uppercase font-bold text-[10px]">
                        Activar avisos
                      </button>
                      <a href="/politica-privacidad#chat" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground underline">Más información</a>
                    </div>
                  </div>
                )}
                {live.status === 'closed' && (
                  <button
                    onClick={backToAssistant}
                    className="block mx-auto text-xs px-3 py-2 rounded-lg bg-card border border-card-border hover:border-accent hover:text-accent transition-colors"
                  >
                    Volver al asistente IA
                  </button>
                )}
              </div>
            )}
            {!live && isAuthenticated && messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Estoy aquí para ayudarte con catálogo, pedidos y soporte de la web.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-card border border-card-border hover:border-accent hover:text-accent transition-colors"
                    disabled={streaming}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!live && messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] ${
                    m.role === 'user'
                      ? 'px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words bg-accent text-accent-foreground rounded-br-sm'
                      : 'rounded-2xl text-sm rounded-bl-sm space-y-2'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <>
                      {!m.content && streaming && i === messages.length - 1 && (
                        <div className="px-3 py-2 bg-card border border-card-border rounded-2xl inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                      {m.content && (
                        <div className="px-3 py-2 bg-card border border-card-border text-foreground break-words rounded-2xl">
                          <ChatText text={m.content} />
                        </div>
                      )}
                      {productsByMessage[i] && productsByMessage[i].length > 0 && (
                        <div className="space-y-2 pt-1">
                          {productsByMessage[i].map((p) => (
                            <ProductCardMessage
                              key={`${p.id}-${p.sku}`}
                              product={p}
                              onAddToCart={handleAddToCart}
                              onView={handleViewProduct}
                            />
                          ))}
                        </div>
                      )}
                      {offer?.index === i && !streaming && (
                        <button
                          onClick={() => startHandoff(offer.kind === 'message')}
                          disabled={handoffBusy}
                          className="w-full mt-1 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-mono uppercase font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                          {handoffBusy ? 'Un momento…' : offer.kind === 'message' ? 'Dejar un mensaje al equipo' : 'Hablar con un asesor'}
                        </button>
                      )}
                    </>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {isAuthenticated && !(live && !liveActive) && <form onSubmit={handleSubmit} className="p-3 border-t border-card-border bg-card">
            <div className="flex gap-2">
              {liveActive && (
                <>
                  <button type="button" onClick={() => photoRef.current?.click()} disabled={photoBusy}
                    className="px-2.5 py-2 border border-card-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label="Enviar una foto" title="Enviar una foto (de tu moto, la pieza…)">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) sendPhoto(f); e.target.value = ''; }} />
                </>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // «Escribiendo…» para el asesor, como mucho cada 3 s.
                  if (liveActive && Date.now() - lastTypingRef.current > 3000) {
                    lastTypingRef.current = Date.now();
                    sendLiveTyping();
                  }
                }}
                placeholder={photoBusy ? 'Enviando foto…' : liveActive ? 'Escribe al asesor…' : 'Escribe tu pregunta…'}
                disabled={streaming}
                className="flex-1 px-3 py-2 text-sm bg-background border border-card-border rounded-lg focus:outline-none focus:border-accent disabled:opacity-50"
                maxLength={500}
                aria-label="Mensaje"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="px-3 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-mono uppercase font-bold disabled:opacity-50"
                aria-label="Enviar"
              >
                Enviar
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
              {liveActive ? 'Hablas con una persona del equipo de Escapes y Más.' : 'Solo responde sobre catálogo, pedidos y soporte web.'}
            </p>
          </form>}
        </div>
      )}
      {imageView && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-label="Imagen ampliada"
          onClick={() => setImageView(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageView} alt="Imagen ampliada" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            onClick={() => setImageView(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white text-xl flex items-center justify-center"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
