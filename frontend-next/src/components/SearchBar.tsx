'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Buscar por referencia, SKU o nombre...",
  initialValue = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-card/65 backdrop-blur-md border border-card-border rounded-md shadow-sm transition-all focus-within:border-accent/50 focus-within:shadow-md">
        
        {/* Lupa / Loading */}
        <div className="absolute left-4 text-text-muted">
          {isLoading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin text-accent" />
          ) : (
            <Search className="w-4.5 h-4.5" />
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3 bg-transparent text-foreground text-xs md:text-sm font-sans placeholder-text-muted/60 border-0 focus:outline-none focus:ring-0"
        />

        {/* Botones de acción en la derecha */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-icon-box/50 rounded-sm text-text-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            type="submit"
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-slate-950 font-mono font-bold text-[10px] uppercase rounded-sm transition-all cursor-pointer shadow-sm"
          >
            Buscar
          </button>
        </div>

      </div>
    </form>
  );
}
