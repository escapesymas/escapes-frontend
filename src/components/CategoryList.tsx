'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame, ShieldAlert, Cpu, Disc, Wrench, Layers, Package,
  User, Droplets, Circle, Loader2, Settings, Wind, Disc3,
  Zap, Fuel, Globe, Bike, Palette, Headphones, HardHat, Truck
} from 'lucide-react';
import { Category3 } from '../types';
import { fetchCategories } from '../lib/api';

interface CategoryListProps {
  onSelectCategory: (id: number, name: string) => void;
  selectedCategoryId?: number;
}

const PARENT_ICONS: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1001: { icon: ShieldAlert, color: 'text-violet-500' },
  1002: { icon: Settings, color: 'text-blue-500' },
  1003: { icon: Bike, color: 'text-lime-500' },
  1004: { icon: Zap, color: 'text-yellow-500' },
  1005: { icon: User, color: 'text-pink-500' },
  1006: { icon: Package, color: 'text-amber-500' },
  1007: { icon: Wind, color: 'text-cyan-500' },
  1008: { icon: Disc3, color: 'text-red-500' },
  1009: { icon: Wrench, color: 'text-stone-500' },
  1010: { icon: Droplets, color: 'text-teal-500' },
  1011: { icon: Headphones, color: 'text-indigo-500' },
  1012: { icon: Fuel, color: 'text-orange-500' },
  1013: { icon: HardHat, color: 'text-sky-500' },
  1014: { icon: Globe, color: 'text-emerald-500' },
  1015: { icon: Settings, color: 'text-rose-500' },
  1016: { icon: Palette, color: 'text-fuchsia-500' },
  1017: { icon: Truck, color: 'text-slate-500' },
};

export default function CategoryList({ onSelectCategory, selectedCategoryId }: CategoryListProps) {
  const [categories, setCategories] = useState<Category3[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchCategories();
        if (!cancelled) setCategories(data);
      } catch {
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
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
        {categories.filter(c => c.parentId !== 0).map((cat) => {
          const parentIcon = PARENT_ICONS[cat.parentId] || PARENT_ICONS[1001];
          const Icon = parentIcon.icon;
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id, cat.name)}
              className={`flex-shrink-0 snap-start w-28 md:w-full p-4 bg-card border rounded-md flex flex-col items-center justify-center gap-3 transition-all cursor-pointer shadow-sm group ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-card-border hover:border-accent hover:bg-select-bg'
              }`}
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
