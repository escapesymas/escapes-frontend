'use client';

import { useId, useState } from 'react';

export interface AdvisorAccountCardProps {
  /** Qué quería hacer: hablar con un asesor o dejar un mensaje (si no hay asesores conectados). */
  kind: 'advisor' | 'message';
  /** Crea la cuenta (queda pendiente de confirmar el correo). Lanza el error con el texto que se enseña. */
  onRegister: (firstName: string, email: string, password: string) => Promise<{ email: string; emailSent: boolean }>;
  /** Entra con el correo o el usuario. Si la cuenta no está confirmada lanza un error con `code: 'email_not_verified'`. */
  onLogin: (identifier: string, password: string) => Promise<void>;
  /** Pide otro correo de confirmación; devuelve el texto que se enseña. */
  onResend: (email: string) => Promise<string>;
  /** «Ahora no»: el cliente prefiere seguir con el asistente. */
  onClose: () => void;
}

type Tab = 'register' | 'login';
const MIN_PASSWORD = 8;
const FIELD = 'w-full rounded-lg border border-card-border bg-background px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none';
const LABEL = 'block text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-1';

const errorText = (e: unknown, fallback: string): string => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Cuenta para hablar con un asesor, dentro del propio chat: un invitado crea la cuenta (o entra con la que ya tiene) sin salir de
 * la conversación. Crear la cuenta exige confirmar el correo (el enlace del correo vuelve al chat y retoma la petición).
 */
export default function AdvisorAccountCard({ kind, onRegister, onLogin, onResend, onClose }: AdvisorAccountCardProps) {
  const uid = useId();
  const [tab, setTab] = useState<Tab>('register');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** Correo al que se ha mandado la confirmación (tras crear la cuenta o al intentar entrar con una sin confirmar). */
  const [sentTo, setSentTo] = useState<{ email: string; emailSent: boolean; fromLogin: boolean } | null>(null);
  const [resend, setResend] = useState<{ state: 'idle' | 'sending' | 'sent'; msg: string }>({ state: 'idle', msg: '' });

  const goal = kind === 'message' ? 'dejar un mensaje al equipo' : 'hablar con un asesor';

  const switchTab = (t: Tab) => { setTab(t); setError(''); };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || !password) { setError('Completa tu nombre, tu correo y una contraseña.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError('Escribe un correo válido.'); return; }
    if (password.length < MIN_PASSWORD) { setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`); return; }
    setBusy(true);
    setError('');
    try {
      const r = await onRegister(firstName.trim(), email.trim(), password);
      setSentTo({ email: r.email, emailSent: r.emailSent, fromLogin: false });
      setPassword('');
    } catch (err) {
      setError(errorText(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Escribe tu correo (o usuario) y tu contraseña.'); return; }
    setBusy(true);
    setError('');
    try {
      await onLogin(email.trim(), password);
      // Con sesión el chat retoma la petición solo: esta tarjeta desaparece.
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'email_not_verified') {
        setSentTo({ email: (err as { email?: string }).email || email.trim(), emailSent: true, fromLogin: true });
      } else {
        setError(errorText(err, 'No se pudo iniciar sesión. Revisa tus datos.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const doResend = async () => {
    if (!sentTo || resend.state !== 'idle') return;
    setResend({ state: 'sending', msg: '' });
    try {
      const msg = await onResend(sentTo.email);
      setResend({ state: 'sent', msg });
    } catch (err) {
      setResend({ state: 'idle', msg: errorText(err, 'No se pudo reenviar el correo ahora mismo. Inténtalo en unos minutos.') });
    }
  };

  const backToForm = (t: Tab) => { setSentTo(null); setResend({ state: 'idle', msg: '' }); setTab(t); setError(''); setPassword(''); };

  return (
    <section aria-label="Cuenta para hablar con un asesor" className="space-y-3 text-sm bg-card border border-accent/40 rounded-xl p-3 motion-pop">
      {sentTo ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
            </svg>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                {sentTo.fromLogin ? 'Tu cuenta aún no está confirmada' : 'Ya casi: confirma tu correo'}
              </p>
              <p className="text-xs text-foreground">
                {sentTo.emailSent ? 'Te hemos enviado un correo a ' : 'No hemos podido enviar ahora el correo a '}<strong className="break-all">{sentTo.email}</strong>.
                {' '}Pulsa el enlace para activar tu cuenta: al confirmarlo volverás aquí y te preguntaremos si quieres {goal}.
              </p>
              <p className="text-[11px] text-text-muted">
                Si no lo ves, mira en la carpeta de spam. Si ya tenías una cuenta con este correo no hace falta confirmar nada: entra con tu contraseña.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doResend}
              disabled={resend.state !== 'idle'}
              className="px-3 py-2 rounded-lg border border-card-border text-[11px] font-mono uppercase font-bold hover:border-accent hover:text-accent disabled:opacity-60 transition-colors"
            >
              {resend.state === 'sending' ? 'Enviando…' : resend.state === 'sent' ? 'Correo reenviado' : 'Reenviar el correo'}
            </button>
            <button type="button" onClick={() => backToForm('login')} className="px-3 py-2 rounded-lg border border-card-border text-[11px] font-mono uppercase font-bold hover:border-accent hover:text-accent transition-colors">
              Ya tengo cuenta
            </button>
            <button type="button" onClick={() => backToForm('register')} className="px-3 py-2 text-[11px] text-text-muted hover:text-foreground underline">
              Usar otro correo
            </button>
          </div>
          {resend.msg && <p role="status" className="text-[11px] text-text-muted">{resend.msg}</p>}
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Para {goal} necesitas una cuenta</p>
            <p className="text-[11px] text-text-muted">
              Así el asesor podrá avisarte cuando te responda y ver tus pedidos. Puedes crearla aquí mismo en un minuto, o entrar si ya tienes una. Tu conversación se mantiene.
            </p>
          </div>

          <div role="tablist" aria-label="Crear cuenta o entrar" className="flex border border-card-border rounded-lg overflow-hidden">
            {([['register', 'Crear cuenta'], ['login', 'Ya tengo cuenta']] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => switchTab(id)}
                className={`flex-1 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors ${tab === id ? 'bg-accent text-slate-950' : 'bg-card text-text-muted hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'register' ? (
            <form onSubmit={submitRegister} className="space-y-2.5" noValidate>
              <div>
                <label htmlFor={`${uid}-name`} className={LABEL}>Tu nombre</label>
                <input id={`${uid}-name`} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={60} className={FIELD} placeholder="Nombre" />
              </div>
              <div>
                <label htmlFor={`${uid}-email`} className={LABEL}>Correo electrónico</label>
                <input id={`${uid}-email`} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} className={FIELD} placeholder="tu@correo.com" />
              </div>
              <div>
                <label htmlFor={`${uid}-pass`} className={LABEL}>Contraseña (mínimo {MIN_PASSWORD} caracteres)</label>
                <div className="relative">
                  <input id={`${uid}-pass`} type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={100} className={`${FIELD} pr-16`} />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase text-text-muted hover:text-foreground" aria-pressed={showPass}>
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={busy} className="w-full px-3 py-2.5 rounded-lg bg-accent text-slate-950 text-xs font-mono uppercase font-bold disabled:opacity-60">
                {busy ? 'Creando tu cuenta…' : 'Crear cuenta y continuar'}
              </button>
              <p className="text-[10px] text-text-muted leading-snug">
                Al crear la cuenta aceptas los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="underline">términos</a> y la <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer" className="underline">política de privacidad</a>.
              </p>
            </form>
          ) : (
            <form onSubmit={submitLogin} className="space-y-2.5" noValidate>
              <div>
                <label htmlFor={`${uid}-lid`} className={LABEL}>Correo o usuario</label>
                <input id={`${uid}-lid`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" maxLength={120} className={FIELD} placeholder="tu@correo.com" />
              </div>
              <div>
                <label htmlFor={`${uid}-lpass`} className={LABEL}>Contraseña</label>
                <div className="relative">
                  <input id={`${uid}-lpass`} type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={100} className={`${FIELD} pr-16`} />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase text-text-muted hover:text-foreground" aria-pressed={showPass}>
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={busy} className="w-full px-3 py-2.5 rounded-lg bg-accent text-slate-950 text-xs font-mono uppercase font-bold disabled:opacity-60">
                {busy ? 'Entrando…' : 'Entrar y continuar'}
              </button>
            </form>
          )}
        </>
      )}

      <button type="button" onClick={onClose} className="block w-full text-center text-[11px] text-text-muted hover:text-foreground underline">
        Ahora no, sigo con el asistente
      </button>
    </section>
  );
}
