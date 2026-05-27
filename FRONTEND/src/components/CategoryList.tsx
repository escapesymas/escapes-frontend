'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame, ShieldAlert, Cpu, Disc, Wrench, Layers, Package,
  User, Droplets, Circle, Loader2
} from 'lucide-react';
import { Category3 } from '../types';
import { fetchCategories } from '../lib/api';

interface CategoryListProps {
  onSelectCategory: (id: number, name: string) => void;
}

const PARENT_ICONS: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1: { icon: Flame, color: 'text-orange-500' },
  2: { icon: Disc, color: 'text-red-500' },
  3: { icon: Wrench, color: 'text-yellow-500' },
  4: { icon: Cpu, color: 'text-blue-500' },
  5: { icon: Layers, color: 'text-emerald-500' },
  6: { icon: Droplets, color: 'text-cyan-500' },
  7: { icon: Circle, color: 'text-stone-500' },
  8: { icon: ShieldAlert, color: 'text-violet-500' },
  9: { icon: User, color: 'text-pink-500' },
  10: { icon: Package, color: 'text-amber-500' },
};

export default function CategoryList({ onSelectCategory }: CategoryListProps) {
  const [categories, setCategories] = useState<Category3[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch {
        // Fallback vacío silencioso
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 px-4 md:px-0 mb-3">
          <Loader2 className="w-3 h-3 text-accent animate-spin" />
          <span className="text-[10px] font-mono text-text-muted">Cargando categorías...</span>
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3 px-4 md:px-0">
        Categorías
      </h3>

      <div className="flex overflow-x-auto snap-x scroll-smooth pb-4 px-4 md:px-0 gap-3 md:grid md:grid-cols-5 lg:grid-cols-6 md:overflow-visible no-scrollbar">
        {categories.map((cat) => {
          const parentIcon = PARENT_ICONS[cat.parentId] || PARENT_ICONS[1];
          const Icon = parentIcon.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id, cat.name)}
              className="flex-shrink-0 snap-start w-28 md:w-full p-4 bg-card border border-card-border hover:border-accent hover:bg-select-bg rounded-md flex flex-col items-center justify-center gap-3 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-10 h-10 rounded-full bg-icon-box flex items-center justify-center border border-card-border group-hover:bg-accent/10 transition-colors">
                <Icon className={`w-5 h-5 ${parentIcon.color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground text-center leading-tight">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
