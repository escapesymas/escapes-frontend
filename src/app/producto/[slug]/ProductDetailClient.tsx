'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ShoppingCart, Bell, AlertCircle, Check, AlertTriangle, ChevronDown, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';
import { trackEvent as trackUmami } from '../../../lib/umami';
import { Product, ProductImage as ProductImageType, ProductVariant } from '../../../types';
import { fetchProductBySlug, refreshProductStock } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { sanitizeHTML } from '../../../lib/constants';
import { getProductSchema, getBreadcrumbSchema } from '../../../components/SchemaMarkup';
import Header from '../../../components/Header';
import ProductDetailSkeleton from '../../../components/ProductDetailSkeleton';
import NotifyMeModal from '../../../components/NotifyMeModal';
import VariantSelector from '../../../components/VariantSelector';
import ProductGallery from '../../../components/product/ProductGallery';
import CompatibilityList from '../../../components/product/CompatibilityList';
import { normalizeCompat, fitsBike, bikeLabel } from '../../../components/product/compat';
import { effectivePrice, formatEuro } from '../../../lib/pricing';

const FrequentlyBoughtTogether = dynamic(
  () => import('../../../components/FrequentlyBoughtTogether'),
  { ssr: false, loading: () => <div className="h-24 my-6 bg-card/20 animate-pulse rounded border border-card-border" /> }
);

const ProductReviews = dynamic(
  () => import('../../../components/ProductReviews'),
  { ssr: false, loading: () => <div className="h-32 my-6 bg-card/20 animate-pulse rounded border border-card-border" /> }
);

/** Sección plegable (abierta por defecto en escritorio y en la primera). */
function Section({ title, children, defaultOpen = false, id }: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; id?: string }) {
  return (
    <details id={id} open={defaultOpen} className="group border-b border-card-border">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{title}</h2>
        <ChevronDown className="w-4 h-4 text-text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

export default function ProductDetailClient({ slug, initialProduct }: { slug: string; initialProduct?: Product | null }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [selectedBike, setSelectedBike] = useState<string>('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem('tg_selected_bike');
    if (active) setSelectedBike(active);
  }, []);

  useEffect(() => {
    if (!product) return;
    trackEvent.viewItem(product);
    trackUmami('view_product_detail', { product_id: product.id, product_brand: product.brand, product_price: product.price });
  }, [product]);

  useEffect(() => {
    if (!slug || initialProduct) return;
    let cancelled = false;
    fetchProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data || !data.id) setError('Producto no encontrado');
        else setProduct(data);
      })
      .catch(() => { if (!cancelled) setError('Error al cargar el producto'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [slug, initialProduct]);

  // Stock en tiempo real del proveedor para productos de dropshipping/bajo pedido.
  useEffect(() => {
    if (!product || (!product.dropshipping && !product.ondemand)) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const data = await refreshProductStock(product.id);
        if (active && data && typeof data.stock === 'number') {
          setProduct((prev) => (prev && (prev.stock !== data.stock || prev.inStock !== data.inStock)
            ? { ...prev, stock: data.stock, inStock: data.inStock } : prev));
        }
      } catch { /* el stock mostrado sigue siendo el de la BD */ }
    }, 1000);
    return () => { active = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const compatRows = useMemo(() => (product?.compatibility || []).map(normalizeCompat), [product?.compatibility]);
  const fits = useMemo(() => (selectedBike ? fitsBike(compatRows, selectedBike) : null), [compatRows, selectedBike]);

  // Cambiar de variante (talla/color) sin recargar: misma ficha, otro SKU.
  const selectVariant = async (variant: ProductVariant) => {
    try {
      const next = await fetchProductBySlug(variant.slug);
      if (next && next.id) {
        setProduct(next);
        window.history.replaceState(null, '', `/producto/${variant.slug}`);
      }
    } catch {
      router.push(`/producto/${variant.slug}`);
    }
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-text-muted" />
        <p className="text-sm font-mono text-text-muted">{error || 'Producto no encontrado'}</p>
        <Link href="/universales" className="text-xs font-mono font-bold text-accent-text hover:underline">
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const inStock = product.inStock && product.stock > 0;
  const price = effectivePrice(product);
  const onSale = price < product.price;
  const images: ProductImageType[] = product.images?.length ? product.images : [{ src: product.image, alt: product.name } as ProductImageType];
  const description = product.description?.trim() || '';
  const specs: [string, string][] = [
    ['Marca', product.brand],
    ...Object.entries(product.attributes || {}),
    ...(product.weight_g ? [['Peso', product.weight_g >= 1000 ? `${(product.weight_g / 1000).toFixed(2)} kg` : `${product.weight_g} g`] as [string, string]] : []),
    ['Referencia', product.sku],
    ...(product.barcode ? [['EAN', product.barcode] as [string, string]] : []),
  ].filter(([, v]) => v) as [string, string][];

  const availability = inStock
    ? { dot: 'bg-emerald-500', text: product.dropshipping ? 'Disponible · envío en 3-5 días' : 'En stock · envío en 24 h' }
    : { dot: 'bg-red-500', text: 'Agotado' };

  const crumbs = [
    { name: 'Catálogo', href: '/universales' },
    ...(product.parentCategory && product.parentCategorySlug
      ? [{ name: product.parentCategory, href: `/universales/${product.parentCategorySlug}` }] : []),
    ...(product.category && product.categorySlug
      ? [{ name: product.category, href: product.parentCategorySlug ? `/universales/${product.parentCategorySlug}/${product.categorySlug}` : `/universales/${product.categorySlug}` }]
      : []),
  ];

  const handleBuy = () => {
    if (inStock) {
      addToCart(product);
      trackEvent.addToCart(product, 1);
    } else {
      setShowNotifyModal(true);
    }
  };

  const buyLabel = inStock
    ? <><ShoppingCart className="w-4 h-4" /> Añadir al carrito</>
    : <><Bell className="w-4 h-4" /> Avísame cuando vuelva</>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getProductSchema({
            name: product.name,
            description: description.replace(/<[^>]+>/g, ' ').slice(0, 500) || product.name,
            image: product.image,
            sku: product.sku,
            brand: product.brand,
            price,
            url: `https://escapesymas.com/producto/${slug}`,
            inStock,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getBreadcrumbSchema([
            { name: 'Inicio', url: '/' },
            ...crumbs.map((c) => ({ name: c.name, url: c.href })),
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

      <nav aria-label="Ruta" className="border-b border-card-border/60 bg-card">
        <ol className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5 text-[11px] text-text-muted overflow-x-auto no-scrollbar whitespace-nowrap">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              <Link href={c.href} className="hover:text-foreground">{c.name}</Link>
            </li>
          ))}
        </ol>
      </nav>

      <main className="flex-grow w-full max-w-6xl mx-auto pb-28 md:pb-12 md:px-4 md:pt-6">
        <div className="md:grid md:grid-cols-2 md:gap-10">
          <ProductGallery
            images={images}
            alt={product.name}
            badge={!inStock ? (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-600 text-white">Agotado</span>
            ) : onSale ? (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent text-slate-950">Oferta</span>
            ) : undefined}
          />

          <div className="px-4 md:px-0 pt-4 md:pt-0 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              {product.brand && (
                <Link
                  href={`/universales/buscar/${encodeURIComponent(product.brand)}`}
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent-text self-start"
                >
                  {product.brand}
                </Link>
              )}
              <h1 className="text-xl md:text-2xl font-semibold leading-snug text-foreground">{product.name}</h1>
              <p className="text-[11px] text-text-muted">Ref. {product.sku}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold font-mono text-foreground">{formatEuro(price)}</span>
              {onSale && <span className="text-sm text-text-muted line-through font-mono">{formatEuro(product.price)}</span>}
              <span className="text-[11px] text-text-muted">IVA incl.</span>
            </div>

            <p className="flex items-center gap-2 text-sm text-foreground">
              <span className={`w-2 h-2 rounded-full ${availability.dot}`} aria-hidden="true" />
              {availability.text}
              {inStock && product.stock <= 3 && <span className="text-xs font-semibold text-red-600">· últimas {product.stock} uds.</span>}
            </p>

            {compatRows.length > 0 && (
              fits === true ? (
                <p className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                  <Check className="w-4 h-4 shrink-0" /> Compatible con tu {bikeLabel(selectedBike)}
                </p>
              ) : fits === false ? (
                <p className="flex items-center gap-2 text-sm rounded-md px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> No figura como compatible con tu {bikeLabel(selectedBike)}
                </p>
              ) : (
                <a href="#compatibilidad" className="text-sm text-accent-text underline underline-offset-2 self-start">
                  Compatible con {compatRows.length} versiones de moto · comprueba la tuya
                </a>
              )
            )}

            {product.family && (
              <VariantSelector family={product.family} current={product.variantOptions || {}} onSelect={selectVariant} />
            )}

            <button
              type="button"
              onClick={handleBuy}
              className="hidden md:flex w-full py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all items-center justify-center gap-2 cursor-pointer"
            >
              {buyLabel}
            </button>

            <ul className="grid grid-cols-3 gap-2 text-[10px] text-text-muted text-center">
              <li className="flex flex-col items-center gap-1"><Truck className="w-4 h-4" aria-hidden="true" />Envío rápido</li>
              <li className="flex flex-col items-center gap-1"><RotateCcw className="w-4 h-4" aria-hidden="true" />Devolución 14 días</li>
              <li className="flex flex-col items-center gap-1"><ShieldCheck className="w-4 h-4" aria-hidden="true" />Pago seguro</li>
            </ul>

            <div className="border-t border-card-border mt-2">
              {description && (
                <Section title="Descripción" defaultOpen>
                  <div className={`relative ${descExpanded ? '' : 'max-h-56 overflow-hidden'}`}>
                    <div
                      className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(description) }}
                    />
                    {!descExpanded && description.length > 600 && (
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  {description.length > 600 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-2 text-xs font-mono font-bold uppercase text-accent-text cursor-pointer"
                    >
                      {descExpanded ? 'Leer menos' : 'Leer más'}
                    </button>
                  )}
                </Section>
              )}

              <Section title="Características" defaultOpen={!description}>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  {specs.map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt className="text-text-muted">{k}</dt>
                      <dd className="text-foreground break-words">{v}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </Section>

              {compatRows.length > 0 && (
                <Section id="compatibilidad" title={`Compatibilidad (${compatRows.length})`}>
                  <CompatibilityList rows={compatRows} />
                </Section>
              )}

              <Section title="Envío y devoluciones">
                <ul className="text-sm text-foreground space-y-1.5 list-disc pl-5">
                  <li>{product.dropshipping ? 'Envío directo desde el almacén del fabricante en 3-5 días laborables.' : 'Envío en 24-72 h desde nuestro almacén.'}</li>
                  <li>14 días naturales para devolverlo, sin usar ni montar. Los gastos de la devolución corren por tu cuenta salvo producto defectuoso o error nuestro.</li>
                  <li>Pago seguro con tarjeta, Bizum o Klarna.</li>
                </ul>
                <Link href="/devoluciones" className="inline-block mt-2 text-xs text-accent-text underline">Política de devoluciones</Link>
              </Section>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0">
          {product.id && <FrequentlyBoughtTogether productId={product.id} />}
          <section className="mt-8">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-4">Opiniones de clientes</h2>
            <ProductReviews productId={product.id} />
          </section>
        </div>
      </main>

      {/* Barra de compra fija en móvil: precio siempre visible + botón */}
      <div
        className="fixed bottom-0 inset-x-0 md:hidden bg-card border-t border-card-border px-4 pt-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex items-center gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold font-mono text-foreground">{formatEuro(price)}</span>
          {product.variantOptions && Object.keys(product.variantOptions).length > 0 && (
            <span className="text-[10px] text-text-muted truncate max-w-[9rem]">{Object.values(product.variantOptions).join(' · ')}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleBuy}
          className="flex-1 py-3 bg-accent text-slate-950 rounded font-mono text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {buyLabel}
        </button>
      </div>

      <NotifyMeModal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        productName={product.name}
        productId={product.id}
      />
    </div>
  );
}
