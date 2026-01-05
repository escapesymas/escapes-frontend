import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Wrench, Loader2, User, Sparkles } from 'lucide-react';
import { sendMessageToMechanic, ChatMessage } from '../services/ai';

export const AIAdvisor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '¡Gas a fondo! Soy tu mecánico virtual. ¿En qué puedo ayudarte a mejorar tu moto hoy?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue(''); // Clear input immediately
    
    // Add user message
    const newHistory = [...messages, { role: 'user', text: userText } as ChatMessage];
    setMessages(newHistory);
    setIsTyping(true);

    // Call API
    // We filter the history to pass only previous context to the service function logic
    // (though our service implementation recreates the chat, passing full history is good practice)
    const aiResponseText = await sendMessageToMechanic(messages, userText);

    setMessages(prev => [...prev, { role: 'model', text: aiResponseText }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[90vw] md:w-96 h-[500px] max-h-[80vh] bg-zinc-950 border border-zinc-700 shadow-2xl rounded-sm overflow-hidden flex flex-col animate-fade-in-up">
          {/* Header */}
          <div className="bg-racing-carbon p-4 border-b border-zinc-700 flex justify-between items-center relative overflow-hidden">
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-racing-orange/10 blur-xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 z-10">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600">
                <Bot className="w-6 h-6 text-racing-orange" />
              </div>
              <div>
                <span className="font-bold text-white text-sm uppercase tracking-wide block">Mecánico IA</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-zinc-400 uppercase">En Línea • Gemini 2.5</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950 scroll-smooth custom-scrollbar">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  msg.role === 'user' ? 'bg-zinc-800 border-zinc-700' : 'bg-racing-orange/10 border-racing-orange/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Wrench className="w-4 h-4 text-racing-orange" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] p-3 rounded-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800 shadow-sm'
                }`}>
                   {/* Simple Markdown rendering for bold text */}
                   {msg.text.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
                   )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-racing-orange/10 border border-racing-orange/30 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-racing-orange animate-spin" />
                </div>
                <div className="bg-zinc-900 p-3 rounded-sm border border-zinc-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregunta sobre piezas, mecánica..." 
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-racing-orange transition-colors placeholder-zinc-600"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="bg-racing-orange disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-sm text-white hover:bg-orange-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-16 h-16 bg-racing-orange text-white rounded-full shadow-lg shadow-orange-900/40 hover:bg-white hover:text-racing-orange transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-racing-orange"
      >
        {isOpen ? <X className="w-8 h-8" /> : <Sparkles className="w-8 h-8 animate-pulse" />}
        
        {/* Tooltip Label */}
        {!isOpen && (
          <span className="absolute right-20 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl">
            Mecánico IA
            {/* Arrow */}
            <span className="absolute top-1/2 -right-1.5 w-3 h-3 bg-zinc-900 border-t border-r border-zinc-700 transform rotate-45 -translate-y-1/2"></span>
          </span>
        )}
      </button>
    </div>
  );
};
