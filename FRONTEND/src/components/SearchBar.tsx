import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchSuggestion {
  name: string;
  slug: string;
  category?: string;
}

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
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      setQuery(suggestions[selectedIndex].name);
      setShowSuggestions(false);
      onSearch(suggestions[selectedIndex].name);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto" suppressHydrationWarning>
      <div className="relative">
        <div className="relative flex items-center bg-card/65 backdrop-blur-md border border-card-border rounded-md shadow-sm transition-all focus-within:border-accent/50 focus-within:shadow-md">
          
          <div className="absolute left-4 text-text-muted">
            {isLoadingSuggestions ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-accent" />
            ) : (
              <Search className="w-4.5 h-4.5" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            suppressHydrationWarning
            placeholder={placeholder}
            className="w-full pl-11 pr-24 py-3 bg-transparent text-foreground text-xs md:text-sm font-sans placeholder-text-muted/60 border-0 focus:outline-none focus:ring-0"
            autoComplete="off"
          />

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

        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-card-border rounded-md shadow-xl z-50 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.slug}
                type="button"
                onClick={() => {
                  setQuery(suggestion.name);
                  setShowSuggestions(false);
                  onSearch(suggestion.name);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                  index === selectedIndex 
                    ? 'bg-accent/10 text-foreground' 
                    : 'text-text-muted hover:bg-card-border/50'
                }`}
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-foreground block truncate">
                    {suggestion.name}
                  </span>
                  {suggestion.category && (
                    <span className="text-[9px] text-text-muted font-mono">
                      {suggestion.category}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}