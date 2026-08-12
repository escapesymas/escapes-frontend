'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId: number;
}

export default function NotifyMeModal({ isOpen, onClose, productName, productId }: NotifyMeModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Introduce tu correo electrónico');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Correo electrónico no válido');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/stock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), productId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error al guardar la notificación');
      } else {
        setDone(true);
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-md shadow-xl w-full max-w-sm relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded hover:bg-icon-box/40 transition-colors cursor-pointer text-text-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <div>
              <h3 className="font-mono text-sm font-bold uppercase text-foreground mb-1">¡Te avisaremos!</h3>
              <p className="text-[10px] font-mono text-text-muted">
                Te enviaremos un correo a <strong className="text-foreground">{email}</strong> cuando este producto vuelva a estar disponible.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase hover:bg-accent-hover transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="font-mono text-sm font-bold uppercase text-foreground mb-1">Avísame cuando vuelva</h3>
            <p className="text-[10px] font-mono text-text-muted mb-4 leading-relaxed">
              {productName}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-mono font-bold uppercase text-text-muted block mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 bg-select-bg border border-card-border rounded text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-red-400 text-[9px] font-mono">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2.5 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  'Notificarme'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
