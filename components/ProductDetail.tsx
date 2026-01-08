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
  const mainImage = optimizeImage(product.image, 800);

  return (
    <>
      <div className="bg-zinc-950 min-h-screen animate-fade-in pb-20 pt-4">
        <div className="container mx-auto px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-sm overflow-hidden border border-zinc-800 aspect-square group">
              <img src={mainImage} alt={product.title} className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="flex flex-col">
              <span className="text-racing-orange font-bold uppercase tracking-widest text-xs mb-2">{product.category}</span>
              <h1 className="text-4xl font-extrabold text-white uppercase italic leading-none mb-6 pr-2">{product.title}</h1>
              
              <div className="bg-zinc-900 p-8 rounded-sm border border-zinc-800 mb-8">
                <div className="flex items-end gap-3 mb-8">
                  <span className="text-5xl font-black text-white">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price)}</span>
                  <span className="text-zinc-500 text-sm font-bold pb-2">IVA INC.</span>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-sm">
                    <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="p-3 text-zinc-500 hover:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="w-10 text-center text-white font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(q => q+1)} className="p-3 text-zinc-500 hover:text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => onAddToCart?.(quantity)} className="flex-1 bg-racing-orange hover:bg-orange-600 text-white font-black uppercase py-4 px-6 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20">
                    <ShoppingCart className="w-5 h-5" /> Añadir al garaje
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-800 rounded-sm bg-zinc-900/30 flex items-center gap-3">
                  <Truck className="w-6 h-6 text-racing-orange" />
                  <div><p className="text-white text-xs font-bold uppercase leading-tight">Envío 24h</p><p className="text-zinc-500 text-[10px]">Stock real</p></div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-sm bg-zinc-900/30 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-racing-orange" />
                  <div><p className="text-white text-xs font-bold uppercase leading-tight">Garantía</p><p className="text-zinc-500 text-[10px]">3 años oficial</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};