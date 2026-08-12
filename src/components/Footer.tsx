import Link from 'next/link';

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-card border-t border-card-border mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase text-foreground tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/aviso-legal"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-privacidad"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-cookies"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/devoluciones"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase text-foreground tracking-wider mb-3">
              Contacto
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:info@escapesymas.com"
                  className="text-[10px] font-mono text-text-muted hover:text-foreground transition-colors"
                >
                  info@escapesymas.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase text-foreground tracking-wider mb-3">
              Síguenos
            </h4>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-card-border hover:border-accent/40 hover:bg-icon-box/20 transition-all text-text-muted hover:text-foreground"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-card-border hover:border-accent/40 hover:bg-icon-box/20 transition-all text-text-muted hover:text-foreground"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded border border-card-border hover:border-accent/40 hover:bg-icon-box/20 transition-all text-text-muted hover:text-foreground"
                aria-label="YouTube"
              >
                <YoutubeIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-card-border/60 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-mono text-green-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M7 13l3 3 7-7" />
            </svg>
            <span>Comprometidos con el medio ambiente — Envíos neutrales en carbono</span>
          </div>
          <p className="text-[10px] font-mono text-text-muted">
            &copy; {new Date().getFullYear()} Escapes y M&aacute;s &mdash; Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
