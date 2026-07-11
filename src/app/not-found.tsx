'use client';

import Header from '../components/Header';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => router.push('/?openSelector=true')}
        onCartClick={() => router.push('/?tab=cart')}
        onTabChange={(tab: string) => router.push(`/?tab=${tab}`)}
      />
      <main id="main-content" className="flex-grow max-w-2xl mx-auto px-4 py-16 w-full text-center">
        <div className="flex flex-col items-center gap-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent-text">
            Error 404
          </p>
          <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase text-foreground">
            Página no encontrada
          </h1>
          <p className="text-sm text-text-muted max-w-md leading-relaxed">
            El enlace que has seguido puede estar roto, o la página ha sido movida.
            Vuelve a la tienda para seguir buscando lo que necesitas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer"
            >
              Ir a la tienda
            </button>
            <button
              onClick={() => router.push('/universales')}
              className="px-6 py-3 border border-card-border bg-card text-foreground rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-icon-box/40 transition-all cursor-pointer"
            >
              Explorar catálogo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
