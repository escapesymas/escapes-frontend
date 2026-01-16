
import React, { useState } from 'react';
import { ShoppingCart, User, Menu, LogOut, Package, Settings, MessageSquare, X, ChevronRight } from 'lucide-react';
import { STORE_CONFIG, NAV_LINKS } from '../storeData';
import { User as UserType } from '../types';

interface HeaderProps {
  cartCount?: number;
  user?: UserType | null;
  onCartClick?: () => void;
  onLogoClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onOrdersClick?: () => void;
  onAccountClick?: () => void;
  onNavClick: (view: any, category?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount = 0,
  user,
  onCartClick,
  onLogoClick,
  onLoginClick,
  onLogoutClick,
  onOrdersClick,
  onAccountClick,
  onNavClick
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavLinks = NAV_LINKS.filter(link => link.view !== 'warranty');

  const handleMobileNavClick = (view: any, category?: string) => {
    setIsMobileMenuOpen(false);
    onNavClick(view, category);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-racing-carbon/95 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2 md:gap-4">
            <button
              className="md:hidden text-zinc-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div onClick={onLogoClick} className="cursor-pointer group flex items-center">
              <img
                src={STORE_CONFIG.logoUrl}
                alt={STORE_CONFIG.name}
                width="150"
                height="48"
                className="h-8 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {filteredNavLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => onNavClick(link.view || 'catalog', link.category)}
                className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 ${link.highlight ? 'text-racing-orange hover:text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {link.view === 'forum' && <MessageSquare className="w-3.5 h-3.5" />}
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            {/* User Profile Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : onLoginClick?.()}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                aria-label="Perfil de usuario"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-7 h-7 rounded-full border-2 border-racing-orange object-cover" width="28" height="28" alt="Avatar" />
                ) : user ? (
                  <div className="w-7 h-7 rounded-full bg-racing-orange flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.firstName?.charAt(0).toUpperCase()}</span>
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
                {user && <span className="text-xs font-bold hidden md:block text-white">{user.firstName}</span>}
              </button>

              {/* User Dropdown Menu - Desktop */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-sm py-2 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                    <p className="text-white text-sm font-bold truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                  </div>
                  <button onClick={() => { setIsUserMenuOpen(false); onOrdersClick?.(); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2">
                    <Package className="w-4 h-4" /> Mis Pedidos
                  </button>
                  <button onClick={() => { setIsUserMenuOpen(false); onAccountClick?.(); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Mi Cuenta
                  </button>
                  <div className="border-t border-zinc-800 mt-2 pt-2">
                    <button onClick={() => { setIsUserMenuOpen(false); onLogoutClick?.(); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-red-500 hover:bg-zinc-800 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Salir
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={onCartClick} className="relative text-zinc-400 hover:text-white transition-colors" aria-label="Carrito">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-racing-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-zinc-950 h-full border-r border-zinc-800 shadow-2xl flex flex-col animate-fade-in-right">

            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-racing-carbon">
              <span className="text-lg font-black uppercase italic text-white">Menú</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white" aria-label="Cerrar menú">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {user && (
                <div className="mb-6 p-4 bg-zinc-900 rounded-sm border border-zinc-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" width="40" height="40" alt="Avatar" /> : <User className="w-full h-full p-2 text-zinc-500" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{user.firstName}</p>
                    <p className="text-zinc-500 text-xs truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {user && (
                  <>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Mi Cuenta</p>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onOrdersClick?.(); }}
                      className="w-full text-left p-3 rounded-sm flex items-center justify-between text-sm font-bold uppercase text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Mis Pedidos
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onAccountClick?.(); }}
                      className="w-full text-left p-3 rounded-sm flex items-center justify-between text-sm font-bold uppercase text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Mi Cuenta
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                    <div className="my-4 border-t border-zinc-800"></div>
                  </>
                )}

                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Navegación</p>
                {filteredNavLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMobileNavClick(link.view || 'catalog', link.category)}
                    className={`w-full text-left p-3 rounded-sm flex items-center justify-between text-sm font-bold uppercase transition-colors ${link.highlight ? 'bg-racing-orange/10 text-racing-orange border border-racing-orange/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2">
                      {link.view === 'forum' && <MessageSquare className="w-4 h-4" />}
                      {link.label}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900">
              {user ? (
                <button onClick={() => { setIsMobileMenuOpen(false); onLogoutClick?.(); }} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 font-bold uppercase py-3 rounded-sm flex items-center justify-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              ) : (
                <button onClick={() => { setIsMobileMenuOpen(false); onLoginClick?.(); }} className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm flex items-center justify-center gap-2 transition-colors">
                  <User className="w-4 h-4" /> Iniciar Sesión / Registro
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
