'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';

const STORAGE_KEY = 'cookie_consent';
type ConsentAction = 'accept_all' | 'reject_all' | 'custom';
type ConsentValue = 'accepted' | 'rejected' | string;

interface ConsentState {
  action: ConsentAction;
  preferences: Record<string, ConsentValue>;
  ts: string;
}

const CATEGORIES = [
  { id: 'necessary', label: 'Necesarias', desc: 'Carrito, sesión y seguridad. Siempre activas.', locked: true },
  { id: 'analytics', label: 'Analítica', desc: 'Mejoramos el sitio midiendo uso agregado.', locked: false },
  { id: 'marketing', label: 'Marketing', desc: 'Medir campañas publicitarias y evitar spam.', locked: false },
];

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, ConsentValue>>({
    necessary: 'accepted',
    analytics: 'rejected',
    marketing: 'rejected',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      } else {
        const parsed: ConsentState = JSON.parse(stored);
        if (parsed?.preferences) setPrefs(parsed.preferences);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (action: ConsentAction, preferences = prefs) => {
    try {
      const state: ConsentState = { action, preferences, ts: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      try {
        const evt = new CustomEvent('cookie_consent_update', { detail: state });
        window.dispatchEvent(evt);
      } catch {}
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-card-border shadow-2xl p-3 md:p-5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5 hidden md:block" aria-hidden="true" />
          <div className="flex-1 text-xs font-sans text-foreground/85 leading-relaxed">
            <p className="font-bold text-foreground mb-1 text-sm">Tu privacidad importa</p>
            <p>
              Usamos cookies para que el sitio funcione y, si lo autorizas, para entender cómo lo usas y mejorar la experiencia. Lee nuestra{' '}
              <Link href="/politica-cookies" className="text-accent hover:underline font-bold">
                política de cookies
              </Link>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 p-1.5 text-text-muted hover:text-foreground rounded-full hover:bg-icon-box transition-colors"
            aria-expanded={expanded}
            aria-label={expanded ? 'Ocultar opciones' : 'Configurar cookies'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="bg-card border border-card-border rounded p-3 space-y-2 animate-fade-in">
            {CATEGORIES.map(cat => (
              <label
                key={cat.id}
                className={`flex items-start gap-3 p-2 rounded ${cat.locked ? 'opacity-60' : 'cursor-pointer hover:bg-icon-box transition-colors'}`}
              >
                <input
                  type="checkbox"
                  checked={prefs[cat.id] === 'accepted'}
                  disabled={cat.locked}
                  onChange={(e) =>
                    setPrefs(p => ({ ...p, [cat.id]: e.target.checked ? 'accepted' : 'rejected' }))
                  }
                  className="mt-1 w-4 h-4 accent-accent"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-foreground">{cat.label}{cat.locked ? ' · siempre activas' : ''}</div>
                  <div className="text-[11px] text-text-muted leading-snug">{cat.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => save('reject_all')}
            className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold rounded border border-card-border text-foreground hover:bg-icon-box transition-colors min-h-[40px]"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => {
              const allAccepted = Object.fromEntries(
                Object.keys(prefs).map(k => [k, 'accepted' as ConsentValue])
              );
              allAccepted.necessary = 'accepted';
              save('accept_all', allAccepted);
            }}
            className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold rounded bg-accent text-slate-950 hover:opacity-90 transition-opacity min-h-[40px]"
          >
            Aceptar todas
          </button>
          {expanded && (
            <button
              type="button"
              onClick={() => save('custom')}
              className="flex-1 px-3 py-2 text-xs font-mono uppercase font-bold rounded border border-accent text-accent hover:bg-accent/10 transition-colors min-h-[40px]"
            >
              Guardar selección
            </button>
          )}
        </div>
      </div>
    </div>
  );
}