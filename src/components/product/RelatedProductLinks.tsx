import Link from 'next/link';
import { getImageUrl } from '../../lib/constants';

export interface RelatedLink {
  sku: string;
  name: string;
  brand: string | null;
  price: number;
  image: string | null;
}

/**
 * Enlaces a otras fichas en el HTML del servidor: es lo que permite a Google pasar de una ficha a otras
 * (antes cada ficha era un callejón sin salida y solo se llegaba a ellas por el sitemap o la paginación).
 */
export default function RelatedProductLinks({ items }: { items: RelatedLink[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="otros-productos" className="max-w-6xl mx-auto w-full px-4 pb-12">
      <h2 id="otros-productos" className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-4">
        Otros productos que te pueden interesar
      </h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <li key={it.sku}>
            <Link
              href={`/producto/${encodeURIComponent(it.sku)}`}
              prefetch={false}
              className="group h-full bg-card border border-card-border rounded-md overflow-hidden flex flex-col hover:border-accent/40 transition-colors"
            >
              <div className="aspect-square bg-background flex items-center justify-center overflow-hidden">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(it.image)} alt={it.name} loading="lazy" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-text-muted text-xs">Sin imagen</div>
                )}
              </div>
              <div className="p-2 flex flex-col gap-1">
                {it.brand && <span className="text-[9px] font-mono uppercase text-accent truncate">{it.brand}</span>}
                <span className="text-[11px] text-foreground line-clamp-2 leading-tight min-h-[28px]">{it.name}</span>
                <span className="text-xs font-bold text-foreground mt-0.5">
                  {it.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
