import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Truck, ShieldCheck, Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { STORE_CONFIG } from '../storeData';
import { optimizeImage } from '../utils/imageOptimizer';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart?: (quantity: number) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Logic to determine if there is a discount
  const hasDiscount = product.regularPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100) 
    : 0;

  // Check if default image
  const isDefaultImage = product.image === STORE_CONFIG.defaultProductImage;
  
  // Optimize Images
  const mainImage = isDefaultImage ? product.image : optimizeImage(product.image, 800);
  const thumbImage = isDefaultImage ? product.image : optimizeImage(product.image, 150);

  return (
    <div className="bg-zinc-950 min-h-screen animate-fade-in pb-20">
      {/* Breadcrumb & Back */}
      <div className="container mx-auto px-4 py-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm uppercase font-bold tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className={`aspect-square rounded-sm overflow-hidden border border-zinc-700 relative group ${isDefaultImage ? 'bg-zinc-800' : 'bg-white'}`}>
               <img 
                 src={mainImage} 
                 alt={product.title} 
                 loading="eager" 
                 fetchPriority="high"
                 width="800"
                 height="800"
                 className={`w-full h-full transition-transform duration-500 ${
                   isDefaultImage 
                    ? 'object-contain p-12 group-hover:scale-105' 
                    : 'object-cover group-hover:scale-105'
                 }`}
               />
               {product.inStock && (
                <div className="absolute top-4 left-4 bg-green-500 text-black px-3 py-1 text-xs font-bold uppercase rounded-sm flex items-center gap-1 shadow-lg">
                  <CheckCircle className="w-3 h-3" /> Disponibilidad inmediata
                </div>
               )}
            </div>
            {/* Thumbnail Placeholder (if we had multiple images) */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3].map((_, idx) => (
                <div key={idx} className={`aspect-square border ${idx === 0 ? 'border-racing-orange' : 'border-zinc-700'} rounded-sm cursor-pointer hover:border-zinc-600 ${isDefaultImage ? 'bg-zinc-800' : 'bg-white'}`}>
                   <img 
                     src={thumbImage} 
                     width="150"
                     height="150"
                     className={`w-full h-full ${isDefaultImage ? 'object-contain p-2' : 'object-cover'} opacity-70 hover:opacity-100 transition-opacity`} 
                     loading="lazy" 
                     alt={`Vista ${idx + 1}`}
                   />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">
            <span className="text-racing-orange font-bold uppercase tracking-wider text-sm mb-2">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 uppercase italic">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-zinc-500 text-sm">(12 reviews)</span>
              <span className="text-zinc-600 text-sm">|</span>
              <span className="text-zinc-400 text-sm">Ref: SKU-{product.id}</span>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-sm border border-zinc-800 mb-8">
              <div className="flex flex-col mb-6">
                {/* PVP / Discount display */}
                {hasDiscount && (
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-racing-red text-lg font-bold line-through decoration-racing-red/50">
                      PVP {formatPrice(product.regularPrice)}
                    </span>
                    <span className="bg-racing-red text-white text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      -{discountPercentage}% Ahorro
                    </span>
                  </div>
                )}
                
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-zinc-500 text-sm mb-2">IVA incluido</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity */}
                <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-sm">
                  <button onClick={() => handleQuantityChange(-1)} className="p-3 text-zinc-400 hover:text-white">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-white font-bold">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} className="p-3 text-zinc-400 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* ATC Button */}
                <button 
                  onClick={() => onAddToCart?.(quantity)}
                  className="flex-1 bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase tracking-wide py-3 px-6 rounded-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-orange-900/20"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Añadir al carrito
                </button>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-3 border border-zinc-800 rounded-sm">
                <Truck className="w-5 h-5 text-racing-orange flex-shrink-0" />
                <div>
                  <h4 className="text-white text-xs font-bold uppercase">Envío 24/48h</h4>
                  <p className="text-zinc-500 text-xs">Productos enviados en 24/48H (Tiempo de entrega según destino)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border border-zinc-800 rounded-sm">
                <ShieldCheck className="w-5 h-5 text-racing-orange flex-shrink-0" />
                <div>
                  <h4 className="text-white text-xs font-bold uppercase">Garantía Oficial</h4>
                  <p className="text-zinc-500 text-xs">3 años de cobertura</p>
                </div>
              </div>
            </div>

            {/* Description & Specs Tabs */}
            <div className="mt-auto">
              <h3 className="text-white font-bold uppercase border-b border-zinc-800 pb-2 mb-4">Descripción Técnica</h3>
              <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                {product.shortDescription ? (
                   <div dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
                ) : (
                  <p>
                    Componente de alto rendimiento diseñado para competición. 
                    Mejora la respuesta del motor y reduce el peso del conjunto. 
                    Fabricado con materiales de primera calidad para garantizar durabilidad extrema bajo condiciones de estrés.
                  </p>
                )}
                
                {/* Full Description if available */}
                {product.description && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50" dangerouslySetInnerHTML={{ __html: product.description }} />
                )}
              </div>

              {/* Dynamic Attributes Table */}
              {product.attributes.length > 0 && (
                <div className="mt-8">
                   <h4 className="text-white text-xs font-bold uppercase mb-3">Especificaciones</h4>
                   <div className="grid grid-cols-1 gap-1">
                     {product.attributes.map((attr, idx) => (
                       <div key={idx} className="flex justify-between py-2 border-b border-zinc-800 text-sm">
                         <span className="text-zinc-500">{attr.name}</span>
                         <span className="text-white font-medium">{attr.options.join(', ')}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};