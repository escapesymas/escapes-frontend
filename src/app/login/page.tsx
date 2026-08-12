'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isValidRedirect } from '../../lib/constants';
import { Bike, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';

type Tab = 'login' | 'register';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('login');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Si ya está autenticado, redirigir
  const fromParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from') : null;
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(isValidRedirect(fromParam));
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await login(loginUsername.trim(), loginPassword);
      setSuccess('¡Sesión iniciada!');
      setTimeout(() => router.replace(isValidRedirect(searchParams.get('from'))), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !regUsername.trim() ||
      !regEmail.trim() ||
      !regFirstName.trim() ||
      !regLastName.trim() ||
      !regPhone.trim() ||
      !regPassword.trim() ||
      !regConfirmPassword.trim()
    ) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await register(
        regUsername.trim(),
        regEmail.trim(),
        regPassword,
        regFirstName.trim(),
        regLastName.trim(),
        regPhone.trim()
      );
      setSuccess('¡Cuenta creada! Entrando...');
      setTimeout(() => router.replace(isValidRedirect(searchParams.get('from'))), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    setSuccess('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="bg-background text-foreground flex flex-col font-sans"
      style={{ height: '100dvh' }}
    >
      <Header
        selectedBike=""
        onOpenBikeSelector={() => router.push('/?openSelector=true')}
        onCartClick={() => router.push('/?tab=cart')}
      />

      <div className="bg-accent/10 border-b border-accent/30 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-center">
        <span className="font-mono uppercase tracking-wider text-accent font-bold">🤖</span>
        <span className="text-foreground/80">
          Con tu cuenta accedes al <strong>asistente IA 24/7</strong> para preguntas sobre catálogo, pedidos y soporte.
        </span>
      </div>

      <main
        className="flex-1 overflow-y-auto overscroll-contain flex flex-col items-center py-8 pb-16 md:pb-8"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="w-full max-w-sm px-4 my-auto">
          {/* Tabs */}
          <div className="flex border border-card-border rounded-md overflow-hidden mb-6">
            <button
              id="tab-login"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-accent text-slate-950'
                  : 'bg-card text-text-muted hover:text-foreground'
              }`}
            >
              Acceder
            </button>
            <button
              id="tab-register"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-accent text-slate-950'
                  : 'bg-card text-text-muted hover:text-foreground'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Card */}
          <div className="bg-card border border-card-border rounded-md p-6 shadow-sm">
            {/* Feedback global */}
            {error && (
              <div className="mb-4 flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-mono">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-2 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded px-3 py-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-mono">{success}</p>
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-username" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Email o usuario
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="piloto@ejemplo.com"
                    className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-password" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showLoginPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-username" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Nombre de usuario *
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="piloto_rapido"
                    className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-email" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="piloto@ejemplo.com"
                    className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-firstname" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                      Nombre *
                    </label>
                    <input
                      id="reg-firstname"
                      type="text"
                      required
                      value={regFirstName}
                      onChange={e => setRegFirstName(e.target.value)}
                      placeholder="Marc"
                      className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-lastname" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                      Apellidos *
                    </label>
                    <input
                      id="reg-lastname"
                      type="text"
                      required
                      value={regLastName}
                      onChange={e => setRegLastName(e.target.value)}
                      placeholder="Márquez"
                      className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-phone" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Teléfono *
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="600 000 000"
                    className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                 <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-password" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showRegPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-confirm-password" className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showRegConfirmPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className="w-full bg-background border border-card-border rounded px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showRegConfirmPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showRegConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-text-muted font-mono leading-relaxed">
                  Al registrarte aceptas nuestros{' '}
                  <a href="/terminos" className="text-accent hover:underline">términos de uso</a>{' '}
                  y{' '}
                  <a href="/privacidad" className="text-accent hover:underline">política de privacidad</a>.
                </p>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-text-muted font-mono mt-4">
            {tab === 'login' ? (
              <>¿Aún no tienes cuenta?{' '}
                <button onClick={() => switchTab('register')} className="text-accent hover:underline cursor-pointer">Regístrate</button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button onClick={() => switchTab('login')} className="text-accent hover:underline cursor-pointer">Inicia sesión</button>
              </>
            )}
          </p>
        </div>
      </main>

      <BottomNav
        activeTab="login"
        onTabChange={(tabId) => {
          router.push(`/?tab=${tabId}`);
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
