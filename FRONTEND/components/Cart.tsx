
import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ArrowLeft, AlertCircle, RotateCcw, Loader2, Package, ShieldCheck } from 'lucide-react';
import { CartItem, User, Order } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';
import { fetchPendingOrders, fetchProductsByIds, fetchUserRank } from '../services/woocommerce';
import { MARKETING_TIERS } from '../storeData';
import { CartProgressBar } from './CartProgressBar';

interface CartProps {
  items: CartItem[];
  user?: User | null;
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  onRestoreCart?: (items: CartItem[]) => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  user,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onContinueShopping,
  onRestoreCart
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[] | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleFetchPendingOrders = async () => {
    if (!user) {
      setRecoveryError("Debes iniciar sesión para recuperar tu carrito");
      return;
    }

    setIsRecovering(true);
    setRecoveryError(null);

    try {
      const customerId = user.id && user.id > 0 ? user.id : 0;
      const orders = await fetchPendingOrders(customerId, user.email);
      if (orders.length > 0) {
        setPendingOrders(orders);
      } else {
        setRecoveryError("No tienes pedidos pendientes que recuperar");
      }
    } catch (error) {
      setRecoveryError("Error al buscar pedidos pendientes");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRestoreOrder = async (order: Order) => {
    if (!onRestoreCart) return;

    setIsRecovering(true);
    setRecoveryError(null);
    try {
      const productIds = order.line_items.map(item => (item as any).product_id || item.id).filter(Boolean);

      if (productIds.length === 0) {
        setRecoveryError("El pedido no tiene productos válidos");
        return;
      }

      const products = await fetchProductsByIds(productIds);
      const restoredItems: CartItem[] = [];
      for (const lineItem of order.line_items) {
        const productId = (lineItem as any).product_id || lineItem.id;
        const product = products.find(p => p.id === productId);

        if (product) {
          restoredItems.push({ ...product, quantity: lineItem.quantity });
        }
      }

      if (restoredItems.length > 0) {
        onRestoreCart(restoredItems);
        setPendingOrders(null);
      } else {
        setRecoveryError("Los productos de este pedido ya no están disponibles en el catálogo");
      }
    } catch (error) {
      console.error('[CART] Error restoring order:', error);
      setRecoveryError("Error al recuperar el carrito");
    } finally {
      setIsRecovering(false);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Marketing Tier Logic
  const getTier = (amount: number) => {
    if (amount >= MARKETING_TIERS.PLATINO.min) return MARKETING_TIERS.PLATINO;
    if (amount >= MARKETING_TIERS.ORO.min) return MARKETING_TIERS.ORO;
    if (amount >= MARKETING_TIERS.PLATA.min) return MARKETING_TIERS.PLATA;
    return MARKETING_TIERS.BRONCE;
  };

  const currentTier = getTier(subtotal);
  const discountAmount = (subtotal * currentTier.discount) / 100;
  const shippingCost = currentTier.shipping;
  const total = subtotal + shippingCost - discountAmount;
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 uppercase italic">Tu carrito está vacío</h2>
        <p className="text-zinc-600 dark:text-zinc-500 mb-8 max-w-md">
          Parece que aún no has añadido ninguna pieza para tu moto. Revisa nuestro catálogo para encontrar lo que necesitas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            onClick={onContinueShopping}
            className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase tracking-wide py-3 px-8 rounded-sm transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la tienda
          </button>

          {user && onRestoreCart && (
            <button
              onClick={handleFetchPendingOrders}
              disabled={isRecovering}
              className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold uppercase tracking-wide py-3 px-8 rounded-sm transition-colors flex items-center gap-2 border border-zinc-300 dark:border-zinc-700"
            >
              {isRecovering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Recuperar carrito anterior
            </button>
          )}
        </div>

        {/* Cross-selling when empty */}
        <div className="w-full max-w-4xl border-t border-zinc-200 dark:border-zinc-900 pt-12">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8 text-center italic">También te puede interesar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Aceite Motul 10W40', 'Filtro HiFlo', 'Limpiador Cadena', 'Grasa Cadena'].map((p, i) => (
              <div key={i} onClick={onContinueShopping} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm group cursor-pointer hover:border-racing-orange transition-all">
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800/50 rounded-sm mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-zinc-300 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase truncate">{p}</p>
                <p className="text-[10px] text-racing-orange font-black mt-1 uppercase">Ver más +</p>
              </div>
            ))}
          </div>
        </div>

        {recoveryError && (
          <div className="mt-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-2 rounded-sm text-sm">
            {recoveryError}
          </div>
        )}

        {pendingOrders && pendingOrders.length > 0 && (
          <div className="mt-8 w-full max-w-lg">
            <h3 className="text-zinc-900 dark:text-white font-bold uppercase text-sm mb-4">Pedidos pendientes encontrados:</h3>
            <div className="space-y-3 text-left">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm flex justify-between items-center hover:border-zinc-300 dark:hover:bg-zinc-700 transition-colors shadow-sm dark:shadow-none"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-racing-orange" />
                      <span className="text-zinc-900 dark:text-white font-bold">Pedido #{order.id}</span>
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {order.line_items.length} productos • {formatPrice(parseFloat(order.total))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreOrder(order)}
                    disabled={isRecovering}
                    className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-xs py-2 px-4 rounded-sm transition-colors"
                  >
                    Recuperar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white uppercase italic flex items-center gap-3">
            Carrito de Compra <span className="text-zinc-500 dark:text-zinc-600 text-lg not-italic font-normal">({itemsCount} productos)</span>
          </h1>
        </div>
        <button onClick={onContinueShopping} className="text-zinc-500 hover:text-racing-orange text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-1">
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </button>
      </div>

      <CartProgressBar subtotal={subtotal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <div className="w-24 h-24 bg-white rounded-sm overflow-hidden flex-shrink-0 p-2 border border-zinc-100 dark:border-zinc-800">
                    <img
                      src={optimizeImage(item.image, { width: 100 })}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-zinc-900 dark:text-white font-bold uppercase text-sm md:text-base leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-2 ml-4 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-zinc-500 text-xs mb-4">{item.category}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 text-zinc-500 hover:text-racing-orange transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-zinc-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-3 py-1 text-zinc-500 hover:text-racing-orange transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-500 line-through leading-none mb-1 opacity-0">{formatPrice(item.price)}</p>
                        <p className="text-xl font-black text-racing-orange leading-none">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Highlights Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-start gap-4">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-sm"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
              <div>
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Garantía Oficial</h4>
                <p className="text-[10px] text-zinc-500">Recambios originales y marcas premium directas del fabricante.</p>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm flex items-start gap-4">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-sm"><Truck className="w-6 h-6 text-racing-orange" /></div>
              <div>
                <h4 className="text-[10px] font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Envío Preferente</h4>
                <p className="text-[10px] text-zinc-500">Sigue tu pedido en tiempo real desde que sale de nuestro almacén.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm sticky top-24 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
            <h3 className="text-zinc-900 dark:text-white font-bold uppercase mb-8 tracking-widest text-lg italic italic-black italic-bold">Resumen</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-zinc-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-racing-orange text-sm font-bold uppercase">
                  <span>Descuento {currentTier.label}</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider">
                <span>Envío</span>
                <span className={shippingCost === 0 ? "text-green-500 font-black italic" : "text-zinc-900 dark:text-white"}>
                  {shippingCost === 0 ? "GRATIS" : formatPrice(shippingCost)}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-zinc-100 dark:border-zinc-900 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 dark:text-zinc-600 font-black uppercase text-xs italic">Total</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white block leading-none">{formatPrice(total)}</span>
                  <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mt-2 block">IVA Incluido</span>
                </div>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-racing-orange hover:bg-black text-white font-black uppercase tracking-widest py-5 px-6 rounded-sm flex items-center justify-center gap-3 transition-all group"
            >
              Tramitar Pedido <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>

            {/* TRUST TRUST TRUST */}
            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-900">
              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Pago Seguro Garantizado</span>
                <div className="flex items-center justify-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 w-auto" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 w-auto" />
                  <div className="text-[10px] font-black border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-sm">BIZUM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
