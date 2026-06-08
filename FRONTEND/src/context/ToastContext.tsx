'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastProgress({ duration }: { duration: number }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        setRemaining(0);
        clearInterval(interval);
      } else {
        setRemaining(duration - elapsed);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50">
      <div
        className="h-full bg-accent/60 rounded-full transition-all duration-100 ease-linear"
        style={{ width: `${(remaining / duration) * 100}%` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((prev) => {
      const el = document.getElementById(`toast-${id}`);
      if (el) {
        el.classList.add('opacity-0', 'translate-x-full');
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = 'toast_' + crypto.randomUUID();
    const full: Toast = { ...toast, id };

    setToasts((prev) => [...prev, full]);

    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    timersRef.current.set(id, timer);

    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}

      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            id={`toast-${toast.id}`}
            key={toast.id}
            className="pointer-events-auto font-sans text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-black/50 flex items-center gap-3 min-w-[280px] max-w-[400px] overflow-hidden transition-all duration-300 ease-out"
            style={{
              transform: `translateX(${index === 0 ? '0' : `${index * 8}px`})`,
              opacity: 1 - index * 0.08,
              zIndex: 50 - index,
            }}
          >
            <div className={`w-full h-full absolute inset-0 ${
              toast.type === 'error' ? 'bg-red-900/90 border border-red-700/50' :
              toast.type === 'info' ? 'bg-slate-900/95 border border-slate-700/50' :
              'bg-slate-900/95 border border-accent/20'
            }`} />
            <div className="relative z-10 flex items-center gap-3 px-5 py-3 w-full">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'error' ? 'bg-red-500 animate-pulse' :
                toast.type === 'info' ? 'bg-blue-400' :
                'bg-accent'
              }`} />
              <span className="flex-1 text-white">{toast.message}</span>
              {toast.action && (
                <button
                  onClick={() => { toast.action!.onClick(); dismissToast(toast.id); }}
                  className="bg-accent text-slate-950 font-mono font-bold uppercase text-[10px] px-3 py-1.5 rounded hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer text-sm leading-none shrink-0"
              >
                &times;
              </button>
            </div>
            <ToastProgress duration={toast.duration ?? 4000} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
