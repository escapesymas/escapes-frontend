
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Truck, ShieldCheck, Minus, Plus, ShoppingCart, Hash, AlertCircle, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { STORE_CONFIG } from '../storeData';
import { optimizeImage } from '../utils/imageOptimizer';
import { cleanProductTitle } from '../utils/productUtils';
import { fetchProducts, fetchProductCompatibility } from '../services/apiService';
import { ProductCard } from './ProductCard';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart?: (quantity: number, productOverride?: Product) => void;
  onProductClick?: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart, onProductClick }) => {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [compatibilityBikes, setCompatibilityBikes] = useState<{ brand: string, model: string, year?: string }[]>([]);
  const [loadingComp, setLoadingComp] = useState(false);
  const [liveStock, setLiveStock] = useState<{ status: 'InStock' | 'Short' | 'OutOfStock' | 'Loading'; quantity?: number }>({ status: 'Loading' });

  const [activeProduct, setActiveProduct] = useState<Product>(product);
  const [variants, setVariants] = useState<Product[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    setActiveProduct(product);
  }, [product.id]);

  useEffect(() => {
    const loadVariants = async () => {
      if (!product.sku) return;
      setLoadingVariants(true);
      try {
        const res = await fetch(`/api/catalog/product-by-sku/${encodeURIComponent(product.sku)}/variants`);
        if (res.ok) {
          const data = await res.json();
          setVariants(data);
        }
      } catch (err) {
        console.error('Error loading variants:', err);
      } finally {
        setLoadingVariants(false);
      }
    };
    loadVariants();
  }, [product.sku, product.id]);

  const colorTranslationMap: Record<string, string> = {
    'BLK': 'NEGRO',
    'BLU': 'AZUL',
    'WHT': 'BLANCO',
    'ORG': 'NARANJA',
    'NYE': 'AMARILLO FLUOR',
    'RED': 'ROJO',
    'DRE': 'ROJO OSCURO',
    'GRN': 'VERDE',
    'YEL': 'AMARILLO',
    'GRY': 'GRIS',
    'PNK': 'ROSA',
    'BRN': 'MARRÓN',
    'SIL': 'PLATA',
    'GLD': 'ORO',
    'PUR': 'PÚRPURA',
    'NVY': 'AZUL MARINO',
    'KHK': 'CAQUI',
    'MNT': 'MENTA',
    'CAM': 'CAMUFLAJE'
  };

  const translateColor = (col: string) => {
    const clean = col.trim().toUpperCase();
    return colorTranslationMap[clean] || clean;
  };

  // Helper to extract Size and Color from a product item
  const extractSizeAndColor = (item: Product) => {
    let size = '';
    let color = '';
    
    if (item.attributes) {
      try {
        const attrs = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
        size = attrs.size || '';
        color = attrs.color || '';
      } catch (e) {}
    }
    
    if (!size || !color) {
      const parts = item.title.split(',').map(p => p.trim());
      const specParts = parts.slice(1);
      
      const sizeRegex = /^(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|XXL|XXXL|Y?[XSML]|(US|EU|UK|YTH)?\s*\d{2,3})$/i;
      const isSizeWord = (str: string) => 
        ['pequeña', 'mediana', 'grande', 'small', 'medium', 'large', 'talla', 'talle', 'size', 'talla:'].some(s => str.toLowerCase().includes(s));
      
      specParts.forEach(part => {
        if (sizeRegex.test(part) || isSizeWord(part)) {
          if (!size) size = part;
        } else {
          if (!color) color = part;
        }
      });
    }
    
    return {
      size: size.trim().toUpperCase() || 'ÚNICA',
      color: translateColor(color) || 'GENERAL'
    };
  };

  // Get active size and color
  const activeSpecs = extractSizeAndColor(activeProduct);
  const activeSize = activeSpecs.size;
  const activeColor = activeSpecs.color;

  // Sync selectedColor state when active product changes
  useEffect(() => {
    if (activeColor && activeColor !== 'GENERAL') {
      setSelectedColor(activeColor);
    }
  }, [activeColor]);

  // Parse all variants
  const parsedVariants = variants.map(v => {
    const specs = extractSizeAndColor(v);
    return {
      ...v,
      parsedSize: specs.size,
      parsedColor: specs.color
    };
  });

  // Extract unique colors across all variants
  const uniqueColors = Array.from(new Set(parsedVariants.map(v => v.parsedColor)))
    .filter(c => c && c !== 'GENERAL');

  // Filter sizes available for the currently selected color
  const currentFilteredColor = selectedColor || activeColor;
  const sizesForSelectedColor = parsedVariants.filter(v => 
    v.parsedColor === currentFilteredColor || (uniqueColors.length === 0 && v.parsedColor === 'GENERAL')
  );

  // Sort sizes in natural order (S, M, L, XL, 2XL...)
  const sizeOrder: Record<string, number> = {
    'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, '2XL': 7, 'XXL': 7, '3XL': 8, 'XXXL': 8, '4XL': 9, '5XL': 10
  };
   
  const sortedSizes = [...sizesForSelectedColor].sort((a, b) => {
    const orderA = sizeOrder[a.parsedSize] || 100;
    const orderB = sizeOrder[b.parsedSize] || 100;
    if (orderA !== orderB) return orderA - orderB;
    return a.parsedSize.localeCompare(b.parsedSize, undefined, { numeric: true });
  });

  useEffect(() => {
    const fetchLiveStock = async () => {
      if (!activeProduct.sku) {
        setLiveStock({ status: 'OutOfStock', quantity: 0 });
        return;
      }
      try {
        setLiveStock({ status: 'Loading' });
        const res = await fetch(`/api/bihr/stock?productCode=${encodeURIComponent(activeProduct.sku)}`);
        if (!res.ok) throw new Error('Error de red');
        const data = await res.json();
        setLiveStock({ status: data.status, quantity: data.quantity });
      } catch (err) {
        console.error('Error fetching live stock:', err);
        setLiveStock({ 
          status: activeProduct.inStock ? 'InStock' : 'OutOfStock', 
          quantity: activeProduct.inStock ? 5 : 0 
        });
      }
    };

    fetchLiveStock();
  }, [activeProduct.sku, activeProduct.inStock]);

  // Image Fallback State
  const [imgSrc, setImgSrc] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  // Get all images (use main image as fallback if no images array)
  const allImages = activeProduct.images && activeProduct.images.length > 0
    ? activeProduct.images.map(img => img.src)
    : [activeProduct.image];

  const currentImageObj = activeProduct.images && activeProduct.images[selectedImageIndex];
  const currentImage = currentImageObj ? currentImageObj.src : activeProduct.image;
  const currentMobileImage = currentImageObj ? currentImageObj.srcMobile : null;

  // Reset image state when selection changes or product changes
  useEffect(() => {
    const opt = optimizeImage(currentImage, { width: 800 });
    setImgSrc(opt);
    setImageError(false);
  }, [currentImage, activeProduct.id]);

  // Fetch related products
  useEffect(() => {
    const loadRelated = async () => {
      setLoadingRelated(true);
      try {
        let searchQuery: string | undefined;
        let currentDim: string | undefined;
        let upsellItems: Product[] = [];

        // 1. TIRE RECOMMENDATION LOGIC
        if (activeProduct.categoryId === 296) {
          const dimMatch = activeProduct.title.match(/(\d{2,3}[\/\-\s]\d{2,3}[\/\-\s]?R?\d{2})/i);
          if (dimMatch) {
            currentDim = dimMatch[0].toLowerCase().replace(/[\/\-\s]/g, '');
            searchQuery = dimMatch[0].replace(/[/\-]/g, ' ');
          }
        }

        // 2. EXHAUST UPSELLING LOGIC (Marketing Strategy)
        const isExhaust = activeProduct.title.toLowerCase().includes('escape') ||
          activeProduct.title.toLowerCase().includes('silencioso') ||
          activeProduct.category?.toLowerCase().includes('escape');

        if (isExhaust) {
          // Fetch high-margin items to help user reach next tier
          const { products: maintenance } = await fetchProducts("aceite filtro bujia motul hiflo", undefined, 1, 4);
          upsellItems = maintenance;
        }

        // 3. STANDARD RELATED FETCH
        const { products } = await fetchProducts(searchQuery, activeProduct.categoryId, 1, 20);

        let filtered = products.filter(p => p.id !== activeProduct.id);

        if (currentDim) {
          filtered = filtered.filter(p => {
            const pMatch = p.title.match(/(\d{2,3}[\/\-\s]\d{2,3}[\/\-\s]?R?\d{2})/i);
            if (!pMatch) return false;
            const pDim = pMatch[0].toLowerCase().replace(/[\/\-\s]/g, '');
            return pDim === currentDim;
          });
        }

        // Combine standard and upsell items
        // We put upsell items first if it's an exhaust
        const finalResults = [...upsellItems, ...filtered]
          .filter((p, index, self) => self.findIndex(t => t.id === p.id) === index) // Unique
          .sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? -1 : 1;
          })
          .slice(0, 4);

        setRelatedProducts(finalResults);
      } catch (error) {
        console.error('Error loading related products:', error);
      }
      setLoadingRelated(false);
    };

    if (activeProduct.categoryId) {
      loadRelated();
    }
  }, [activeProduct.id, activeProduct.categoryId]);

  // Fetch compatibility table
  useEffect(() => {
    const loadComp = async () => {
      setLoadingComp(true);
      try {
        const bikes = await fetchProductCompatibility(activeProduct.id);
        setCompatibilityBikes(bikes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComp(false);
      }
    };
    loadComp();
  }, [activeProduct.id]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrevImage = () => {
    setSelectedImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const hasDiscount = product.regularPrice > product.price;
  const displayDescription = product.shortDescription || product.description || "Sin descripción técnica disponible.";

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen animate-fade-in pb-20 pt-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 mb-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <button onClick={() => onProductClick?.({ id: 0 } as any)} className="hover:text-racing-orange transition-colors">Inicio</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={onBack} className="hover:text-racing-orange transition-colors">{product.category || 'Catálogo'}</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-600 dark:text-zinc-500 truncate max-w-[200px]">{cleanProductTitle(product.title)}</span>
          </nav>

          <div className="flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-racing-orange dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al catálogo
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${copied ? 'bg-green-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Compartir'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square group">
              {/* Advanced Responsive Image */}
              {!imageError ? (
                <picture className="w-full h-full block">
                  {currentMobileImage && (
                    <source media="(max-width: 640px)" srcSet={currentMobileImage} type="image/webp" />
                  )}
                  <img
                    src={optimizeImage(currentImage, { width: 550, height: 550 })} // Exactly 550x550 for mobile LCP
                    srcSet={`
                        ${optimizeImage(currentImage, { width: 400, height: 400, format: 'webp' })} 400w,
                        ${optimizeImage(currentImage, { width: 550, height: 550, format: 'webp' })} 550w,
                        ${optimizeImage(currentImage, { width: 800, height: 800, format: 'webp' })} 800w,
                        ${optimizeImage(currentImage, { width: 1100, height: 1100, format: 'webp' })} 1100w
                      `}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
                    alt={activeProduct.title}
                    loading="eager"
                    // @ts-ignore
                    fetchPriority="high"
                    width="800"
                    height="800"
                    className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                    onError={() => setImageError(true)}
                  />
                </picture>
              ) : (
                <img
                  src={currentImage} // Original URL fallback
                  alt={activeProduct.title}
                  width="800"
                  height="800"
                  className="w-full h-full object-contain p-8"
                />
              )}

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/10 hover:bg-black/20 dark:bg-black/50 dark:hover:bg-black/80 text-zinc-900 dark:text-white p-2 rounded-full transition-colors"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/10 hover:bg-black/20 dark:bg-black/50 dark:hover:bg-black/80 text-zinc-900 dark:text-white p-2 rounded-full transition-colors"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/70 text-zinc-900 dark:text-white text-xs px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-sm overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-racing-orange'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                      }`}
                  >
                    <img
                      src={optimizeImage(img, { width: 150 })}
                      onError={(e) => {
                        // Fallback for thumbnails directly to src
                        e.currentTarget.src = img;
                      }}
                      alt={`${product.title} - Imagen ${index + 1}`}
                      width="80"
                      height="80"
                      className="w-full h-full object-contain bg-white p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-racing-orange font-bold uppercase tracking-widest text-xs">{activeProduct.category}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white uppercase italic leading-none pr-2">{cleanProductTitle(activeProduct.title)}</h1>
              
              <div className="flex-shrink-0">
                <div className="bg-zinc-900 dark:bg-zinc-800 border-2 border-racing-orange/30 px-4 py-2 rounded-sm shadow-lg shadow-racing-orange/5 flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-racing-orange leading-none mb-1">Referencia Art.</span>
                  <span className="text-xl font-black text-white font-mono tracking-wider">{activeProduct.sku}</span>
                </div>
              </div>
            </div>

            <div className="relative mb-6">
              <div
                className="prose prose-zinc dark:prose-invert prose-sm text-zinc-600 dark:text-zinc-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: displayDescription }}
              />
            </div>

            {/* VARIANTES Y TALLAS */}
            {!loadingVariants && variants.length > 1 && (
              <div className="mb-6 p-6 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-5">
                {/* 1. Selector de Colores (si hay varios) */}
                {uniqueColors.length > 1 && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-2.5">
                      Color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((colorName: string) => {
                        const isSelected = (selectedColor || activeColor) === colorName;
                        return (
                          <button
                            key={colorName}
                            onClick={() => {
                              setSelectedColor(colorName);
                              // Match sibling with the same size
                              const matchingSize = parsedVariants.find(v => v.parsedColor === colorName && v.parsedSize === activeSize);
                              const fallback = parsedVariants.find(v => v.parsedColor === colorName);
                              const target = matchingSize || fallback;
                              if (target) {
                                setActiveProduct(target);
                                setSelectedImageIndex(0);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-sm border transition-all duration-200 ${
                              isSelected
                                ? 'bg-racing-orange border-racing-orange text-white shadow-sm scale-105'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            {colorName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Selector de Tallas */}
                {sortedSizes.length > 0 && !(sortedSizes.length === 1 && sortedSizes[0].parsedSize === 'ÚNICA') && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-2.5">
                      Talla {activeSize !== 'ÚNICA' ? `(${activeSize})` : ''}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sortedSizes.map((v: any) => {
                        const isSelected = activeProduct.sku === v.sku;
                        const isOutOfStock = v.stock === 0;

                        return (
                          <button
                            key={v.sku}
                            onClick={() => {
                              setActiveProduct(v);
                              setSelectedImageIndex(0);
                            }}
                            className={`px-4 py-2.5 text-xs font-black uppercase rounded-sm border transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[3.5rem] ${
                              isSelected
                                ? 'bg-racing-orange border-racing-orange text-white shadow-md scale-105'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
                            } ${isOutOfStock ? 'opacity-55' : ''}`}
                          >
                            {v.parsedSize}
                            {isOutOfStock && <span className="text-[9px] font-bold text-racing-red">(Agotado)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-racing-carbon p-8 rounded-sm border border-zinc-200 dark:border-zinc-800 mb-8 shadow-sm dark:shadow-xl">
              <div className="flex flex-col mb-8">
                {hasDiscount && (
                  <span className="text-racing-red text-xl font-bold line-through mb-1">
                    {formatPrice(activeProduct.regularPrice)}
                  </span>
                )}
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-zinc-900 dark:text-white">
                    {formatPrice(activeProduct.price)}
                  </span>
                  <span className="text-zinc-500 text-sm font-bold pb-2 uppercase tracking-tighter">Impuestos incluidos</span>
                </div>
              </div>

              {/* Live Bihr Stock Status Indicator */}
              <div className="mb-6 p-4 rounded-sm border bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      {liveStock.status === 'Loading' ? (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                      ) : liveStock.status === 'InStock' ? (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      ) : liveStock.status === 'Short' ? (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      ) : (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        liveStock.status === 'Loading' ? 'bg-zinc-500' :
                        liveStock.status === 'InStock' ? 'bg-emerald-500' :
                        liveStock.status === 'Short' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                    </span>
                    Stock Almacén Central
                  </span>
                  
                  <span className="text-[10px] font-black uppercase text-zinc-400 font-mono">STOCK LIVE SYNC</span>
                </div>

                <div className="text-sm font-extrabold tracking-tight uppercase italic">
                  {liveStock.status === 'Loading' ? (
                    <span className="text-zinc-500 dark:text-zinc-400 animate-pulse">Comprobando disponibilidad en vivo...</span>
                  ) : liveStock.status === 'InStock' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">🟢 Disponible ({liveStock.quantity || 1} uds. listas para envío)</span>
                  ) : liveStock.status === 'Short' ? (
                    <span className="text-amber-600 dark:text-amber-400">🟡 Últimas unidades disponibles ({liveStock.quantity} uds.)</span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">🔴 Agotado temporalmente en fabricante</span>
                  )}
                </div>
                
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-tight">
                  {liveStock.status === 'InStock' || liveStock.status === 'Short'
                    ? 'Preparación y salida inmediata en menos de 24 horas laborables.'
                    : 'Puedes solicitar aviso de reposición automática o contactar con soporte.'}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-3 text-zinc-500 hover:text-racing-orange transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-zinc-900 dark:text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-4 py-3 text-zinc-500 hover:text-racing-orange transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onAddToCart?.(quantity, activeProduct)}
                    className="flex-grow bg-racing-orange hover:bg-black text-white font-black uppercase tracking-widest py-4 rounded-sm transition-all shadow-lg shadow-orange-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
                  >
                    Añadir al Carrito <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Trust & Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-sm">
                    <Truck className="w-5 h-5 text-racing-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase italic text-zinc-900 dark:text-white">Envío 24/48h</p>
                      <p className="text-[10px] text-zinc-500 leading-tight">Entrega rápida en toda la península.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-sm">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase italic text-zinc-900 dark:text-white">Garantía Oficial</p>
                      <p className="text-[10px] text-zinc-500 leading-tight">Producto 100% original garantizado.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-2 opacity-50 grayscale scale-75">
                  <img src="/Visa_Inc._logo_(2021–present).svg" alt="Visa" width="48" height="14" className="h-3.5 w-auto object-contain" style={{ height: '14px' }} />
                  <svg className="w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="29" height="18" style={{ height: '18px' }} aria-label="Mastercard">
                    <circle cx="7" cy="7.5" r="7" fill="#EB001B"/>
                    <circle cx="17" cy="7.5" r="7" fill="#F79E1B"/>
                    <path d="M12 11.16a6.96 6.96 0 0 1-1.84-3.66 6.96 6.96 0 0 1 1.84-3.66c1.1 1 1.84 2.24 1.84 3.66s-.73 2.66-1.84 3.66Z" fill="#FF5F00"/>
                  </svg>
                  <svg className="w-auto" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="14" style={{ height: '14px' }} aria-label="PayPal">
                    <path d="M7.74 2.3A4.54 4.54 0 0 0 3.2 6.84c0 .88.22 1.73.66 2.47L7.4 21.6A.75.75 0 0 0 8.1 22h3.9c.53 0 .9-.55.72-1.05l-2.43-6.9a.75.75 0 0 1 .71-.99h4.6a4.54 4.54 0 0 0 4.54-4.54c0-2.5-2.03-4.53-4.54-4.53H7.74Z" fill="#003087"/>
                    <path d="M10.84 8.7a4.54 4.54 0 0 0-4.54 4.54c0 .88.22 1.73.66 2.47l3.54 12.28A.75.75 0 0 0 11.2 28h3.9c.53 0 .9-.55.72-1.05l-2.43-6.9a.75.75 0 0 1 .71-.99h4.6a4.54 4.54 0 0 0 4.54-4.54c0-2.5-2.03-4.53-4.54-4.53h-7.76Z" fill="#0079C1" opacity="0.8"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* NEW: Compatibility Table Block */}
            <div className="mb-6">
              <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-sm bg-zinc-50 dark:bg-zinc-900/10">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-sm font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Lista de Aplicaciones</h2>
                </div>

                <div className="space-y-3">
                  {loadingComp ? (
                    <div className="py-4 animate-pulse space-y-2">
                       <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                       <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                    </div>
                  ) : compatibilityBikes.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase text-zinc-500 font-black border-b border-zinc-200 dark:border-zinc-800">
                            <th className="pb-2">Marca</th>
                            <th className="pb-2">Modelo</th>
                            <th className="pb-2">Año</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {compatibilityBikes.map((bike, idx) => (
                            <tr key={idx} className="text-xs">
                              <td className="py-2 font-bold text-zinc-700 dark:text-zinc-300">{bike.brand}</td>
                              <td className="py-2 text-zinc-600 dark:text-zinc-400 italic">{bike.model}</td>
                              <td className="py-2 text-zinc-500">{bike.year || 'Todos'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-zinc-500 font-bold uppercase tracking-tighter">Aplicación Principal</span>
                        <span className="text-zinc-900 dark:text-white font-black italic uppercase">
                          {(() => {
                            const titleComp = product.title.match(/(Honda|Yamaha|KTM|BMW|Suzuki|Kawasaki|Ducati|Aprilia|Triumph|Kymco)\s+([A-Z0-9\-\s\/]+?)(?=\s|\||\(|$)/i);
                            return titleComp ? `${titleComp[1]} ${titleComp[2]}`.trim() : 'Multimarca / Universal';
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="bg-zinc-100/50 dark:bg-zinc-800/20 p-3 rounded-sm mt-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                      * Verificado según catálogo de fabricante. Si tienes dudas sobre el año exacto o versión, contáctanos antes de comprar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm bg-gray-50 dark:bg-zinc-900/30 flex items-center gap-4">
                <div className="bg-racing-orange/10 p-2 rounded-sm">
                  <Truck className="w-6 h-6 text-racing-orange" />
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white text-sm font-bold uppercase leading-tight">Envío 24/48h</p>
                  <p className="text-zinc-500 text-xs">Despacho rápido desde almacén central</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-sm border border-zinc-200 dark:border-zinc-800/50">
              <AlertCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-zinc-500 leading-tight">
                Nota logística: El despacho de piezas en stock se realiza en 24/48h. El tiempo final de entrega depende exclusivamente de la agencia de transporte seleccionada.
              </p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white uppercase italic mb-8">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(relProduct => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onClick={() => {
                    if (onProductClick) {
                      onProductClick(relProduct);
                    } else {
                      const slugSuffix = relProduct.slug ? `-${relProduct.slug}` : '';
                      window.location.href = `/${relProduct.categorySlug || 'recambios'}/${relProduct.id}${slugSuffix}`;
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {loadingRelated && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white uppercase italic mb-8">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-zinc-100 dark:bg-zinc-900 rounded-sm h-64 animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
