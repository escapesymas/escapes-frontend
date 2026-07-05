'use client';

import React from 'react';
import { ShoppingBag, Bike, Cpu, MessageSquare, User, LogIn, Library } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedBike?: string;
}

export default function BottomNav({ activeTab, onTabChange, selectedBike }: BottomNavProps) {
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { id: 'shop', label: 'Tienda', icon: ShoppingBag },
    { id: 'catalog', label: 'Catálogo', icon: Library, href: '/universales' as const },
    { id: 'garage', label: selectedBike ? truncateForNav(selectedBike) : 'Mi Moto', icon: Bike },
    // { id: 'paddock', label: 'Paddock', icon: MessageSquare },
  ];

  const isProfileActive = activeTab === 'profile' || activeTab === 'login';

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-card-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasBikeSelected = item.id === 'garage' && !!selectedBike;
          const content = (
            <>
              <div
                className={`p-1.5 rounded-md transition-all duration-300 ${
                  isActive
                    ? 'bg-accent/10 text-accent-text scale-110'
                    : hasBikeSelected
                    ? 'text-accent-text'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                title={hasBikeSelected ? selectedBike : undefined}
                className={`text-[9px] font-mono uppercase tracking-wider transition-colors mt-0.5 max-w-[90px] truncate ${
                  isActive ? 'text-accent-text font-bold' : hasBikeSelected ? 'text-accent-text font-bold' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
              {(isActive || hasBikeSelected) && (
                <span className={`absolute bottom-0 w-8 h-[2px] rounded-t-full shadow-[0_-2px_4px_rgba(250,204,21,0.5)] ${
                  hasBikeSelected && !isActive ? 'bg-accent/60' : 'bg-accent'
                }`} />
              )}
            </>
          );

          if ('href' in item) {
            return (
              <Link
                key={item.id}
                href={item.href!}
                className="flex flex-col items-center justify-center flex-1 py-1 px-2 h-full transition-all relative group"
                aria-label={item.label}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-2 h-full transition-all relative group"
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}

        {/* Perfil / Login */}
        {isAuthenticated && user ? (
          <button
            onClick={() => onTabChange('profile')}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 h-full transition-all relative group"
            aria-label="Perfil"
          >
            <div className={`relative transition-all duration-300 ${isProfileActive ? 'scale-110' : ''}`}>
              <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-colors ${
                isProfileActive ? 'border-accent' : 'border-card-border'
              }`}>
                {user.avatarUrl && user.avatarUrl.startsWith('emoji:') ? (
                  <div className="w-full h-full bg-accent/20 flex items-center justify-center text-sm">
                    {user.avatarUrl.substring(6)}
                  </div>
                ) : user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center text-slate-950 font-mono font-bold text-[10px]">
                    {(user.firstName ? user.firstName[0] : user.username[0]).toUpperCase()}
                  </div>
                )}
              </div>
              {isProfileActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
            </div>
            <span className={`text-[9px] font-mono uppercase tracking-wider transition-colors mt-0.5 ${
              isProfileActive ? 'text-accent-text font-bold' : 'text-text-muted'
            }`}>
              Perfil
            </span>
            {isProfileActive && (
              <span className="absolute bottom-0 w-8 h-[2px] bg-accent rounded-t-full shadow-[0_-2px_4px_rgba(250,204,21,0.5)]" />
            )}
          </button>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 h-full transition-all relative group"
            aria-label="Acceder"
          >
            <div className={`p-1.5 rounded-md transition-all duration-300 ${
              isProfileActive
                ? 'bg-accent/10 text-accent-text scale-110'
                : 'text-text-muted hover:text-foreground'
            }`}>
              <LogIn className="w-5 h-5" />
            </div>
            <span className={`text-[9px] font-mono uppercase tracking-wider transition-colors mt-0.5 ${
              isProfileActive ? 'text-accent-text font-bold' : 'text-text-muted'
            }`}>
              Acceder
            </span>
            {isProfileActive && (
              <span className="absolute bottom-0 w-8 h-[2px] bg-accent rounded-t-full shadow-[0_-2px_4px_rgba(250,204,21,0.5)]" />
            )}
          </Link>
        )}
      </div>
</nav>
    </>
  );
}

function truncateForNav(bike: string): string {
  const max = 14;
  if (bike.length <= max) return bike.toUpperCase();
  return bike.slice(0, max - 1).trimEnd() + '…';
}
