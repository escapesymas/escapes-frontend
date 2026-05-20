import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { MEGA_MENU, MegaMenuItem } from '../utils/megaMenuData';

interface MegaMenuProps {
  onNavClick: (view: string, category?: string) => void;
}

const MAX_COLS = 4;

/* ────────────────────────────────────────────────────────────
   DropdownPanel — usa position:fixed anclado al header (64px)
   para evitar cualquier overflow lateral.
──────────────────────────────────────────────────────────── */
const DropdownPanel: React.FC<{
  item: MegaMenuItem;
  onNavClick: (view: string, category?: string) => void;
  onClose: () => void;
}> = ({ item, onNavClick, onClose }) => {
  if (!item.groups || item.groups.length === 0) return null;

  const groups = item.groups;
  const colCount = Math.min(groups.length, MAX_COLS);

  const handleSubClick = (view: string, label: string, category?: string) => {
    // Si el sub-ítem tiene un slug de categoría concreto úsalo,
    // si no, pasa el label como búsqueda para que el catálogo lo filtre.
    onNavClick(view, category || label);
    onClose();
  };

  return (
    /* Panel fijo justo debajo del header (h-16 = 64px) */
    <div
      className="fixed left-0 right-0 z-[200] bg-racing-carbon border-t-2 border-racing-orange shadow-2xl animate-mega-in overflow-y-auto"
      style={{ top: '64px', maxHeight: 'calc(100vh - 64px)' }}
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-6 py-6">
        <div
          className="grid gap-x-8 gap-y-6"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              <p className="text-racing-orange text-[11px] font-black uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">
                {group.title}
              </p>
              {group.items.map((sub, si) => (
                <button
                  key={si}
                  onClick={() =>
                    handleSubClick(
                      sub.view || item.view,
                      sub.label,
                      sub.category
                    )
                  }
                  className="text-left text-zinc-400 hover:text-white text-[12px] leading-snug transition-colors duration-100 py-0.5 hover:pl-1"
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center flex-wrap gap-3">
          <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
            {item.label}
          </span>
          <button
            onClick={() => {
              onNavClick(item.view, item.category);
              onClose();
            }}
            className="bg-racing-orange hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2 transition-colors"
          >
            Ver todas las categorías →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Overlay — bloquea el resto de la página al abrir el panel
──────────────────────────────────────────────────────────── */
const Overlay: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    className="fixed inset-0 z-[199] bg-black/50"
    style={{ top: '64px' }}
    onClick={onClick}
  />
);

/* ────────────────────────────────────────────────────────────
   MegaMenuNav — barra de navegación principal
──────────────────────────────────────────────────────────── */
export const MegaMenuNav: React.FC<MegaMenuProps> = ({ onNavClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((idx: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(idx);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenIndex(null), 220);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const close = useCallback(() => setOpenIndex(null), []);

  // Cierra con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  const openItem = openIndex !== null ? MEGA_MENU[openIndex] : null;
  const hasDropdownOpen = openItem !== null && Boolean(openItem?.groups?.length);

  return (
    <>
      {/* Overlay */}
      {hasDropdownOpen && <Overlay onClick={close} />}

      {/* Dropdown panel — renderizado fuera del nav para no verse afectado por overflow */}
      {hasDropdownOpen && openItem && (
        <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          <DropdownPanel item={openItem} onNavClick={onNavClick} onClose={close} />
        </div>
      )}

      {/* Barra de nav */}
      <nav className="flex items-center gap-0.5">
        {MEGA_MENU.map((item, idx) => {
          const hasDropdown = Boolean(item.groups && item.groups.length > 0);
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => hasDropdown ? open(idx) : undefined}
              onMouseLeave={hasDropdown ? scheduleClose : undefined}
            >
              <button
                onClick={() => {
                  if (!hasDropdown) {
                    onNavClick(item.view, item.category);
                    close();
                  } else {
                    setOpenIndex(isOpen ? null : idx);
                  }
                }}
                className={`flex items-center gap-1 px-3 py-5 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                  isOpen
                    ? 'text-racing-orange border-racing-orange'
                    : item.highlight
                    ? 'text-racing-orange border-transparent hover:border-racing-orange'
                    : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-700'
                }`}
                aria-expanded={isOpen}
                aria-haspopup={hasDropdown}
              >
                {item.label}
                {hasDropdown && (
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );
};
