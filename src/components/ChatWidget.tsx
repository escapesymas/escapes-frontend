'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { sendChatMessage, type ChatMessage, type ChatProduct } from '../lib/chatApi';
import { trackEvent } from '../lib/analytics';
import ProductCardMessage from './chat/ProductCardMessage';

const SUGGESTIONS = [
  '¿Tenéis escapes Akrapovic?',
  'Busco recambios para mi moto',
  '¿Cómo va mi pedido?',
  '¿Cuál es la garantía?',
];

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, productsByMessage]);

  useEffect(() => {
    const handleExpired = () => setOpen(false);
    window.addEventListener('session-expired', handleExpired);
    return () => window.removeEventListener('session-expired', handleExpired);
  }, []);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || streaming) return;

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
    showToast({ message: 'Producto añadido al carrito', type: 'success' });
  };

  const handleViewProduct = (product: ChatProduct) => {
    const url = `/producto/${product.slug || product.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        className="fixed bottom-28 right-4 md:bottom-6 md:right-20 z-40 group"
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
                💬 Sugerencia para tu {proactiveBike.split(' ').slice(0, 2).join(' ')}
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
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse pointer-events-none" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
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
          className="fixed bottom-36 md:bottom-24 right-4 md:right-20 z-40 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[640px] flex flex-col bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
          role="dialog"
          aria-label="Asistente IA de Escapes y Más"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card">
            <div>
              <p className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
                Asistente IA
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Hola{user?.firstName ? `, ${user.firstName}` : ''} · Pregunta sobre catálogo
              </p>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
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
            {messages.length === 0 && (
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
            {messages.map((m, i) => (
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
                        <div className="px-3 py-2 bg-card border border-card-border text-foreground whitespace-pre-wrap break-words rounded-2xl">
                          {m.content}
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

          <form onSubmit={handleSubmit} className="p-3 border-t border-card-border bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta…"
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
              Solo responde sobre catálogo, pedidos y soporte web.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
