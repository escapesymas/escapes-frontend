'use client';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
  className?: string;
}

export default function RatingStars({
  rating,
  count = 0,
  size = 'xs',
  showCount = true,
  className = '',
}: RatingStarsProps) {
  const safe = Math.max(0, Math.min(5, rating));
  const full = Math.floor(safe);
  const half = safe - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const sizeClass =
    size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textClass =
    size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm';

  if (count === 0) {
    return (
      <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label="Sin valoraciones">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} filled={false} half={false} sizeClass={sizeClass} />
        ))}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={`${rating.toFixed(1)} de 5 estrellas (${count} valoraciones)`}>
      <span className={`inline-flex items-center gap-0.5`}>
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} filled={true} half={false} sizeClass={sizeClass} />
        ))}
        {half && <Star key="h" filled={true} half={true} sizeClass={sizeClass} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} filled={false} half={false} sizeClass={sizeClass} />
        ))}
      </span>
      {showCount && (
        <span className={`${textClass} text-muted-foreground`}>
          {safe.toFixed(1)}
          <span className="opacity-60"> ({count})</span>
        </span>
      )}
    </div>
  );
}

function Star({ filled, half, sizeClass }: { filled: boolean; half: boolean; sizeClass: string }) {
  if (filled && !half) {
    return (
      <svg className={`${sizeClass} text-accent`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L10 14.5 4.5 17.6l1.4-6.1L1.2 7.3l6.2-.6L10 1z" />
      </svg>
    );
  }
  if (filled && half) {
    return (
      <svg className={`${sizeClass} text-accent`} viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>
        <path
          d="M10 1l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L10 14.5 4.5 17.6l1.4-6.1L1.2 7.3l6.2-.6L10 1z"
          fill="url(#half)"
        />
      </svg>
    );
  }
  return (
    <svg className={`${sizeClass} text-muted-foreground/40`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L10 14.5 4.5 17.6l1.4-6.1L1.2 7.3l6.2-.6L10 1z" />
    </svg>
  );
}
