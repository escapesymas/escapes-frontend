import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export const Cart: React.FC<CartProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onCheckout,
  onContinueShopping 
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Shipping logic updated: always charges shipping (calculated per shipment, using fixed base for now)
  const shippingCost = 9.95; 
  
  const total = subtotal + shippingCost;
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="bg-zinc-900 p-6 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase italic">Tu carrito está vacío</h2>
        <p className="text-zinc-500 mb-8 max-w-md">
          Parece que aún no has añadido ninguna pieza para tu moto. Revisa nuestro catálogo para encontrar lo que necesitas.
        </p>
        <button 
          onClick={onContinueShopping}
          className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase tracking-wide py-3 px-8 rounded-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-white uppercase italic mb-8 flex items-center gap-3">
        Carrito de Compra <span className="text-zinc-600 text-lg not-italic font-normal">({itemsCount} productos)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-racing-carbon border border-zinc-800 p-4 rounded-sm flex flex-col sm:flex-row gap-4 items-center sm:items-stretch group hover:border-zinc-700 transition-colors">
              {/* Image */}
              <div className="w-24 h-24 bg-white rounded-sm overflow-hidden flex-shrink-0 p-2">
                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
              </div>

              {/* Details */}
              <div className="flex-grow text-center sm:text-left">
                <div className="flex justify-between items-start mb-1">
                   <h3 className="text-white font-bold uppercase text-sm md:text-base leading-tight">
                     {item.title}
                   </h3>
                </div>
                <p className="text-zinc-500 text-xs mb-4">{item.category}</p>
                
                <div className="flex items-center justify-between sm:justify-start gap-6">
                  <div className="font-bold text-white">
                    {formatPrice(item.price)}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-sm">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-white text-sm font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total & Remove */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
                <div className="text-lg font-bold text-racing-orange">
                  {formatPrice(item.price * item.quantity)}
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-zinc-600 hover:text-red-500 transition-colors p-2"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={onContinueShopping}
            className="text-zinc-400 hover:text-white text-sm font-bold uppercase flex items-center gap-2 mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Continuar comprando
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm sticky top-24">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide text-lg">Resumen del Pedido</h3>
            
            <div className="space-y-3 mb-6 border-b border-zinc-800 pb-6">
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Envío</span>
                <span className="text-white font-medium">{formatPrice(shippingCost)}</span>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800 flex gap-2 items-start mt-2">
                <Truck className="w-4 h-4 text-racing-orange flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400">
                  Gastos de envío calculados para la península.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6">
              <span className="text-white font-bold uppercase">Total</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-white block leading-none">{formatPrice(total)}</span>
                <span className="text-zinc-500 text-xs">IVA incluido</span>
              </div>
            </div>

            <div className="mb-6">
               <label className="text-zinc-500 text-xs uppercase font-bold mb-2 block">Código Promocional</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="CUPÓN" 
                   className="bg-zinc-900 border border-zinc-700 rounded-sm w-full px-3 py-2 text-sm text-white focus:outline-none focus:border-racing-orange"
                 />
                 <button className="bg-zinc-800 text-white px-3 py-2 rounded-sm font-bold text-xs uppercase hover:bg-zinc-700 border border-zinc-700">Aplicar</button>
               </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase tracking-wide py-4 px-6 rounded-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20 group"
            >
              Tramitar Pedido <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-4 flex justify-center gap-2">
               {/* Mock Payment Icons */}
               <div className="w-8 h-5 bg-zinc-700 rounded-sm opacity-50"></div>
               <div className="w-8 h-5 bg-zinc-700 rounded-sm opacity-50"></div>
               <div className="w-8 h-5 bg-zinc-700 rounded-sm opacity-50"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};