'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface RelatedItem {
  id: number;
  sku: string;
  name: string;
  brand: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image: string;
  co_count: number;
}

export default function FrequentlyBoughtTogether({ productId }: { productId: number }) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/catalog/frequently-bought-together/${productId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setItems(data || []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (productId) load();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading || items.length === 0) return null;

  const formatPrice = (cents: number) => (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className="mt-8 border border-card-border rounded-md p-5 bg-card/30">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-accent" />
        <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
          Comprado junto con
        </h2>
        <span className="text-[10px] font-mono text-text-muted ml-auto">
          {items.length} sugerencias
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.slice(0, 6).map((it) => {
          const price = it.sale_price ?? it.price;
          return (
            <a
              key={it.id}
              href={`/producto/${it.sku}`}
              className="group bg-card border border-card-border rounded-md overflow-hidden flex flex-col hover:border-accent/40 transition-colors"
            >
              <div className="aspect-square bg-background flex items-center justify-center overflow-hidden">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image}
                    alt={it.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-text-muted text-xs">Sin imagen</div>
                )}
              </div>
              <div className="p-2 flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase text-accent truncate">{it.brand}</span>
                <span className="text-[11px] text-foreground line-clamp-2 leading-tight min-h-[28px]">
                  {it.name}
                </span>
                <span className="text-xs font-bold text-foreground mt-0.5">
                  {formatPrice(price)}€
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({
                      id: it.id,
                      title: it.name,
                      name: it.name,
                      slug: it.sku,
                      price,
                      salePrice: it.sale_price ?? undefined,
                      sku: it.sku,
                      image: it.image || '',
                      inStock: it.stock > 0,
                      stock: it.stock,
                      category: it.brand,
                    } as any, 1);
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono uppercase font-bold rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                  aria-label={`Añadir ${it.name} al carrito`}
                >
                  <ShoppingCart className="w-3 h-3" /> Añadir
                </button>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
