import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sin conexión · Escapes y Más',
  description: 'No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <div
          className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M2 8.82a15 15 0 0 1 20 0" />
            <path d="M5 12.86a10 10 0 0 1 14 0" />
            <path d="M8.5 16.43a5 5 0 0 1 7 0" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-tight">
            Estás sin conexión
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            No hemos podido cargar esta página. Si ya la has visitado antes
            debería estar disponible en caché; si no, comprueba tu conexión
            a internet y vuelve a intentarlo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href="/"
            className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all"
          >
            Volver al inicio
          </a>
          <a
            href="/universales"
            className="px-5 py-2.5 text-xs font-mono font-bold rounded-sm border border-card-border text-foreground hover:border-accent/50 hover:bg-select-bg transition-all"
          >
            Explorar catálogo
          </a>
        </div>

        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider pt-4">
          Escapes y Más · distribuidor oficial
        </p>
      </div>
    </main>
  );
}
