
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, ExternalLink, Package } from 'lucide-react';
import { Product } from '../types';
import { fetchProducts } from '../services/woocommerce';
import { optimizeImage } from '../utils/imageOptimizer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productRefs?: string[];
  products?: Product[];
}

interface AIAdvisorProps {
  onProductClick?: (product: Product) => void;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ onProductClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asesor de recambios de Escapes y Más. ¿En qué puedo ayudarte? Cuéntame tu moto (marca, modelo, año) y qué pieza necesitas.'
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
      // Search for products matching the SKUs
      const allProducts: Product[] = [];
      for (const sku of skus) {
        const { products } = await fetchProducts(sku, undefined, 1, 5);
        const matches = products.filter(p =>
          p.sku?.toLowerCase().includes(sku.toLowerCase()) ||
          p.title?.toLowerCase().includes(sku.toLowerCase())
        );
        allProducts.push(...matches);
      }
      // Remove duplicates
      const unique = allProducts.filter((p, i, arr) =>
        arr.findIndex(x => x.id === p.id) === i
      );
      return unique.slice(0, 3); // Max 3 products
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

      // IMPROVED SEARCH STRATEGY:
      // We break down the message into keywords to find broader matches
      // and let Gemini's "internet knowledge" do the filtering
      let productContext = '';
      try {
        const keywords = userMessage.content
          .toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
          .split(' ')
          .filter(word => word.length > 2);

        // We take the 2 most important words (usually Part Name + Bike Model)
        const searchQuery = keywords.slice(0, 3).join(' ');

        const { products: searchResults } = await fetchProducts(searchQuery, undefined, 1, 20);

        if (searchResults.length > 0) {
          productContext = searchResults.map(p =>
            `- [${p.sku}] ${p.title} | Precio: ${p.price}€ | Stock: ${p.inStock ? 'SÍ' : 'disponible bajo pedido'}`
          ).join('\n');
        }
      } catch (err) {
        console.error('[AI] Context search error:', err);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: history,
          productContext: productContext
        })
      });

      const data = await response.json();

      if (data.success) {
        // Find products if there are refs
        let products: Product[] = [];
        if (data.productRefs && data.productRefs.length > 0) {
          products = await findProductsBySku(data.productRefs);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          productRefs: data.productRefs,
          products: products
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
              <h3 className="text-white font-bold text-sm">Asesor de Recambios</h3>
              <p className="text-zinc-500 text-xs">Escapes y Más • Online</p>
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
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${message.role === 'user'
                      ? 'bg-racing-orange text-white'
                      : 'bg-zinc-800 text-zinc-200'
                      }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {/* Product Cards */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2 ml-10">
                      {message.products.map(product => (
                        <div
                          key={product.id}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 hover:border-racing-orange transition-colors cursor-pointer"
                          onClick={() => onProductClick?.(product)}
                        >
                          <div className="flex gap-3">
                            <img
                              src={optimizeImage(product.image, { width: 80 })}
                              alt={product.title}
                              className="w-16 h-16 object-contain bg-white rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-bold truncate">{product.title}</p>
                              <p className="text-zinc-500 text-[10px] uppercase">REF: {product.sku}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-racing-orange font-bold text-sm">{formatPrice(product.price)}</span>
                                {product.inStock ? (
                                  <span className="text-green-500 text-[10px] flex items-center gap-1">
                                    <Package className="w-3 h-3" /> En stock
                                  </span>
                                ) : (
                                  <span className="text-red-500 text-[10px]">Sin stock</span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 text-racing-orange animate-spin" />
                  <span className="text-zinc-400 text-sm">Pensando...</span>
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