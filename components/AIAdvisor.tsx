
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User as UserIcon, ExternalLink, Package, ShoppingCart, Truck, LogIn, CheckCircle, AlertCircle } from 'lucide-react';
import { Product, User } from '../types';
import { makeRequest } from '../services/woocommerce';
import { optimizeImage } from '../utils/imageOptimizer';

interface PedidoProduct {
  referencia: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rawContent?: string;
  productRefs?: string[];
  pedidoRefs?: string[];
  products?: Product[];
  pedidoProducts?: PedidoProduct[];
}

interface AIAdvisorProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  user?: User | null;
  onLoginRequest?: () => void;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ onProductClick, onAddToCart, user, onLoginRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sendingPedido, setSendingPedido] = useState<string | null>(null); // referencia being sent
  const [pedidoStatus, setPedidoStatus] = useState<Record<string, 'success' | 'error'>>({}); // track results
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! 👋 Soy Uri, tu asesor de recambios. Dime tu moto (marca, modelo, año) y qué pieza necesitas.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findProductsBySku = async (skus: string[]): Promise<Product[]> => {
    if (skus.length === 0) return [];

    try {
      const allProducts: Product[] = [];
      const seenIds = new Set<number>();

      // Fetch each SKU with exact match via WooCommerce API
      for (const sku of skus) {
        try {
          const { data } = await makeRequest(`/wc/v3/products?sku=${encodeURIComponent(sku)}&status=publish&per_page=1`);
          const results = data as any[];
          for (const p of results) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              allProducts.push({
                id: p.id,
                title: p.name,
                price: parseFloat(p.price || p.regular_price || '0'),
                regularPrice: parseFloat(p.regular_price || p.price || '0'),
                sku: p.sku || `REF-${p.id}`,
                image: p.images?.length > 0 ? p.images[0].src : '',
                images: p.images || [],
                inStock: p.stock_status === 'instock',
                category: p.categories?.length > 0 ? p.categories[0].name : 'General',
                categorySlug: p.categories?.length > 0 ? p.categories[0].slug : 'recambios',
                categoryId: p.categories?.length > 0 ? p.categories[0].id : 0,
                permalink: p.permalink,
                attributes: (p.attributes || []).map((attr: any) => ({ name: attr.name, options: attr.options })),
                description: p.description,
                shortDescription: p.short_description
              });
            }
          }
        } catch (err) {
          console.warn('[AI] SKU lookup failed for:', sku, err);
        }
      }

      return allProducts;
    } catch (error) {
      console.error('[AI] Error searching products:', error);
      return [];
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: history
        })
      });

      const data = await response.json();

      if (data.success) {
        // Find store products if there are refs
        let products: Product[] = [];
        if (data.productRefs && data.productRefs.length > 0) {
          products = await findProductsBySku(data.productRefs);
        }

        // Build pedido products list
        const pedidoProducts: PedidoProduct[] = (data.pedidoRefs || []).map((ref: string) => ({ referencia: ref }));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          rawContent: data.rawResponse,
          productRefs: data.productRefs,
          pedidoRefs: data.pedidoRefs,
          products: products,
          pedidoProducts: pedidoProducts
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.'
        }]);
      }
    } catch (error) {
      console.error('[AI] Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.'
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  // Render message content with inline product cards
  const renderMessageContent = (message: Message) => {
    // For user messages or messages without product refs, just show text
    if (message.role === 'user' || (!message.products?.length && !message.pedidoProducts?.length)) {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }

    // Build a product map by SKU for quick lookup
    const productMap = new Map<string, Product>();
    for (const p of (message.products || [])) {
      if (p.sku) productMap.set(p.sku.toUpperCase(), p);
    }

    // Use rawContent to split text around [REF:SKU] and [PEDIDO:REF] tags
    const raw = message.rawContent || message.content;
    const segments: React.ReactNode[] = [];
    const tagPattern = /\[(REF|PEDIDO):([^\]]+)\]/g;
    let lastIndex = 0;
    let matchResult;
    let segIndex = 0;

    while ((matchResult = tagPattern.exec(raw)) !== null) {
      // Add text before the tag
      if (matchResult.index > lastIndex) {
        const textBefore = raw.substring(lastIndex, matchResult.index).trim();
        if (textBefore) {
          segments.push(<p key={`t-${segIndex++}`} className="text-sm whitespace-pre-wrap">{textBefore}</p>);
        }
      }

      const tagType = matchResult[1]; // REF or PEDIDO
      const tagValue = matchResult[2]; // SKU or Bihr reference

      if (tagType === 'REF') {
        const product = productMap.get(tagValue.toUpperCase());
        if (product) {
          segments.push(renderProductCard(product, segIndex++));
        }
      } else if (tagType === 'PEDIDO') {
        segments.push(renderPedidoCard(tagValue, segIndex++));
      }

      lastIndex = matchResult.index + matchResult[0].length;
    }

    // Add remaining text after last tag
    if (lastIndex < raw.length) {
      const remaining = raw.substring(lastIndex).trim();
      if (remaining) {
        segments.push(<p key={`t-${segIndex++}`} className="text-sm whitespace-pre-wrap">{remaining}</p>);
      }
    }

    // Fallback if no segments were produced
    if (segments.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }

    return <div className="space-y-2">{segments}</div>;
  };

  // Render a product card for Nivel 1 (tienda online)
  const renderProductCard = (product: Product, key: number) => (
    <div
      key={`card-${key}`}
      className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 hover:border-racing-orange transition-all duration-200 my-2"
    >
      <div className="flex gap-3">
        <img
          src={optimizeImage(product.image, { width: 80 })}
          alt={product.title}
          className="w-16 h-16 object-contain bg-white rounded cursor-pointer flex-shrink-0"
          onClick={() => onProductClick?.(product)}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-white text-xs font-bold line-clamp-2 cursor-pointer hover:text-racing-orange transition-colors"
            onClick={() => onProductClick?.(product)}
          >
            {product.title}
          </p>
          <p className="text-zinc-500 text-[10px] uppercase mt-0.5">REF: {product.sku}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-racing-orange font-bold text-sm">{formatPrice(product.price)}</span>
            {product.inStock ? (
              <span className="text-green-500 text-[10px] flex items-center gap-1">
                <Package className="w-3 h-3" /> En stock
              </span>
            ) : (
              <span className="text-yellow-500 text-[10px]">Bajo pedido</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart?.(product);
        }}
        className="w-full mt-2 bg-racing-orange hover:bg-orange-600 text-white text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        Añadir al Carrito
      </button>
    </div>
  );

  // Handle pedido request via email/API
  const handlePedidoRequest = async (referencia: string) => {
    if (!user) {
      onLoginRequest?.();
      return;
    }

    setSendingPedido(referencia);
    try {
      const response = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          userEmail: user.email,
          userId: user.id,
          mensaje: `Solicitud desde el asesor Uri`
        })
      });

      const data = await response.json();
      if (data.success) {
        setPedidoStatus(prev => ({ ...prev, [referencia]: 'success' }));
      } else {
        setPedidoStatus(prev => ({ ...prev, [referencia]: 'error' }));
      }
    } catch (error) {
      console.error('[PEDIDO] Error:', error);
      setPedidoStatus(prev => ({ ...prev, [referencia]: 'error' }));
    }
    setSendingPedido(null);
  };

  // Render a card for Nivel 2 (catálogo Bihr — bajo pedido)
  const renderPedidoCard = (referencia: string, key: number) => {
    const status = pedidoStatus[referencia];
    const isSending = sendingPedido === referencia;

    return (
      <div
        key={`pedido-${key}`}
        className="bg-zinc-800/80 border border-yellow-600/40 rounded-lg p-3 my-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-600/20 rounded flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-yellow-500 text-[10px] font-bold uppercase">Bajo Pedido — Catálogo Bihr</p>
            <p className="text-white text-xs">Ref: {referencia}</p>
            <p className="text-zinc-400 text-[10px] mt-0.5">Plazo: 2-5 días laborables</p>
          </div>
        </div>

        {/* Status: already sent */}
        {status === 'success' && (
          <div className="w-full mt-2 bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Solicitud enviada — Te contactaremos por email
          </div>
        )}

        {status === 'error' && (
          <div className="mt-2 space-y-1">
            <div className="w-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs py-2 px-3 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Error al enviar. Inténtalo de nuevo.
            </div>
            <button
              onClick={() => handlePedidoRequest(referencia)}
              className="w-full bg-racing-orange hover:bg-orange-600 text-white text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Not yet sent */}
        {!status && (
          user ? (
            <button
              onClick={() => handlePedidoRequest(referencia)}
              disabled={isSending}
              className="w-full mt-2 bg-racing-orange hover:bg-orange-600 disabled:bg-zinc-700 text-white text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando solicitud...</>
              ) : (
                <><Send className="w-4 h-4" /> Solicitar Pedido</>
              )}
            </button>
          ) : (
            <button
              onClick={() => onLoginRequest?.()}
              className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Inicia sesión para solicitar
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen
          ? 'bg-zinc-800 hover:bg-zinc-700'
          : 'bg-racing-orange hover:bg-orange-600 animate-pulse'
          }`}
        aria-label="Abrir asesor de recambios"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-racing-carbon border-b border-zinc-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-racing-orange rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Uri</h3>
              <p className="text-zinc-500 text-xs">Asesor de Recambios • Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-zinc-700' : 'bg-racing-orange'
                      }`}>
                      {message.role === 'user' ? (
                        <UserIcon className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${message.role === 'user'
                      ? 'bg-racing-orange text-white'
                      : 'bg-zinc-800 text-zinc-200'
                      }`}>
                      {renderMessageContent(message)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 text-racing-orange animate-spin" />
                  <span className="text-zinc-400 text-sm">Escribiendo...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-racing-orange"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-racing-orange hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};