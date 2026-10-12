'use client';

import { useState } from 'react';
import { Bell, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../lib/constants';
import { useAuth } from '../context/AuthContext';

interface MotoAlertButtonProps {
  bike: string;
  /** `primary`: botón grande (sin recambios); `card`: recuadro al final del listado. */
  variant?: 'primary' | 'card';
}

/**
 * «Avísame cuando haya piezas para mi moto»: con sesión basta un clic (usa el
 * correo de la cuenta); sin sesión pide el correo. El backend manda un correo
 * de confirmación y, después de cada actualización del catálogo, las novedades.
 */
export default function MotoAlertButton({ bike, variant = 'primary' }: MotoAlertButtonProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!isAuthenticated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Correo electrónico no válido');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await apiRequest('/moto-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bike, email: isAuthenticated ? undefined : email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'No se pudo guardar el aviso');
      else setDone(data.email || email.trim());
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const start = () => (isAuthenticated ? submit() : setOpen(true));

  if (done) {
    return (
      <div className={`flex items-start gap-2 text-left ${variant === 'card' ? 'p-4 bg-card border border-card-border rounded-md' : 'max-w-[320px] mx-auto'}`}>
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-text-muted">
          Listo: te escribiremos a <strong className="text-foreground">{done}</strong> cuando lleguen piezas nuevas para tu {bike}.
        </p>
      </div>
    );
  }

  const form = open && (
    <div className="w-full max-w-[320px] flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="tu@email.com"
          aria-label="Correo electrónico"
          autoFocus
          className="flex-1 min-w-0 px-3 py-2 bg-select-bg border border-card-border rounded text-xs font-mono text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="px-3 py-2 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase hover:bg-accent-hover disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Avisarme'}
        </button>
      </div>
      <p className="text-[9px] font-mono text-text-muted text-left">Solo te escribiremos con piezas nuevas para esta moto. Puedes darte de baja en cada correo.</p>
    </div>
  );

  const errorLine = error && (
    <p className="flex items-center gap-1.5 text-red-400 text-[9px] font-mono"><AlertCircle className="w-3 h-3" />{error}</p>
  );

  if (variant === 'card') {
    return (
      <div className="p-4 bg-card border border-card-border rounded-md flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-3 text-left">
          <Bell className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-mono font-bold uppercase text-foreground">¿Te avisamos de las novedades?</p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">Te escribimos cuando lleguen piezas nuevas para tu {bike}.</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          {form || (
            <button
              type="button"
              onClick={start}
              disabled={sending}
              className="px-4 py-2 text-xs font-mono uppercase font-bold rounded border border-accent text-accent hover:bg-accent/10 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} Avísame
            </button>
          )}
          {errorLine}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {form || (
        <button
          type="button"
          onClick={start}
          disabled={sending}
          className="px-4 py-2.5 text-xs font-mono uppercase font-bold rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} Avísame cuando haya piezas
        </button>
      )}
      {errorLine}
    </div>
  );
}
