import React from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, loading, onPageChange }) => {
  if (totalPages <= 1 || loading) return null;

  const getPageRange = () => {
    const delta = 2; // Páginas a mostrar a cada lado de la actual
    const range: (number | string)[] = [];
    range.push(1);
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    if (start > 2) range.push('...');
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    if (end < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  const pages = getPageRange();

  const handleGoToPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('pageInput') as HTMLInputElement;
    const page = parseInt(input.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      input.value = '';
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-12 py-8 border-t border-zinc-900">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((p, idx) => (
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="text-zinc-600 px-2">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-10 h-10 rounded-sm font-bold text-sm border transition-all ${currentPage === p ? 'bg-racing-orange border-racing-orange text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
          >
            {p}
          </button>
        )
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white hover:border-racing-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ArrowRight className="w-5 h-5" />
      </button>

      <form onSubmit={handleGoToPage} className="flex items-center gap-2 ml-4">
        <span className="text-zinc-500 text-xs">Ir a:</span>
        <input
          type="number"
          name="pageInput"
          min={1}
          max={totalPages}
          placeholder={currentPage.toString()}
          className="w-16 bg-zinc-900 border border-zinc-800 text-white text-sm px-2 py-2 rounded-sm focus:border-racing-orange focus:outline-none text-center"
        />
        <span className="text-zinc-600 text-xs">/ {totalPages}</span>
      </form>
    </div>
  );
};
