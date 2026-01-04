import React, { useState } from 'react';
import { Wrench, ShoppingCart, User, Menu, LogOut, Package, Settings, MessageSquare } from 'lucide-react';
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
  onNavClick: (view: any, category?: string) => void; // Generic nav handler
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

  return (
    <header className="sticky top-0 z-50 w-full bg-racing-carbon/95 backdrop-blur-md border-b border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div 
          onClick={onLogoClick}
          className="flex items-center gap-2 group cursor-pointer"
        >
          {STORE_CONFIG.logoUrl ? (
            <div className="rounded-sm">
              <img 
                src={STORE_CONFIG.logoUrl} 
                alt={STORE_CONFIG.name} 
                className="h-10 object-contain"
              />
            </div>
          ) : (
            <>
              <div className="bg-racing-orange p-1.5 rounded-sm transform group-hover:-skew-x-12 transition-transform duration-300">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter uppercase italic text-white">
                {STORE_CONFIG.name}
              </span>
            </>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide uppercase text-zinc-400">
          {NAV_LINKS.map((link, index) => (
            <a 
              key={index} 
              href={link.href} 
              onClick={(e) => {
                e.preventDefault();
                // Pass either a specific view (forum) or a category filter
                onNavClick(link.view || 'catalog', link.category);
              }}
              className={`transition-colors flex items-center gap-1 ${link.highlight ? 'text-racing-orange hover:text-white' : 'hover:text-racing-orange'} ${link.view === 'forum' ? 'text-zinc-300' : ''}`}
            >
              {link.view === 'forum' && <MessageSquare className="w-4 h-4" />}
              {link.label}
            </a>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4 text-zinc-300">
          {/* User Section */}
          <div className="relative">
            <button 
              onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : onLoginClick?.()}
              className={`flex items-center gap-2 hover:text-white transition-colors ${user ? 'text-white' : ''}`}
            >
              {user && user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full border border-zinc-600" />
              ) : (
                <User className="w-5 h-5" />
              )}
              {user && <span className="text-xs font-bold hidden sm:block">{user.firstName}</span>}
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-sm shadow-xl py-1 animate-fade-in-up origin-top-right">
                <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                   <p className="text-white text-sm font-bold">{user.firstName} {user.lastName}</p>
                   <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => { setIsUserMenuOpen(false); onOrdersClick?.(); }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <Package className="w-4 h-4" /> Mis Pedidos
                </button>
                <button 
                  onClick={() => { setIsUserMenuOpen(false); onAccountClick?.(); }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Mi Cuenta
                </button>
                <div className="border-t border-zinc-800 mt-1">
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogoutClick?.();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onCartClick}
            className="relative hover:text-white transition-colors group"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-racing-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
          
          <button className="md:hidden hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Click outside to close menu overlay */}
      {isUserMenuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setIsUserMenuOpen(false)}></div>
      )}
    </header>
  );
};