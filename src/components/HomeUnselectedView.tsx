'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Bike, Sparkles, ArrowUpRight, ChevronDown } from 'lucide-react';
import { IconExhaustITV, IconHelmetGear, IconChainTransmission, IconWaveBrake } from './BannerCustomIcons';
import BrandCarousel from './BrandCarousel';
import FeaturedProductsList from './FeaturedProductsList';
import { Product } from '../types';

interface HomeUnselectedViewProps {
  onOpenSelector: () => void;
  onAddToCart: (product: Product) => void;
  onNotifyMe: (product: Product) => void;
}

function ScrollReveal({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'zoom';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Bi-directional observer: animates in slowly when entering, reverses when leaving!
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animationStyles = {
    'fade-up': isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-[0.95]',
    'zoom': isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-12',
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[1100ms] cubic-bezier(0.16, 1, 0.3, 1) transform will-change-transform ${animationStyles[animation]} ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomeUnselectedView({
  onOpenSelector,
  onAddToCart,
  onNotifyMe,
}: HomeUnselectedViewProps) {
  return (
    <div className="flex flex-col gap-14 py-0 md:py-4 -mt-2 md:mt-0 max-w-5xl mx-auto w-full">
      {/* ── 1. HERO PANTALLA AJUSTADA ── */}
      <ScrollReveal animation="zoom">
        <section className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-card-border/80 rounded-2xl p-5 sm:p-10 text-center flex flex-col items-center justify-between min-h-[calc(100vh-180px)] md:min-h-[calc(100vh-160px)] max-h-[640px] shadow-2xl my-1 md:my-2">
          <div className="w-full h-1 md:h-2" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] bg-accent/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto my-auto py-4 sm:py-8">
            <span className="inline-flex items-center gap-2 text-[9px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent-text bg-accent/10 border border-accent/20 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" style={{ animationDuration: '6s' }} />
              Compatibilidad 100% Verificada
            </span>

            <h1 className="font-mono font-black uppercase tracking-tight text-3xl sm:text-5xl lg:text-6xl text-foreground mb-4 sm:mb-6 leading-none">
              TU MOTO. <br />
              <span className="text-accent-text bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">
                TUS RECAMBIOS.
              </span>
            </h1>

            <p className="text-text-muted text-xs sm:text-base font-sans max-w-md mb-6 sm:mb-10 leading-relaxed">
              Verificamos tu modelo antes de enviar cualquier pieza. Cero errores de compatibilidad.
            </p>

            <button
              onClick={onOpenSelector}
              className="group relative inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4.5 bg-accent text-slate-950 font-mono font-bold text-xs sm:text-sm uppercase tracking-widest rounded-xl hover:bg-accent-hover active:scale-95 transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 cursor-pointer overflow-hidden"
            >
              <Bike className="w-4 sm:w-5 h-4 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>SELECCIONAR MI MOTO</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative z-10 flex flex-col items-center opacity-50 animate-bounce pb-2 sm:pb-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-1">Baja para explorar</span>
            <ChevronDown className="w-4 h-4 text-accent" />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 2. BANNERS CON ICONOS PERSONALIZADOS HD (SCROLL ANIMADO PROGRESIVO) ── */}
      <div className="flex flex-col gap-6 pt-2">
        {/* Card 1: Escapes & ITV */}
        <ScrollReveal animation="fade-up" delay={100}>
          <button
            onClick={onOpenSelector}
            className="group relative bg-card/40 hover:bg-card border border-card-border/60 hover:border-accent/60 rounded-2xl p-7 sm:p-8 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full cursor-pointer overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-amber-500/20 transition-all duration-300 shadow-md">
                <IconExhaustITV className="w-9 h-9 drop-shadow-sm" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg uppercase text-foreground mb-1 group-hover:text-accent-text transition-colors">
                  ESCAPES & ITV
                </h3>
                <p className="text-text-muted text-xs sm:text-sm font-sans leading-relaxed max-w-lg">
                  Homologación 100% legal Euro 4 y Euro 5 con certificado de marca para pasar ITV sin problemas.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 hidden sm:block" />
          </button>
        </ScrollReveal>

        {/* Card 2: Transmisión */}
        <ScrollReveal animation="fade-up" delay={150}>
          <button
            onClick={onOpenSelector}
            className="group relative bg-card/40 hover:bg-card border border-card-border/60 hover:border-accent/60 rounded-2xl p-7 sm:p-8 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full cursor-pointer overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-blue-500/20 transition-all duration-300 shadow-md">
                <IconChainTransmission className="w-9 h-9 drop-shadow-sm" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg uppercase text-foreground mb-1 group-hover:text-accent-text transition-colors">
                  TRANSMISIÓN
                </h3>
                <p className="text-text-muted text-xs sm:text-sm font-sans leading-relaxed max-w-lg">
                  Kits de cadena reinforced X-Ring, piñón y corona de alto rendimiento.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 hidden sm:block" />
          </button>
        </ScrollReveal>

        {/* Card 3: Frenado Pro */}
        <ScrollReveal animation="fade-up" delay={200}>
          <button
            onClick={onOpenSelector}
            className="group relative bg-card/40 hover:bg-card border border-card-border/60 hover:border-accent/60 rounded-2xl p-7 sm:p-8 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full cursor-pointer overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-rose-500/20 transition-all duration-300 shadow-md">
                <IconWaveBrake className="w-9 h-9 drop-shadow-sm" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg uppercase text-foreground mb-1 group-hover:text-accent-text transition-colors">
                  FRENADO PRO
                </h3>
                <p className="text-text-muted text-xs sm:text-sm font-sans leading-relaxed max-w-lg">
                  Pastillas sinterizadas y discos Wave para máxima potencia de parada y mordida limpia.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 hidden sm:block" />
          </button>
        </ScrollReveal>

        {/* Card 4: Cascos & Ropa (Equipamiento Piloto) */}
        <ScrollReveal animation="fade-up" delay={250}>
          <a
            href="/universales/cascos"
            className="group relative bg-card/40 hover:bg-card border border-card-border/60 hover:border-accent/60 rounded-2xl p-7 sm:p-8 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full no-underline cursor-pointer overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-emerald-500/20 transition-all duration-300 shadow-md">
                <IconHelmetGear className="w-9 h-9 drop-shadow-sm" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg uppercase text-foreground mb-1 group-hover:text-accent-text transition-colors">
                  CASCOS & ROPA MOTERO
                </h3>
                <p className="text-text-muted text-xs sm:text-sm font-sans leading-relaxed max-w-lg">
                  Cascos homologados ECE 22.06, chaquetas con protecciones, guantes y equipamiento de seguridad.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 hidden sm:block" />
          </a>
        </ScrollReveal>
      </div>

      {/* ── 3. SECCIÓN EQUIPAMIENTO DESTACADO — CASCOS Y ROPA ── */}
      <FeaturedProductsList
        onAddToCart={onAddToCart}
        onNotifyMe={onNotifyMe}
        ScrollReveal={ScrollReveal}
      />

      {/* ── 4. CARRUSEL SECUNDARIO AKRAPOVIC ── */}
      <section className="pt-4">
        <ScrollReveal animation="fade-up" delay={150}>
          <BrandCarousel brand="AKRAPOVIC" title="Akrapovič — Escapes Destacados" onAddToCart={onAddToCart} onNotifyMe={onNotifyMe} />
        </ScrollReveal>
      </section>
    </div>
  );
}
