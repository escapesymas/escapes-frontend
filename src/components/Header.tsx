'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedBike?: string;
  onOpenBikeSelector?: () => void;
  /** Sin él, el carrito lleva a la portada con la pestaña del carrito abierta. */
  onCartClick?: () => void;
  /** Sin él, las pestañas (Inicio, Mi garaje) llevan a la portada con esa pestaña. */
  onTabChange?: (tab: string) => void;
  /** Pestaña abierta en la portada, para marcar la opción del menú. */
  activeTab?: string;
}

export default function Header({ selectedBike, onCartClick, onTabChange, activeTab }: HeaderProps) {

  const { cartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const goToTab = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    else router.push(tab === 'shop' ? '/' : `/?tab=${tab}`);
  };

  const isHome = pathname === '/';
  const homeActive = isHome && (!activeTab || activeTab === 'shop');
  const catalogActive = pathname?.startsWith('/universales');
  const escapesActive = pathname?.startsWith('/escapes');
  const garageActive = isHome && activeTab === 'garage';
  const navClass = (active: boolean) =>
    `text-xs font-mono font-bold uppercase tracking-wider cursor-pointer decoration-none transition-colors ${
      active ? 'text-accent-text' : 'text-foreground hover:text-accent-text'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-card-border relative">
      <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">

        {/* IZQUIERDA (móvil y pantallas medianas): Logo / (pantalla grande): placeholder invisible */}
        <Link
          href="/"
          aria-label="Escapes y Más — Inicio"
          className="xl:hidden h-11 shrink-0 z-10 flex items-center"
        >
          <Image
            src="/logo-cabecera-negro.svg"
            alt="Escapes y Más"
            width={150}
            height={48}
            priority
            className="h-full w-auto object-contain block dark:hidden"
          />
          <Image
            src="/logo-cabecera.svg"
            alt="Escapes y Más"
            width={150}
            height={48}
            priority
            className="h-full w-auto object-contain hidden dark:block"
          />
        </Link>

        {/* CENTRO (solo pantalla grande): Logo absoluto centrado. Por debajo de xl
            se montaría sobre el menú de la derecha. */}
        <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-11 shrink-0 z-10 items-center pointer-events-none">
          <Link
            href="/"
            aria-label="Escapes y Más — Inicio"
            className="pointer-events-auto h-11 flex items-center"
          >
            <Image
              src="/logo-cabecera-negro.svg"
              alt="Escapes y Más"
              width={150}
              height={48}
              priority
              className="h-full w-auto object-contain block dark:hidden"
            />
            <Image
              src="/logo-cabecera.svg"
              alt="Escapes y Más"
              width={150}
              height={48}
              priority
              className="h-full w-auto object-contain hidden dark:block"
            />
          </Link>
        </div>

        {/* ESPACIADOR pantalla grande izquierdo para centrar el logo absoluto */}
        <div className="hidden xl:block w-9 h-9 shrink-0" aria-hidden="true" />

        {/* DERECHA: Carrito + Nav desktop */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0 md:ml-auto">
          {/* Carrito */}
          <button
            onClick={() => (onCartClick ? onCartClick() : router.push('/?tab=cart'))}
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
          <nav className="hidden md:flex items-center gap-3.5 lg:gap-4 ml-2">
            <Link
              href="/"
              onClick={(e) => {
                if (onTabChange) {
                  e.preventDefault();
                  onTabChange('shop');
                }
              }}
              aria-current={homeActive ? 'page' : undefined}
              className={navClass(homeActive)}
            >
              Inicio
            </Link>
            <Link
              href="/escapes"
              title="Escapes y recambios por marca y modelo de moto"
              aria-current={escapesActive ? 'page' : undefined}
              className={navClass(Boolean(escapesActive))}
            >
              Escapes
            </Link>
            <Link
              href="/universales"
              aria-current={catalogActive ? 'page' : undefined}
              className={navClass(Boolean(catalogActive))}
            >
              Catálogo
            </Link>
            <button
              onClick={() => goToTab('garage')}
              aria-current={garageActive ? 'page' : undefined}
              className={`${navClass(garageActive)} border-0 bg-transparent flex items-center gap-1.5`}
            >
              <span>Mi Garaje</span>
              {selectedBike && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent font-normal max-w-[96px] truncate">
                  {selectedBike}
                </span>
              )}
            </button>
            {isAuthenticated && user ? (
              <Link
                href="/perfil"
                aria-current={pathname === '/perfil' ? 'page' : undefined}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all cursor-pointer border-0"
              >
                Mi Perfil
              </Link>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-sm bg-accent text-slate-950 hover:bg-accent-hover transition-all">
                Acceder
              </Link>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
