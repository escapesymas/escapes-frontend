'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../../components/Header';
import { apiRequest } from '../../lib/constants';
import { trackEvent as trackUmami } from '../../lib/umami';

// Antes no había página de contacto: /contact y /contact-us daban 404 (4 visitas en noviembre las buscaron). El formulario usa el
// endpoint que ya existía (POST /api/contact, con límite de peticiones); el asunto «Consulta de …» lo ordena la regla de correo de info@.
const SUBJECTS = [
  'Duda sobre un producto o su compatibilidad',
  'Estado de mi pedido',
  'Garantía o devolución',
  'Otra consulta',
];

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export default function ContactoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // trampa para robots: una persona no lo ve ni lo rellena
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!EMAIL_RE.test(email.trim())) return setError('El correo electrónico no es válido.');
    if (message.trim().length < 10) return setError('Cuéntanos un poco más en el mensaje (mínimo 10 caracteres).');
    if (website) { setDone(true); return; }
    setSending(true);
    try {
      const res = await apiRequest('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No hemos podido enviar tu mensaje. Inténtalo de nuevo o escríbenos a info@escapesymas.com.');
        return;
      }
      trackUmami('contact_submit');
      setDone(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo o escríbenos a info@escapesymas.com.');
    } finally {
      setSending(false);
    }
  };

  const field = 'w-full px-3 py-2.5 bg-select-bg border border-card-border rounded text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent';
  const label = 'block text-[10px] font-mono font-bold text-text-muted uppercase mb-1.5';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow max-w-2xl mx-auto px-4 py-10 w-full">
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-2">Contacto</h1>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Escríbenos si tienes una duda de compatibilidad, quieres saber cómo va tu pedido o necesitas una garantía o devolución. Te respondemos por correo.
          Para devoluciones, mira antes la <Link href="/devoluciones" className="text-accent-text font-bold hover:underline">política de devoluciones</Link>.
        </p>

        {done ? (
          <div className="flex items-start gap-3 p-5 bg-card border border-card-border rounded-md" role="status">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-bold text-sm uppercase text-foreground">Mensaje enviado</p>
              <p className="text-xs text-text-muted mt-1">Gracias{name.trim() ? `, ${name.trim()}` : ''}. Te contestaremos a <strong className="text-foreground">{email.trim()}</strong> lo antes posible.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 bg-card border border-card-border rounded-md p-5 sm:p-6" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className={label}>Nombre</label>
                <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} className={field} />
              </div>
              <div>
                <label htmlFor="contact-email" className={label}>Correo electrónico</label>
                <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} className={field} />
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className={label}>Motivo</label>
              <select id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={field}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className={label}>Mensaje</label>
              <textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={4000} className={field}
                placeholder="Si es sobre un producto, indica la moto (marca, modelo y año) o la referencia." />
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>No rellenar<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
            </div>
            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-red-400 text-xs font-mono"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Enviar mensaje
              </button>
              <a href="mailto:info@escapesymas.com" className="text-xs font-mono text-text-muted hover:text-foreground transition-colors">
                o escribe a info@escapesymas.com
              </a>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
