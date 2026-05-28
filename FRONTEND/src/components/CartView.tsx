'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ArrowLeft, AlertCircle, RotateCcw, Loader2, Package, ShieldCheck } from 'lucide-react';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { MARKETING_TIERS } from '../lib/constants';
import CartProgressBar from './CartProgressBar';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === 'test.escapesymas.com')
    ? 'pk_test_51TXr6bPhkRo6LHVFGeGCCW4n0yLOagJow07UFrhMhcZMxkc0ensC9E4YwkjWzFkLLuQCzwSunE9Tce8WEevmcxAM00wXyFiagW'
    : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51TXr6bPhkRo6LHVF9zMat1q9ooZBYw5xOApZbAvKG0B7jIu01t3PhgqRnGIx1kcdtgZckZVM6jRXgDVGnv4HqZ5W00otz3AKYd')
);

interface CartViewProps {
  onContinueShopping: () => void;
}

export default function CartView({ onContinueShopping }: CartViewProps) {
  const { cart, updateQuantity, removeItem, clearCart, toast, addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  // Cross-selling / Recommendations
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Checkout form state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingData, setShippingData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address1: user?.billing?.address_1 || '',
    city: user?.billing?.city || '',
    postcode: user?.billing?.postcode || '',
    phone: user?.billing?.phone || '',
    nif: user?.billing?.nif || '',
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePaymentOrderId, setStripePaymentOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync profile details and saved address selector if they load later
  useEffect(() => {
    if (user) {
      const saved = Array.isArray(user.billing?.addresses) ? (user.billing.addresses as any[]) : [];
      if (saved.length > 0) {
        const firstAddr = saved[0];
        setSelectedAddressId(firstAddr.id);
        setShippingData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          address1: firstAddr.address_1,
          city: firstAddr.city,
          postcode: firstAddr.postcode,
          phone: firstAddr.phone,
          nif: firstAddr.nif || '',
        });
      } else {
        setSelectedAddressId('new');
        setShippingData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          address1: user.billing?.address_1 || '',
          city: user.billing?.city || '',
          postcode: user.billing?.postcode || '',
          phone: user.billing?.phone || '',
          nif: user.billing?.nif || '',
        });
      }
    }
  }, [user]);

  // Procesar resultado de pago al montar el carrito (redirect de Klarna/Bizum)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const redirectResult = sessionStorage.getItem('stripe_redirect_result');
    if (!redirectResult) return;
    sessionStorage.removeItem('stripe_redirect_result');

    try {
      const { paymentIntentId, redirectStatus, orderId } = JSON.parse(redirectResult);
      if (redirectStatus === 'succeeded' && orderId) {
        finalizeStripeOrder(orderId, paymentIntentId);
      } else {
        setOrderError('El pago no se completó. Ha sido cancelado o rechazado por el banco.');
        setShowPaymentModal(false);
      }
    } catch (e) {}
  }, []);

  const finalizeStripeOrder = async (orderId: string, paymentIntentId: string) => {
    try {
      const finalizeRes = await fetch('/api/orders/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentId: paymentIntentId,
          status: 'processing'
        })
      });
      if (finalizeRes.ok) {
        setCompletedOrder({ orderId, total: 0 });
        clearCart();
        setShowPaymentModal(false);
      } else {
        const errData = await finalizeRes.json();
        setPaymentError(errData.error || 'Error al confirmar el pago en el servidor.');
      }
    } catch (err: any) {
      setPaymentError('Error de red al confirmar el pago.');
    }
  };

  const stripePaymentOnSuccess = async (paymentIntentId: string) => {
    if (!stripePaymentOrderId) return;
    await finalizeStripeOrder(stripePaymentOrderId, paymentIntentId);
  };

  // Load recommended products
  useEffect(() => {
    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const res = await fetch('/api/catalog/products?per_page=6');
        if (res.ok) {
          const data = await res.json();
          // Filter out items already in the cart and select cheap ones
          const filtered = data
            .filter((p: any) => !cart.some((item) => item.id === p.id))
            .slice(0, 4);
          setRecommended(filtered);
        }
      } catch (e) {
        console.error('Error fetching recommendations:', e);
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecs();
  }, [cart]);

  const applyPromoCode = (code: string) => {
    setPromoError(null);
    setPromoSuccessMsg(null);
    const upperCode = code.trim().toUpperCase();

    if (upperCode === 'WELCOME10' || upperCode === 'RIDER20' || upperCode === 'ENVIOFREE') {
      setAppliedPromo(upperCode);
      setPromoSuccessMsg(`Cupón ${upperCode} aplicado con éxito.`);
    } else {
      setPromoError('El código de cupón no es válido o ha expirado.');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoSuccessMsg(null);
    setPromoError(null);
    setPromoCodeInput('');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Marketing Tier Logic
  const getTier = (amount: number) => {
    if (amount >= MARKETING_TIERS.PLATINO.min) return MARKETING_TIERS.PLATINO;
    if (amount >= MARKETING_TIERS.ORO.min) return MARKETING_TIERS.ORO;
    if (amount >= MARKETING_TIERS.PLATA.min) return MARKETING_TIERS.PLATA;
    return MARKETING_TIERS.BRONCE;
  };

  const currentTier = getTier(subtotal);
  const tierDiscount = (subtotal * currentTier.discount) / 100;

  // Calculate promo discount
  const promoDiscount =
    appliedPromo === 'WELCOME10'
      ? subtotal * 0.1
      : appliedPromo === 'RIDER20'
      ? subtotal * 0.2
      : 0;

  const isFreeShippingPromo = appliedPromo === 'ENVIOFREE';
  const shippingCost = isFreeShippingPromo ? 0 : currentTier.shipping;
  const discountAmount = tierDiscount + promoDiscount;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);
  const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || 'guest@escapesymas.com',
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          shippingData,
          paymentMethod: 'stripe',
          promoCode: appliedPromo,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Error al procesar el pedido');
      }

      const piRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          amount: orderData.total,
          currency: 'EUR',
          customerEmail: user?.email || undefined,
        })
      });

      const piData = await piRes.json();
      if (!piRes.ok) {
        throw new Error(piData.error || 'Error al iniciar la pasarela de pago');
      }

      setClientSecret(piData.clientSecret);
      setStripePaymentOrderId(String(orderData.orderId));
      sessionStorage.removeItem('stripe_pending_order');
      setShowPaymentModal(true);
    } catch (err: any) {
      setOrderError(err.message || 'Error de conexión');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in font-sans">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-full mb-6">
          <ShieldCheck className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2 uppercase italic">¡Pedido Completado!</h2>
        <p className="text-text-muted mb-4 max-w-md text-sm">
          Tu pedido <span className="text-foreground font-bold font-mono">#{completedOrder.orderId}</span> ha sido recibido correctamente. Hemos enviado un correo con el resumen y la factura del pedido.
        </p>
        <div className="bg-card border border-card-border p-4 rounded text-left w-full max-w-md mb-8 font-mono text-xs text-text-muted space-y-1">
          <p><span className="font-bold text-foreground">Importe total:</span> {formatPrice(total)}</p>
          <p><span className="font-bold text-foreground">Método de pago:</span> Stripe/Tarjeta</p>
          <p><span className="font-bold text-foreground">Dirección:</span> {shippingData.address1}, {shippingData.city}</p>
        </div>
        <button
          onClick={() => {
            setCompletedOrder(null);
            onContinueShopping();
          }}
          className="bg-accent text-slate-950 font-mono font-bold uppercase tracking-wide py-3 px-8 rounded-sm hover:bg-accent-hover transition-colors flex items-center gap-2 cursor-pointer"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in font-sans">
        <div className="bg-card border border-card-border p-6 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-text-muted" />
        </div>
        <h2 className="text-2xl font-mono font-bold text-foreground mb-2 uppercase italic">Tu carrito está vacío</h2>
        <p className="text-text-muted mb-8 max-w-md text-xs">
          Parece que aún no has añadido ninguna pieza para tu moto. Revisa nuestro catálogo para encontrar lo que necesitas.
        </p>

        <button
          onClick={onContinueShopping}
          className="bg-accent text-slate-950 font-mono font-bold uppercase tracking-wide py-3 px-8 rounded-sm hover:bg-accent-hover transition-colors flex items-center gap-2 cursor-pointer mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </button>

        {/* Recommended Products */}
        {recommended.length > 0 && (
          <div className="w-full max-w-4xl border-t border-card-border pt-12 text-left">
            <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-8 text-center italic">
              Productos Recomendados de Mantenimiento y Limpieza
            </h3>
            {loadingRecs ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card border border-card-border p-4 rounded-sm animate-pulse">
                    <div className="aspect-square bg-slate-900 rounded-sm mb-3" />
                    <div className="h-3 bg-slate-800 rounded-sm w-3/4 mb-2" />
                    <div className="h-3 bg-slate-800 rounded-sm w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommended.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card border border-card-border p-3 rounded-sm flex flex-col justify-between hover:border-accent transition-all duration-300 shadow-sm group"
                  >
                    <Link href={`/producto/${product.id}`} className="space-y-2 cursor-pointer block">
                      <div className="aspect-square bg-slate-950 rounded-sm overflow-hidden flex items-center justify-center p-2 relative">
                        <img
                          src={product.image || (product.images && product.images[0]?.src) || ''}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="text-foreground text-xs font-mono font-bold leading-tight line-clamp-2 h-8 group-hover:text-accent-text transition-colors">
                        {product.name}
                      </h4>
                    </Link>
                    <div className="mt-3 pt-2 border-t border-card-border flex items-center justify-between gap-1">
                      <span className="text-sm font-mono font-bold text-accent-text">
                        {formatPrice(product.price)}
                      </span>
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="bg-accent text-slate-950 text-[10px] font-mono font-bold uppercase py-1.5 px-2.5 rounded-sm hover:bg-accent-hover transition-all duration-200 cursor-pointer"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-sans">
      {isCheckingOut ? (
        // Checkout simulator drawer
        <div className="max-w-2xl mx-auto bg-card border border-card-border p-6 md:p-8 rounded shadow-xl">
          <button
            onClick={() => setIsCheckingOut(false)}
            className="text-text-muted hover:text-foreground text-xs font-mono font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Carrito
          </button>

          <h2 className="text-2xl font-mono font-bold uppercase text-foreground mb-6 italic">Detalles de Facturación y Envío</h2>

          {/* Selector de Direcciones Guardadas */}
          {user && Array.isArray(user.billing?.addresses) && user.billing.addresses.length > 0 && (
            <div className="mb-6 font-sans">
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-2">Dirección de Envío y Facturación</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {user.billing.addresses.map((addr: any) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setShippingData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        address1: addr.address_1,
                        city: addr.city,
                        postcode: addr.postcode,
                        phone: addr.phone,
                        nif: addr.nif || '',
                      });
                      setSelectedAddressId(addr.id);
                    }}
                    className={`text-left p-3.5 rounded border flex flex-col justify-between transition-all cursor-pointer ${
                      selectedAddressId === addr.id
                        ? 'border-accent bg-accent/5'
                        : 'border-card-border bg-background hover:bg-card-border/25'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-foreground font-mono text-xs">{addr.alias}</span>
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-tag text-tag-text uppercase border border-tag-border/40">
                        {addr.type === 'envio' ? 'Envío' : 'Fiscal'}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs leading-tight truncate w-full">{addr.address_1}</p>
                    <p className="text-text-muted text-[10px] mt-0.5 font-mono">{addr.city}, {addr.postcode}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShippingData({
                      firstName: '',
                      lastName: '',
                      address1: '',
                      city: '',
                      postcode: '',
                      phone: '',
                      nif: '',
                    });
                    setSelectedAddressId('new');
                  }}
                  className={`text-left p-3.5 rounded border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer min-h-[84px] ${
                    selectedAddressId === 'new'
                      ? 'border-accent bg-accent/5'
                      : 'border-card-border bg-background hover:bg-card-border/25'
                  }`}
                >
                  <span className="font-bold text-foreground font-mono text-xs">+ Otra Dirección</span>
                  <span className="text-[9px] text-text-muted mt-1 font-mono">Rellenar datos a mano</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={shippingData.firstName}
                  onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
                  placeholder="Ej. Juan"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  value={shippingData.lastName}
                  onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
                  placeholder="Ej. García"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Dirección de Envío</label>
              <input
                type="text"
                required
                value={shippingData.address1}
                onChange={(e) => setShippingData({ ...shippingData, address1: e.target.value })}
                placeholder="Calle, número, piso, puerta..."
                className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Ciudad</label>
                <input
                  type="text"
                  required
                  value={shippingData.city}
                  onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                  placeholder="Ej. Madrid"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">C.P.</label>
                <input
                  type="text"
                  required
                  value={shippingData.postcode}
                  onChange={(e) => setShippingData({ ...shippingData, postcode: e.target.value })}
                  placeholder="Ej. 28001"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  value={shippingData.phone}
                  onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                  placeholder="Ej. 600123456"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">NIF / CIF (Factura)</label>
                <input
                  type="text"
                  value={shippingData.nif}
                  onChange={(e) => setShippingData({ ...shippingData, nif: e.target.value })}
                  placeholder="Ej. 12345678Z"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="border-t border-card-border pt-4 mt-6">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-4">Resumen de Pago</h3>
              <div className="bg-background border border-card-border rounded p-4 text-xs font-mono text-text-muted space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent-text">
                    <span>Descuentos acumulados:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Gastos de Envío:</span>
                  <span className="text-foreground">{shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-card-border pt-2 text-sm font-bold text-foreground">
                  <span>Total a Pagar (IVA inc.):</span>
                  <span className="text-accent-text">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {orderError && (
              <p className="text-red-500 text-xs font-mono font-bold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {orderError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingOrder}
              className="w-full bg-accent text-slate-950 font-mono font-bold uppercase tracking-wider py-4 rounded hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </>
              ) : (
                <>Confirmar y Pagar {formatPrice(total)}</>
              )}
            </button>
          </form>
        </div>
      ) : (
        // Regular Cart Items View
        <>
          <div className="flex flex-col md:flex-row justify-between items-end gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-mono font-bold text-foreground uppercase italic flex items-center gap-3">
                Carrito de Compra{' '}
                <span className="text-text-muted text-sm not-italic font-normal">
                  ({itemsCount} productos)
                </span>
              </h1>
            </div>
            <button
              onClick={onContinueShopping}
              className="text-text-muted hover:text-accent-text text-xs font-mono font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Seguir comprando
            </button>
          </div>

          <CartProgressBar subtotal={subtotal} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card border border-card-border rounded overflow-hidden">
                <div className="divide-y divide-card-border">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 flex flex-col sm:flex-row gap-5 hover:bg-slate-950/20 transition-colors"
                    >
                      <div className="w-20 h-20 bg-white rounded overflow-hidden flex-shrink-0 p-1.5 border border-card-border flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="text-foreground font-mono font-bold uppercase text-sm leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-text-muted text-[10px] font-mono mt-0.5">{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-text-muted hover:text-red-500 transition-colors p-1.5 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center bg-background border border-card-border rounded">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="px-2.5 py-1 text-text-muted hover:text-accent transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2.5 py-1 text-text-muted hover:text-accent transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-mono font-bold text-accent-text">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-card-border p-4 rounded flex items-start gap-4">
                  <div className="bg-background p-2 rounded border border-card-border">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Garantía Oficial
                    </h4>
                    <p className="text-[10px] text-text-muted">
                      Recambios originales y marcas premium directas del fabricante.
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-card-border p-4 rounded flex items-start gap-4">
                  <div className="bg-background p-2 rounded border border-card-border">
                    <Truck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Envío Preferente
                    </h4>
                    <p className="text-[10px] text-text-muted">
                      Sigue tu pedido en tiempo real desde que sale de nuestro almacén.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-card-border p-6 rounded sticky top-20 shadow-md">
                <h3 className="text-foreground font-mono font-bold uppercase mb-6 tracking-wider text-base italic">
                  Resumen
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-text-muted text-xs font-bold uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span className="text-foreground font-mono">{formatPrice(subtotal)}</span>
                  </div>

                  {tierDiscount > 0 && (
                    <div className="flex justify-between text-accent-text text-xs font-bold uppercase">
                      <span>Descuento {currentTier.label}</span>
                      <span className="font-mono">-{formatPrice(tierDiscount)}</span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-500 text-xs font-bold uppercase">
                      <span>Cupón {appliedPromo}</span>
                      <span className="font-mono">-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-text-muted text-xs font-bold uppercase tracking-wider">
                    <span>Envío</span>
                    <span
                      className={
                        shippingCost === 0
                          ? 'text-emerald-500 font-bold italic'
                          : 'text-foreground font-mono'
                      }
                    >
                      {shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}
                    </span>
                  </div>

                  {/* Promo Code Section */}
                  <div className="border-t border-card-border pt-4 mt-2">
                    <span className="text-foreground font-mono font-bold text-[10px] uppercase tracking-wide block mb-2">
                      ¿Tienes un cupón de descuento?
                    </span>
                    {appliedPromo ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 flex items-center justify-between">
                        <div>
                          <span className="text-emerald-500 font-mono font-bold text-xs block uppercase">
                            Cupón {appliedPromo}
                          </span>
                          <span className="text-text-muted text-[10px]">
                            {appliedPromo === 'WELCOME10'
                              ? '10% de descuento adicional'
                              : appliedPromo === 'RIDER20'
                              ? '20% de descuento adicional'
                              : 'Envío Gratuito'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removePromoCode}
                          className="text-red-500 hover:text-red-400 font-bold uppercase text-[10px] tracking-wide cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Introduce tu cupón"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="bg-background border border-card-border rounded py-2 px-3 text-xs text-foreground placeholder-text-muted focus:outline-none focus:border-accent flex-1 uppercase font-mono font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => applyPromoCode(promoCodeInput)}
                            className="bg-accent text-slate-950 font-mono font-bold uppercase py-2 px-4 rounded text-xs transition-colors hover:bg-accent-hover cursor-pointer"
                          >
                            Aplicar
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-red-500 text-[10px] font-mono font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {promoError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-dashed border-card-border pt-6 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-text-muted font-mono font-bold uppercase text-[10px] italic">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-mono font-bold text-foreground block leading-none">
                        {formatPrice(total)}
                      </span>
                      <span className="text-text-muted text-[8px] uppercase tracking-widest font-bold mt-1.5 block">
                        IVA Incluido
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full bg-accent text-slate-950 font-mono font-bold uppercase tracking-widest py-4 rounded hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer group"
                >
                  Tramitar Pedido{' '}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stripe Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border p-6 rounded shadow-xl max-w-md w-full relative overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-card-border mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-accent/10 p-1.5 rounded-sm border border-accent/20">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm uppercase tracking-wide text-foreground">Pago Seguro</h3>
                  <p className="text-[10px] text-text-muted font-sans">Stripe • Tarjeta, Google Pay, Apple Pay, Klarna, Bizum</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-accent-text bg-accent/5 px-2.5 py-1 rounded border border-accent/10">
                #{stripePaymentOrderId}
              </span>
            </div>

            {/* Error Alert */}
            {paymentError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error en la transacción</p>
                  <p className="text-[10px] text-red-400/90">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Stripe Elements */}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                orderId={stripePaymentOrderId}
                clientSecret={clientSecret}
                onSuccess={stripePaymentOnSuccess}
                onError={setPaymentError}
                onCancel={() => setShowPaymentModal(false)}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

function StripePaymentForm({ orderId, clientSecret, onSuccess, onError, onCancel }: {
  orderId: string | null;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    sessionStorage.setItem('stripe_pending_order', JSON.stringify({
      orderId,
      clientSecret,
    }));

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + window.location.pathname,
      },
    });

    if (confirmError) {
      sessionStorage.removeItem('stripe_pending_order');
      setError(confirmError.message || 'Error al procesar el pago');
      onError(confirmError.message || 'Error al procesar el pago');
    }

    setLoading(false);
  };

  const handleCancel = () => {
    if (!loading) {
      sessionStorage.removeItem('stripe_pending_order');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-background border border-card-border/60 rounded p-4 mb-2 shadow-inner">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error en el pago</p>
            <p className="text-[10px] text-red-400/90">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 bg-transparent hover:bg-card-border/25 border border-card-border text-text-muted hover:text-foreground font-mono text-xs font-bold uppercase tracking-wider py-3 rounded transition-colors cursor-pointer text-center disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 bg-accent text-slate-950 font-mono font-bold uppercase tracking-wider py-3 rounded hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
          ) : (
            'Pagar Ahora'
          )}
        </button>
      </div>
    </form>
  );
}
