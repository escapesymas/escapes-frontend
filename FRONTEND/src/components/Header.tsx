'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedBike?: string;
  onOpenBikeSelector?: () => void;
  onCartClick: () => void;
  onTabChange?: (tab: string) => void;
}

export default function Header({ onCartClick, onTabChange }: HeaderProps) {
  const { cartCount } = useCart();
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-card-border relative">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3 relative">

        {/* IZQUIERDA: placeholder vacío para mantener logo centrado */}
        <div className="w-9 h-9 shrink-0 md:w-10 md:h-10" aria-hidden="true" />

        {/* CENTRO: Logo (acceso directo a home) */}
        <Link
          href="/"
          aria-label="Escapes y Más — Inicio"
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-11 shrink-0 z-10"
        >
          {/* Logo para tema claro (letras negras + amarillo) */}
            <Image
              src="/logo-cabecera-negro.svg"
              alt="Escapes y Más"
              width={150}
              height={48}
              priority
              className="h-full w-auto object-contain block dark:hidden"
            />
          {/* Logo para tema oscuro (letras blancas + amarillo) */}
            <Image
              src="/logo-cabecera.svg"
              alt="Escapes y Más"
              width={150}
              height={48}
              priority
              className="h-full w-auto object-contain hidden dark:block"
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
            <Link
              href="/universales"
              className="text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-foreground hover:text-accent-text transition-colors decoration-none"
            >
              Catálogo
            </Link>
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
