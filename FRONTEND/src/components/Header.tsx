'use client';

import React from 'react';
import { ShoppingCart, Bike } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedBike?: string;
  onOpenBikeSelector: () => void;
  onCartClick: () => void;
  onTabChange?: (tab: string) => void;
}

export default function Header({ selectedBike, onOpenBikeSelector, onCartClick, onTabChange }: HeaderProps) {
  const { cartCount } = useCart();
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <div className="w-full bg-accent/10 border-b border-accent/20 py-2 px-4 text-center shrink-0">
        <p className="text-[10px] md:text-xs font-mono text-accent-text font-bold uppercase tracking-wider">
          Estamos trabajando en mejoras en la web. Para consultas sobre productos que no encuentres, contacta a <a href="mailto:info@escapesymas.com" className="underline text-foreground hover:text-accent-text">info@escapesymas.com</a>
        </p>
      </div>
      <header className="sticky top-11 md:top-10 z-40 w-full bg-background/80 backdrop-blur-md border-b border-card-border">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">

        {/* IZQUIERDA: Selector de Moto */}
        <button
          onClick={onOpenBikeSelector}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-[10px] font-mono font-bold uppercase transition-all shrink-0 ${
            selectedBike
              ? 'bg-badge text-badge-text border-badge-border'
              : 'bg-card border-card-border text-text-muted hover:text-foreground hover:bg-select-bg'
          }`}
        >
          <Bike className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-[110px] truncate">
            {selectedBike ? selectedBike : 'Mi Moto'}
          </span>
        </button>

        {/* CENTRO: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 h-11 shrink-0">
          {/* Logo para tema claro (letras negras + amarillo) */}
          <img
            src="/logo-cabecera-negro.svg"
            alt="Escapes y Más"
            className="h-full w-auto object-contain block dark:hidden"
            style={{ aspectRatio: '150/48' }}
          />
          {/* Logo para tema oscuro (letras blancas + amarillo) */}
          <img
            src="/logo-cabecera.svg"
            alt="Escapes y Más"
            className="h-full w-auto object-contain hidden dark:block"
            style={{ aspectRatio: '150/48' }}
          />
        </Link>

        {/* DERECHA: Carrito + Nav desktop */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Carrito */}
          <button
            onClick={onCartClick}
            className="relative cursor-pointer p-1.5 text-text-muted hover:text-foreground transition-colors border-0 bg-transparent focus:outline-none"
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-accent text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                {cartCount}
              </span>
            )}
          </button>

          {/* Desktop únicamente: navegación */}
          <nav className="hidden md:flex items-center gap-5 ml-2">
            <Link
              href="/"
              onClick={(e) => {
                if (onTabChange) {
                  e.preventDefault();
                  onTabChange('shop');
                }
              }}
              className="text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-accent-text decoration-none"
            >
              Inicio
            </Link>
            <span className="text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-foreground hover:text-accent-text transition-colors">Catálogo</span>
            {isAuthenticated && user ? (
              <button
                onClick={() => onTabChange ? onTabChange('profile') : window.location.href = '/?tab=profile'}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all cursor-pointer border-0"
              >
                Mi Perfil
              </button>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all">
                Acceder
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
    </>
  );
}
