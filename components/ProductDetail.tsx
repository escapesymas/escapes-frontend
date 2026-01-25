
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Truck, ShieldCheck, Minus, Plus, ShoppingCart, Hash, AlertCircle, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { STORE_CONFIG } from '../storeData';
import { optimizeImage } from '../utils/imageOptimizer';
import { fetchProducts } from '../services/woocommerce';
import { ProductCard } from './ProductCard';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart?: (quantity: number) => void;
  onProductClick?: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart, onProductClick }) => {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Image Fallback State
  const [imgSrc, setImgSrc] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  // Get all images (use main image as fallback if no images array)
  const allImages = product.images && product.images.length > 0
    ? product.images.map(img => img.src)
    : [product.image];

  const currentImage = allImages[selectedImageIndex] || product.image;

  // Reset image state when selection changes or product changes
  useEffect(() => {
    // Attempt to use optimized version first
    const opt = optimizeImage(currentImage, { width: 800 });
    setImgSrc(opt);
    setImageError(false);
  }, [currentImage, product.id]);

  // Fetch related products
  useEffect(() => {
    const loadRelated = async () => {
      setLoadingRelated(true);
      try {
        const { products } = await fetchProducts(undefined, product.categoryId, 1, 5);
        // Filter out the current product
        const filtered = products.filter(p => p.id !== product.id).slice(0, 4);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error('Error loading related products:', error);
      }
      setLoadingRelated(false);
    };

    if (product.categoryId) {
      loadRelated();
    }
  }, [product.id, product.categoryId]);

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
    <div className="bg-zinc-950 min-h-screen animate-fade-in pb-20 pt-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${copied ? 'bg-green-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Compartir'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-sm overflow-hidden border border-zinc-800 aspect-square group">
              <picture>
                {!imageError && (
                  <>
                    <source srcSet={optimizeImage(currentImage, { width: 800, format: 'webp', quality: 80 })} type="image/webp" />
                  </>
                )}
                <img
                  src={imageError ? currentImage : imgSrc}
                  onError={() => {
                    if (!imageError) {
                      setImgSrc(currentImage); // Fallback to original
                      setImageError(true);
                    }
                  }}
                  alt={product.title}
                  loading="eager"
                  // @ts-ignore
                  fetchPriority="high"
                  className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                />
              </picture>

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
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
                      : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                  >
                    <img
                      src={optimizeImage(img, { width: 100 })}
                      onError={(e) => {
                        // Fallback for thumbnails directly to src
                        e.currentTarget.src = img;
                      }}
                      alt={`${product.title} - Imagen ${index + 1}`}
                      className="w-full h-full object-contain bg-white p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-racing-orange font-bold uppercase tracking-widest text-xs">{product.category}</span>
              <span className="text-zinc-600 font-mono text-[10px] uppercase flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-800">
                <Hash className="w-2.5 h-2.5" /> REF: {product.sku}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold text-white uppercase italic leading-none mb-4 pr-2">{product.title}</h1>

            <div
              className="prose prose-invert prose-sm text-zinc-400 mb-6 leading-relaxed line-clamp-6"
              dangerouslySetInnerHTML={{ __html: displayDescription }}
            />

            <div className="bg-racing-carbon p-8 rounded-sm border border-zinc-800 mb-8 shadow-xl">
              <div className="flex flex-col mb-8">
                {hasDiscount && (
                  <span className="text-racing-red text-xl font-bold line-through mb-1">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-zinc-500 text-sm font-bold pb-2 uppercase tracking-tighter">Impuestos incluidos</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-sm">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 text-zinc-500 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center text-white font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-3 text-zinc-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={() => onAddToCart?.(quantity)} className="flex-1 bg-racing-orange hover:bg-orange-600 text-white font-black uppercase py-4 px-6 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/40">
                  <ShoppingCart className="w-5 h-5" /> Añadir al garaje
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border border-zinc-800 rounded-sm bg-zinc-900/30 flex items-center gap-3">
                <Truck className="w-6 h-6 text-racing-orange" />
                <div><p className="text-white text-xs font-bold uppercase leading-tight">Envío 24/48h</p><p className="text-zinc-500 text-[10px]">Despacho rápido</p></div>
              </div>
              <div className="p-4 border border-zinc-800 rounded-sm bg-zinc-900/30 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-racing-orange" />
                <div><p className="text-white text-xs font-bold uppercase leading-tight">Garantía</p><p className="text-zinc-500 text-[10px]">3 años oficial</p></div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-zinc-900/50 p-3 rounded-sm border border-zinc-800/50">
              <AlertCircle className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-zinc-500 leading-tight">
                Nota logística: El despacho de piezas en stock se realiza en 24/48h. El tiempo final de entrega depende exclusivamente de la agencia de transporte seleccionada.
              </p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-white uppercase italic mb-8">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(relProduct => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onClick={() => onProductClick?.(relProduct)}
                />
              ))}
            </div>
          </div>
        )}

        {loadingRelated && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-white uppercase italic mb-8">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-zinc-900 rounded-sm h-64 animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
