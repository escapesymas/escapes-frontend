import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { MEGA_MENU, MegaMenuItem } from '../utils/megaMenuData';

interface MegaMenuProps {
  onNavClick: (view: string, category?: string) => void;
}

// Max columns to show in dropdown (4 columns layout)
const MAX_COLS = 4;

const DropdownPanel: React.FC<{
  item: MegaMenuItem;
  onNavClick: (view: string, category?: string) => void;
  onClose: () => void;
}> = ({ item, onNavClick, onClose }) => {
  if (!item.groups || item.groups.length === 0) return null;

  const handleClick = (view: string, category?: string) => {
    onNavClick(view, category);
    onClose();
  };

  // Distribute groups into columns (max MAX_COLS)
  const groups = item.groups;
  const colCount = Math.min(groups.length, MAX_COLS);

  return (
    <div
      className="absolute top-full left-0 z-50 w-screen max-w-screen-xl bg-racing-carbon border-t-2 border-racing-orange shadow-2xl animate-mega-in"
      style={{ marginLeft: '50%', transform: 'translateX(-50%)' }}
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-6 py-6">
        <div
          className="grid gap-x-8 gap-y-6"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1.5">
              <p className="text-racing-orange text-[11px] font-black uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">
                {group.title}
              </p>
              {group.items.map((sub, si) => (
                <button
                  key={si}
                  onClick={() => handleClick(sub.view || item.view, sub.category || item.category)}
                  className="text-left text-zinc-400 hover:text-white text-[12px] leading-snug transition-colors hover:translate-x-0.5 transform duration-100 py-0.5"
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
            {item.label} — Catálogo completo Bihr
          </span>
          <button
            onClick={() => handleClick(item.view, item.category)}
            className="bg-racing-orange hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 transition-colors flex items-center gap-2"
          >
            Ver todas las categorías →
          </button>
        </div>
      </div>
    </div>
  );
};

export const MegaMenuNav: React.FC<MegaMenuProps> = ({ onNavClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const open = useCallback((idx: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(idx);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenIndex(null), 180);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={navRef} className="relative">
      {/* Nav bar */}
      <nav className="flex items-center gap-0.5">
        {MEGA_MENU.map((item, idx) => {
          const hasDropdown = Boolean(item.groups && item.groups.length > 0);
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => hasDropdown ? open(idx) : undefined}
              onMouseLeave={hasDropdown ? scheduleClose : undefined}
            >
              <button
                onClick={() => {
                  if (!hasDropdown) {
                    onNavClick(item.view, item.category);
                    setOpenIndex(null);
                  } else {
                    setOpenIndex(isOpen ? null : idx);
                  }
                }}
                className={`flex items-center gap-1 px-3 py-5 text-[11px] font-black uppercase tracking-widest transition-colors whitespace-nowrap border-b-2 ${
                  isOpen
                    ? 'text-racing-orange border-racing-orange'
                    : item.highlight
                    ? 'text-racing-orange border-transparent hover:border-racing-orange'
                    : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-700'
                }`}
              >
                {item.label}
                {hasDropdown && (
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Dropdown */}
              {isOpen && hasDropdown && (
                <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                  <DropdownPanel item={item} onNavClick={onNavClick} onClose={() => setOpenIndex(null)} />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};
