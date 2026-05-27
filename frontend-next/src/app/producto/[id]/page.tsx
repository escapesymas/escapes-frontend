'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Bike, ChevronLeft, Loader2, AlertCircle, Ruler, Weight, Package } from 'lucide-react';
import { Product, ProductImage as ProductImageType } from '../../../types';
import { fetchProduct } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import Header from '../../../components/Header';

function ProductImage({ image, alt, priority }: { image: ProductImageType; alt: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded bg-icon-box flex items-center justify-center border border-card-border">
          <svg className="w-6 h-6 text-accent-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V12M12 18H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" /></svg>
        </div>
      </div>
    );
  }

  const srcDesktop = image.srcCardDesktop || image.src;
  const srcMobile = image.srcCardMobile || image.srcMobile || image.src;

  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={srcMobile} />
      <source media="(min-width: 768px)" srcSet={srcDesktop} />
      <img
        src={image.src}
        alt={alt}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? undefined : 'lazy'}
        className="w-full h-full object-contain p-4"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [compatSearch, setCompatSearch] = useState('');
  const [compatPage, setCompatPage] = useState(1);
  const [selectedBike, setSelectedBike] = useState<string>('');

  useEffect(() => {
    const active = localStorage.getItem('tg_selected_bike');
    if (active) {
      setSelectedBike(active);
    }
  }, []);

  useEffect(() => {
    setCompatPage(1);
  }, [compatSearch]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchProduct(id);
        if (!data) {
          setError('Producto no encontrado');
        } else {
          setProduct(data);
        }
      } catch {
        setError('Error al cargar el producto');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-text-muted" />
        <p className="text-sm font-mono text-text-muted">{error || 'Producto no encontrado'}</p>
        <a href="/" className="text-xs font-mono font-bold text-accent-text hover:underline">
          Volver a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => router.push('/?openSelector=true')}
        onCartClick={() => router.push('/?tab=cart')}
        onTabChange={(tab) => router.push(`/?tab=${tab}`)}
      />

      {/* Breadcrumbs (Migas de pan) */}
      <div className="bg-card border-b border-card-border/60 py-2.5 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1.5 font-mono text-[9px] text-text-muted uppercase tracking-wider">
          <a href="/" className="hover:text-foreground transition-colors font-bold">Inicio</a>
          <span>/</span>
          <span className="text-text-muted">{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      <main role="main" className="flex-grow max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-image-wrapper border border-card-border rounded-md p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px] overflow-hidden relative">
            <ProductImage
              image={product.images[0] || { src: product.image, alt: product.name }}
              alt={product.name}
              priority
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-tag text-tag-text border border-tag-border">
                  {product.brand}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-tag text-tag-text border border-tag-border">
                  {product.category}
                </span>
              </div>
              <h1 className="font-mono text-xl font-bold uppercase text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-[10px] font-mono text-text-muted">SKU: {product.sku}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-foreground">
                {product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
              {product.salePrice && (
                <span className="font-mono text-sm text-text-muted line-through">
                  {product.regularPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                {product.inStock ? 'En Stock' : 'Sin Stock'}
              </span>
              {product.dropshipping && (
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  Envío directo
                </span>
              )}
            </div>

            <button
              onClick={() => product && addToCart(product)}
              className="w-full py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              Añadir al carrito
            </button>

            <div className="border border-card-border rounded-md p-4">
              <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3">
                Especificaciones Técnicas
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {product.weight_g && (
                  <div className="flex items-center gap-2">
                    <Weight className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-foreground">
                      {(product.weight_g / 1000).toFixed(2)} kg
                    </span>
                  </div>
                )}
                {product.length_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.length_mm} mm
                    </span>
                  </div>
                )}
                {product.width_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.width_mm} mm
                    </span>
                  </div>
                )}
                {product.height_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.height_mm} mm
                    </span>
                  </div>
                )}
                {product.volume_cm3 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.volume_cm3} cm³
                    </span>
                  </div>
                )}
                {product.barcode && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-[10px] font-mono text-text-muted">EAN:</span>
                    <span className="text-[10px] font-mono text-foreground">{product.barcode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="mt-8 border border-card-border rounded-md p-6">
            <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3">
              Descripción
            </h2>
            <div
              className="text-xs text-foreground leading-relaxed font-sans prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {product.compatibility && product.compatibility.length > 0 && (() => {
          const normalize = (comp: any) => {
            if (typeof comp === 'object' && comp !== null) {
              return {
                brand: comp.brand || '',
                model: comp.model || '',
                year: comp.year ? String(comp.year) : '',
                cc: comp.cc ? String(comp.cc) : '',
                code: comp.code || ''
              };
            }
            const str = String(comp).trim();
            const yearMatch = str.match(/\((\d{4})\)$/);
            const year = yearMatch ? yearMatch[1] : '';
            const nameWithoutYear = yearMatch ? str.replace(/\((\d{4})\)$/, '').trim() : str;
            const ccMatch = nameWithoutYear.match(/\[(\d+)\]$/);
            const cc = ccMatch ? ccMatch[1] : '';
            const fullName = ccMatch ? nameWithoutYear.replace(/\[(\d+)\]$/, '').trim() : nameWithoutYear;
            const parts = fullName.split(' ');
            const brand = parts[0] || '';
            const model = parts.slice(1).join(' ') || '';
            return { brand, model, year, cc, code: '' };
          };

          const normalized = product.compatibility.map(normalize);
          const query = compatSearch.toLowerCase().trim();
          const filtered = normalized.filter(item => {
            if (!query) return true;
            return (
              item.brand.toLowerCase().includes(query) ||
              item.model.toLowerCase().includes(query) ||
              item.year.toLowerCase().includes(query) ||
              item.cc.toLowerCase().includes(query)
            );
          });

          // Sort: Brand ASC, Model ASC, CC DESC, Year DESC
          const sorted = [...filtered].sort((a, b) => {
            const brandCompare = a.brand.localeCompare(b.brand);
            if (brandCompare !== 0) return brandCompare;
            const modelCompare = a.model.localeCompare(b.model);
            if (modelCompare !== 0) return modelCompare;
            const ccA = parseInt(a.cc) || 0;
            const ccB = parseInt(b.cc) || 0;
            if (ccB !== ccA) return ccB - ccA;
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearB - yearA;
          });

          const pageSize = 15;
          const totalPages = Math.ceil(sorted.length / pageSize);
          const currentPage = Math.min(Math.max(1, compatPage), totalPages || 1);
          const offset = (currentPage - 1) * pageSize;
          const displayed = sorted.slice(offset, offset + pageSize);

          let lastGroupKey = '';

          return (
            <div className="mt-6 border border-card-border rounded-md p-6 bg-card/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                    Compatibilidad ({filtered.length})
                  </h2>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Indica el nombre de tu vehículo"
                    value={compatSearch}
                    onChange={(e) => setCompatSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 bg-select-bg border border-card-border rounded text-xs font-mono placeholder:text-text-muted text-foreground focus:outline-none focus:border-accent/50"
                  />
                  <svg className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {displayed.length > 0 ? (
                <div className="overflow-x-auto border border-card-border rounded">
                  <table className="w-full text-left border-collapse font-mono text-[10px]">
                    <thead>
                      <tr className="bg-select-bg border-b border-card-border text-text-muted font-bold">
                        <th className="p-2.5">Marca</th>
                        <th className="p-2.5">Modelo</th>
                        <th className="p-2.5">Cilindrada</th>
                        <th className="p-2.5">Año</th>
                        <th className="p-2.5">Características</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((item, idx) => {
                        const groupKey = `${item.brand} - ${item.model} [${item.cc}]`;
                        const showGroupHeader = groupKey !== lastGroupKey;
                        if (showGroupHeader) {
                          lastGroupKey = groupKey;
                        }

                        const groupLabel = `${item.brand} ${item.model} [${item.cc || '-'}]`;

                        return (
                          <React.Fragment key={idx}>
                            {showGroupHeader && (
                              <tr className="bg-slate-900 border-t border-b border-card-border font-bold text-foreground">
                                <td colSpan={5} className="p-2 text-left tracking-wide">
                                  {groupLabel.toUpperCase()}
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-select-bg/50 border-b border-card-border/50 text-foreground transition-colors">
                              <td className="p-2">{item.brand}</td>
                              <td className="p-2 text-accent-text font-bold">{item.model}</td>
                              <td className="p-2">{item.cc || '-'}</td>
                              <td className="p-2">{item.year}</td>
                              <td className="p-2 text-text-muted">-</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs font-mono text-text-muted py-4 text-center">Ningún vehículo coincide con la búsqueda.</p>
              )}

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCompatPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 border border-card-border hover:border-accent/40 rounded text-[9px] font-mono font-bold uppercase tracking-wider text-text-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isVisible = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 2;
                    const showEllipsis = (pageNum === 2 && currentPage > 4) || (pageNum === totalPages - 1 && currentPage < totalPages - 3);

                    if (!isVisible) {
                      if (showEllipsis) {
                        return <span key={i} className="text-text-muted px-1.5 text-xs font-bold">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCompatPage(pageNum)}
                        className={`px-2.5 py-1 font-mono text-[9px] font-bold rounded border transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-accent border-accent text-slate-950'
                            : 'border-card-border hover:border-accent/40 text-text-muted hover:text-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCompatPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 border border-card-border hover:border-accent/40 rounded text-[9px] font-mono font-bold uppercase tracking-wider text-text-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
