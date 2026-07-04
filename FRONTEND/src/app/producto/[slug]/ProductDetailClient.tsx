'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Bell, Bike, ChevronLeft, AlertCircle, Ruler, Weight, Package, Check } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';
import FrequentlyBoughtTogether from '../../../components/FrequentlyBoughtTogether';
import { Product, ProductCompatibility, ProductImage as ProductImageType } from '../../../types';
import { fetchProductBySlug } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { sanitizeHTML } from '../../../lib/constants';
import { getProductSchema, getBreadcrumbSchema } from '../../../components/SchemaMarkup';
import Header from '../../../components/Header';
import ProductImage from '../../../components/ProductImage';
import ProductDetailSkeleton from '../../../components/ProductDetailSkeleton';
import NotifyMeModal from '../../../components/NotifyMeModal';
import ProductReviews from '../../../components/ProductReviews';

export default function ProductDetailClient({ slug, initialProduct }: { slug: string; initialProduct?: Product | null }) {
  const router = useRouter();

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [compatSearch, setCompatSearch] = useState('');
  const [compatPage, setCompatPage] = useState(1);
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const images: ProductImageType[] = product?.images?.length
    ? product.images
    : product
      ? [{ src: product.image, alt: product.name } as ProductImageType]
      : [];

  const pickImage = (img: ProductImageType) => {
    const src = img.srcCardDesktop || img.srcMobile || img.src || '';
    const mobileSrc = img.srcCardMobile || img.srcMobile || '';
    return { src, mobileSrc };
  };

  const handleNotifyMe = () => {
    setShowNotifyModal(true);
  };

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
    if (product) trackEvent.viewItem(product);
  }, [product]);

  useEffect(() => {
    if (!slug || initialProduct) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchProductBySlug(slug);
        if (!cancelled) {
          if (!data) {
            setError('Producto no encontrado');
          } else {
            setProduct(data);
            setImgIdx(0);
          }
        }
      } catch {
        if (!cancelled) setError('Error al cargar el producto');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
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
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getProductSchema({
              name: product.name,
              description: product.description,
              image: product.image,
              sku: product.sku,
              brand: product.brand,
              price: product.price,
              url: `https://escapesymas.com/producto/${slug}`,
              inStock: product.inStock,
            })),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getBreadcrumbSchema([
            { name: 'Inicio', url: '/' },
            { name: product.category, url: `/${product.category.toLowerCase()}` },
            { name: product.name, url: `/producto/${slug}` },
          ])),
        }}
      />
      <Header
        selectedBike={selectedBike}
        onOpenBikeSelector={() => router.push('/?openSelector=true')}
        onCartClick={() => router.push('/?tab=cart')}
        onTabChange={(tab) => router.push(`/?tab=${tab}`)}
      />

      <div className="bg-card border-b border-card-border/60 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 font-mono text-[9px] text-text-muted uppercase tracking-wider">
          <a href="/" className="hover:text-foreground transition-colors font-bold">Inicio</a>
          <span>/</span>
          <span className="text-text-muted">{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      <main role="main" className="flex-grow max-w-7xl mx-auto px-0 py-0 w-full pb-24 md:pb-6">
        <div className="md:hidden flex flex-col">
          <div className="relative bg-image-wrapper border-b border-card-border">
            <div className="max-h-[50vh] aspect-square flex items-center justify-center p-6">
              <ProductImage
                src={pickImage(images[imgIdx]).src}
                srcDesktop={images[imgIdx]?.srcCardDesktop}
                srcMobile={images[imgIdx]?.srcCardMobile || images[imgIdx]?.srcMobile}
                alt={product.name}
                priority
                className="w-full h-full object-contain"
                wrapperClassName="w-full h-full"
              />
            </div>
            {(!product.inStock || product.stock === 0) && (
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-600/90 text-white border border-red-400/50 shadow-sm">
                  Agotado
                </span>
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex gap-1.5 px-3 py-2 overflow-x-auto bg-gradient-to-t from-black/50 to-transparent">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`shrink-0 w-10 h-10 rounded border-2 overflow-hidden transition-all cursor-pointer ${
                      i === imgIdx ? 'border-accent' : 'border-white/50 hover:border-white'
                    }`}
                  >
                    <img
                      src={pickImage(img).src}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-tag text-tag-text border border-tag-border">
                {product.brand}
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-tag text-tag-text border border-tag-border">
                {product.category}
              </span>
            </div>

            <h1 className="font-mono text-lg font-bold uppercase text-foreground leading-tight">
              {product.name}
            </h1>

            <p className="text-[9px] font-mono text-text-muted">SKU: {product.sku}</p>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-foreground">
                {product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
              {product.salePrice && (
                <span className="font-mono text-sm text-text-muted line-through">
                  {product.regularPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                {product.inStock ? 'En Stock' : 'Sin Stock'}
              </span>
              {product.inStock && product.stock > 0 && product.stock <= 5 && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white border border-red-300 animate-pulse">
                  {product.stock <= 2 ? '¡Última unidad!' : `¡Quedan ${product.stock}!`}
                </span>
              )}
              {product.inStock && product.stock > 5 && product.stock <= 20 && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-white border border-amber-300">
                  Pocas unidades
                </span>
              )}
              {product.dropshipping && (
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  Envío directo
                </span>
              )}
            </div>

            <details className="border border-card-border rounded-md">
              <summary className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider p-4 cursor-pointer list-none flex items-center justify-between select-none">
                Descripción
                <ChevronLeft className="w-3 h-3 rotate-90 text-text-muted" />
              </summary>
              <div className="px-4 pb-4 border-t border-card-border/60 pt-3">
                <div
                  className="text-xs text-foreground leading-relaxed font-sans prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.description) }}
                />
              </div>
            </details>

            <div className="border border-card-border rounded-md p-4">
              <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3">
                Especificaciones Técnicas
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {product.weight_g && (
                  <div className="flex items-center gap-2">
                    <Weight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {(product.weight_g / 1000).toFixed(2)} kg
                    </span>
                  </div>
                )}
                {product.length_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.length_mm} mm
                    </span>
                  </div>
                )}
                {product.width_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.width_mm} mm
                    </span>
                  </div>
                )}
                {product.height_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.height_mm} mm
                    </span>
                  </div>
                )}
                {product.volume_cm3 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-text-muted shrink-0" />
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

        <div className="hidden md:grid md:grid-cols-2 gap-8 px-4">
          <div className="flex gap-3 w-full">
            {images.length > 1 && (
              <div className="flex flex-col gap-2 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 rounded border-2 overflow-hidden transition-all cursor-pointer ${
                      i === imgIdx ? 'border-accent' : 'border-card-border hover:border-foreground/30'
                    }`}
                  >
                    <img
                      src={pickImage(img).src}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="bg-image-wrapper border border-card-border rounded-md p-8 flex items-center justify-center min-h-[500px] overflow-hidden relative flex-1">
              <ProductImage
                src={pickImage(images[imgIdx]).src}
                srcDesktop={images[imgIdx]?.srcCardDesktop}
                srcMobile={images[imgIdx]?.srcCardMobile || images[imgIdx]?.srcMobile}
                alt={product.name}
                priority
                className="w-full h-full object-contain p-4"
                wrapperClassName="w-full h-full"
              />
              {(!product.inStock || product.stock === 0) && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-600/90 text-white border border-red-400/50 shadow-sm">
                    Agotado
                  </span>
                </div>
              )}
            </div>
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

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                {product.inStock ? 'En Stock' : 'Sin Stock'}
              </span>
              {product.inStock && product.stock > 0 && product.stock <= 5 && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white border border-red-300 animate-pulse">
                  {product.stock <= 2 ? '¡Última unidad!' : `¡Quedan ${product.stock}!`}
                </span>
              )}
              {product.inStock && product.stock > 5 && product.stock <= 20 && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-white border border-amber-300">
                  Pocas unidades
                </span>
              )}
              {product.dropshipping && (
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  Envío directo
                </span>
              )}
            </div>

            {product.description && (
              <div className="border border-card-border rounded-md p-4">
                <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3">
                  Descripción
                </h2>
                <div
                  className="text-xs text-foreground leading-relaxed font-sans prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.description) }}
                />
              </div>
            )}

            <div className="border border-card-border rounded-md p-4">
              <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-3">
                Especificaciones Técnicas
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {product.weight_g && (
                  <div className="flex items-center gap-2">
                    <Weight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {(product.weight_g / 1000).toFixed(2)} kg
                    </span>
                  </div>
                )}
                {product.length_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.length_mm} mm
                    </span>
                  </div>
                )}
                {product.width_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.width_mm} mm
                    </span>
                  </div>
                )}
                {product.height_mm && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] font-mono text-foreground">
                      {product.height_mm} mm
                    </span>
                  </div>
                )}
                {product.volume_cm3 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-text-muted shrink-0" />
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

            {product && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (product.inStock && product.stock > 0) {
                      addToCart(product); trackEvent.addToCart(product, 1);
                      showToast({ message: 'Añadido al carrito', type: 'success' });
                    } else {
                      handleNotifyMe();
                    }
                  }}
                  className="w-full py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {product.inStock && product.stock > 0 ? (
                    <><ShoppingCart className="w-4 h-4" /> Añadir al carrito</>
                  ) : (
                    <><Bell className="w-4 h-4" /> Avísame cuando vuelva</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {product && (
          <div
            className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-card-border p-3 z-40 shadow-lg"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={() => {
                if (product.inStock && product.stock > 0) {
                  addToCart(product);
                  trackEvent.addToCart(product, 1);
                  showToast({ message: 'Añadido al carrito', type: 'success' });
                } else {
                  handleNotifyMe();
                }
              }}
              className="w-full py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {product.inStock && product.stock > 0 ? (
                <><ShoppingCart className="w-4 h-4" /> Añadir al carrito</>
              ) : (
                <><Bell className="w-4 h-4" /> Avísame cuando vuelva</>
              )}
            </button>
          </div>
        )}

        {product.compatibility && product.compatibility.length > 0 && (() => {
          const normalize = (comp: ProductCompatibility) => {
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
                              <tr className="bg-tag border-t border-b border-tag-border font-bold text-tag-text">
                                <td colSpan={5} className="p-2 text-left tracking-wide">
                                  {groupLabel.toUpperCase()}
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-tag/50 border-b border-tag-border/50 text-foreground transition-colors">
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

        {product && product.id && (
          <FrequentlyBoughtTogether productId={product.id} />
        )}

        <div className="mt-8">
          <h2 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider mb-4">
            Opiniones de Clientes
          </h2>
          <ProductReviews productId={product.id} />
        </div>

        <NotifyMeModal
          isOpen={showNotifyModal}
          onClose={() => setShowNotifyModal(false)}
          productName={product?.name || ''}
          productId={product?.id || 0}
        />
      </main>
    </div>
  );
}
