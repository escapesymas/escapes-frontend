'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @next/next/no-img-element, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, ArrowRight, AlertCircle, RotateCcw, Loader2, Package, ShieldCheck, Lock, Repeat } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { MARKETING_TIERS, PHONE_REGEX, POSTCODE_REGEX } from '../lib/constants';
import { Product } from '../types';
import CartProgressBar from './CartProgressBar';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import OrderSuccessView from './OrderSuccessView';
import EmptyCartView from './EmptyCartView';

const stripePromise = loadStripe(
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === 'test.escapesymas.com')
    ? (process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
    : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
);

interface CartViewProps {
  onContinueShopping?: () => void;
  initialStep?: 'cart' | 'checkout';
}

interface SavedAddress {
  id: string;
  alias: string;
  type: 'envio' | 'fiscal';
  address_1: string;
  city: string;
  postcode: string;
  phone: string;
  nif?: string;
}

export default function CartView({ onContinueShopping, initialStep = 'cart' }: CartViewProps) {
  const { cart, updateQuantity, removeItem, clearCart, addToCart, isInitialized } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoType, setPromoType] = useState<string | null>(null);
  const [promoValue, setPromoValue] = useState<number>(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Cross-selling / Recommendations
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Checkout form state
  const [isCheckingOut, setIsCheckingOut] = useState(initialStep === 'checkout');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingData, setShippingData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    address1: user?.billing?.address_1 || '',
    city: user?.billing?.city || '',
    postcode: user?.billing?.postcode || '',
    phone: user?.billing?.phone || '',
    nif: user?.billing?.nif || '',
  });
  const [dynamicShippingCost, setDynamicShippingCost] = useState<number | null>(null);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{ orderId: string; total?: number } | null>(null);
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingData, setBillingData] = useState({
    companyName: (user?.billing as any)?.company || '',
    nif: user?.billing?.nif || '',
    address1: user?.billing?.address_1 || '',
    city: user?.billing?.city || '',
    postcode: user?.billing?.postcode || '',
  });

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePaymentOrderId, setStripePaymentOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync profile details and saved address selector if they load later
  useEffect(() => {
  const syncProfile = async () => {
    if (!user) return;
    const saved = Array.isArray(user.billing?.addresses) ? (user.billing.addresses as SavedAddress[]) : [];
    if (saved.length > 0) {
      const firstAddr = saved[0];
      setSelectedAddressId(firstAddr.id);
      setShippingData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
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
        email: user.email || '',
        address1: user.billing?.address_1 || '',
        city: user.billing?.city || '',
        postcode: user.billing?.postcode || '',
        phone: user.billing?.phone || '',
        nif: user.billing?.nif || '',
      });
    }
  };
  syncProfile();
}, [user]);

  // Guard: si llegamos a /checkout con carrito vacío, redirigir a /
  useEffect(() => {
    if (initialStep !== 'checkout') return;
    if (!isInitialized) return;
    if (!cart || cart.length === 0) {
      window.location.href = '/?emptyCart=1';
    }
  }, [initialStep, cart, isInitialized]);

  // Carrito abandonado: si la URL trae ?recover=TOKEN, restaurar productos del snapshot
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const recoverToken = url.searchParams.get('recover');
    if (!recoverToken || !/^[0-9a-f-]{36}$/i.test(recoverToken)) return;
    if (sessionStorage.getItem(`recovered_${recoverToken}`)) return;

    (async () => {
      try {
        const res = await fetch(`/api/cart/recover/${recoverToken}`);
        if (!res.ok) {
          setRecoveryError(res.status === 404 ? 'Carrito no encontrado o enlace expirado' : 'Error al recuperar carrito');
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data.cart) || data.cart.length === 0) {
          setRecoveryError('El carrito no contiene productos');
          return;
        }
        for (const it of data.cart) {
          addToCart({
            id: it.id || it.productId,
            sku: it.sku || '',
            slug: it.slug || '',
            name: it.name || it.title || 'Producto',
            price: typeof it.price === 'number' ? it.price : (parseInt(it.price) || 0) / 100,
            regularPrice: typeof it.regularPrice === 'number' ? it.regularPrice : (typeof it.price === 'number' ? it.price : (parseInt(it.price) || 0) / 100),
            salePrice: null,
            stock: typeof it.stock === 'number' ? it.stock : 999,
            inStock: true,
            brand: it.brand || '',
            category: it.category || '',
            categorySlug: it.categorySlug || '',
            image: it.image || it.src || '',
            title: it.name || it.title || 'Producto',
          } as any, Math.max(1, parseInt(it.quantity) || 1));
        }
        sessionStorage.setItem(`recovered_${recoverToken}`, '1');
        setRecoveryMessage(data.already_recovered
          ? `Carrito reabierto · ${data.cart.length} producto${data.cart.length === 1 ? '' : 's'} añadidos. Esta vez te avisaremos si no completas el pago.`
          : `Carrito recuperado · ${data.cart.length} producto${data.cart.length === 1 ? '' : 's'} añadidos.`);
        if (data.discount_cents && data.discount_cents > 0) {
          const discountPct = Math.round((data.discount_cents / data.total_cents) * 100);
          setRecoveryMessage(prev => `${prev} Tienes un cupón del ${discountPct}% reservado si completas la compra.`);
        }
        url.searchParams.delete('recover');
        window.history.replaceState({}, '', url.toString());
      } catch (err: any) {
        setRecoveryError('Error de conexión al recuperar carrito');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Procesar resultado de pago al montar el carrito (redirect de Klarna/Bizum)
  useEffect(() => {
  if (typeof window === 'undefined') return;
  const redirectResult = sessionStorage.getItem('stripe_redirect_result');
  if (!redirectResult) return;
  sessionStorage.removeItem('stripe_redirect_result');

  const processRedirect = async () => {
    try {
      const { paymentIntentId, redirectStatus, orderId } = JSON.parse(redirectResult);
      if (redirectStatus === 'succeeded' && orderId) {
        await finalizeStripeOrder(orderId, paymentIntentId);
        trackEvent.clearBeginCheckoutEventId();
      } else {
        setOrderError('El pago no se completó. Ha sido cancelado o rechazado por el banco.');
        setShowPaymentModal(false);
      }
    } catch (e) {
      console.error('Error processing redirect result:', e);
    }
  };
  processRedirect();
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
        trackEvent.clearBeginCheckoutEventId();
        setShowPaymentModal(false);
      } else {
        const errData = await finalizeRes.json();
        setPaymentError(errData.error || 'Error al confirmar el pago en el servidor.');
        setOrderError(errData.error || 'Error al confirmar el pago en el servidor.');
      }
    } catch {
      setPaymentError('Error de red al confirmar el pago.');
      setOrderError('Error de red al confirmar el pago.');
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
          const products = data.products || data || [];
          const filtered = (Array.isArray(products) ? products : [])
            .filter((p: Product) => !cart.some((item) => item.id === p.id))
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

  const applyPromoCode = async (code: string) => {
    setPromoError(null);
    setPromoSuccessMsg(null);
    const upperCode = code.trim().toUpperCase();

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: upperCode }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo(data.code);
        setPromoType(data.type);
        setPromoValue(data.value);
        setPromoSuccessMsg(`Cupón ${data.code} aplicado con éxito.`);
      } else {
        setPromoError(data.error || 'Cupón no válido');
      }
    } catch {
      setPromoError('Error al validar el cupón. Inténtalo de nuevo.');
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoType(null);
    setPromoValue(0);
    setPromoSuccessMsg(null);
    setPromoError(null);
    setPromoCodeInput('');
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Fetch dynamic shipping cost when postcode or subtotal changes
  useEffect(() => {
    if (!isCheckingOut) return;
    
    const estimateShipping = async () => {
      if (!shippingData.postcode) return;
      setIsEstimatingShipping(true);
      try {
        const res = await fetch('/api/shipping-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: 'ES', // Default country for now
            zipCode: shippingData.postcode,
            subtotalEur: subtotal
          })
        });
        if (res.ok) {
          const data = await res.json();
          setDynamicShippingCost(typeof data.shippingCost === 'number' ? data.shippingCost : null);
        } else {
          setDynamicShippingCost(null);
        }
      } catch (err) {
        console.warn('Failed to estimate shipping, using default', err);
        setDynamicShippingCost(null);
      } finally {
        setIsEstimatingShipping(false);
      }
    };
    
    // Add a small debounce if typing zipCode
    const timeout = setTimeout(() => {
      estimateShipping();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [shippingData.postcode, subtotal, isCheckingOut]);

  // Marketing Tier Logic
  const getTier = (amount: number) => {
    if (amount >= MARKETING_TIERS.PLATINO.min) return MARKETING_TIERS.PLATINO;
    if (amount >= MARKETING_TIERS.ORO.min) return MARKETING_TIERS.ORO;
    if (amount >= MARKETING_TIERS.PLATA.min) return MARKETING_TIERS.PLATA;
    return MARKETING_TIERS.BRONCE;
  };

  const currentTier = getTier(subtotal);
  const tierDiscount = (subtotal * currentTier.discount) / 100;
  const afterTierSubtotal = subtotal - tierDiscount;

  // Calculate promo discount on tier-discounted amount (proper stacking)
  let promoDiscount = 0;
  if (appliedPromo && promoType === 'percent') {
    promoDiscount = afterTierSubtotal * (promoValue / 100);
  } else if (appliedPromo && promoType === 'fixed') {
    promoDiscount = promoValue / 100; // cents to euros
  }

  const isFreeShippingPromo = appliedPromo && promoType === 'free_shipping';
  
  // Use dynamic shipping cost if available, otherwise fallback to tier logic for initial render
  const baseShippingCost = dynamicShippingCost !== null ? dynamicShippingCost : currentTier.shipping;
  const shippingCost = isFreeShippingPromo ? 0 : baseShippingCost;
  
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

    if (!POSTCODE_REGEX.test(shippingData.postcode)) {
      setOrderError('El código postal debe tener 5 dígitos (ej. 28001).');
      setIsSubmittingOrder(false);
      return;
    }
    if (!PHONE_REGEX.test(shippingData.phone)) {
      setOrderError('El teléfono no es válido (ej. 600123456).');
      setIsSubmittingOrder(false);
      return;
    }
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email)) {
      setOrderError('Introduce un email válido para enviarte la confirmación y la factura.');
      setIsSubmittingOrder(false);
      return;
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || shippingData.email,
          cart: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          shippingData,
          billingData: billingDifferent ? billingData : null,
          paymentMethod: 'stripe',
          promoCode: appliedPromo,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Error al procesar el pedido');
      }

      const cartTotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
      trackEvent.beginCheckout(
        cart.map((it) => ({ product: it as any, quantity: it.quantity })),
        cartTotal
      );

      const piRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          amount: orderData.total,
          currency: 'EUR',
          customerEmail: user?.email || undefined,
          eventId: trackEvent.getBeginCheckoutEventId(),
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
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (completedOrder) {
    return (
      <OrderSuccessView
        orderId={completedOrder.orderId}
        total={formatPrice(total)}
        address={shippingData.address1}
        city={shippingData.city}
        onContinueShopping={onContinueShopping}
        onReset={() => setCompletedOrder(null)}
      />
    );
  }

  if (cart.length === 0) {
    return (
      <EmptyCartView
        onContinueShopping={onContinueShopping}
        recommended={recommended}
        loadingRecs={loadingRecs}
        addToCart={addToCart}
        formatPrice={formatPrice}
      />
    );
  }

  return (
    <div className="animate-fade-in font-sans">
      {isCheckingOut ? (
        // Checkout simulator drawer
        <div data-testid="checkout-form" className="max-w-2xl mx-auto bg-card border border-card-border p-6 md:p-8 rounded shadow-xl">
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
                {(user.billing.addresses as SavedAddress[]).map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setShippingData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
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
                      email: '',
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
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={billingDifferent}
                onChange={(e) => setBillingDifferent(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="font-sans">
                ¿La dirección de facturación es diferente a la de envío? <span className="text-text-muted">(empresas, autónomos)</span>
              </span>
            </label>

            {billingDifferent && (
              <div className="bg-card border border-card-border rounded-md p-4 space-y-4">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wide text-foreground">Datos de facturación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Empresa / Razón social</label>
                    <input
                      type="text"
                      value={billingData.companyName}
                      onChange={(e) => setBillingData({ ...billingData, companyName: e.target.value })}
                      placeholder="Ej. Mi Moto S.L."
                      className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">NIF / CIF</label>
                    <input
                      type="text"
                      value={billingData.nif}
                      onChange={(e) => setBillingData({ ...billingData, nif: e.target.value })}
                      placeholder="Ej. B12345678"
                      className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Dirección de facturación</label>
                  <input
                    type="text"
                    value={billingData.address1}
                    onChange={(e) => setBillingData({ ...billingData, address1: e.target.value })}
                    placeholder="Calle, número, piso..."
                    className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={billingData.city}
                      onChange={(e) => setBillingData({ ...billingData, city: e.target.value })}
                      placeholder="Ej. Madrid"
                      className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">Código postal</label>
                    <input
                      type="text"
                      value={billingData.postcode}
                      onChange={(e) => setBillingData({ ...billingData, postcode: e.target.value })}
                      placeholder="28001"
                      className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

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

            {!user && (
              <div className="mt-4">
                <label className="block text-[10px] font-mono font-bold text-text-muted uppercase mb-1">
                  Email (para confirmación y factura)
                </label>
                <input
                  type="email"
                  required
                  value={shippingData.email}
                  onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full bg-background border border-card-border rounded px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            )}

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
                  <span className="text-foreground">
                    {isEstimatingShipping ? 'Calculando...' : (shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost))}
                  </span>
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

          {recoveryMessage && (
            <div data-testid="recovery-banner" className="bg-green-500/10 border border-green-500/30 p-4 rounded-sm mb-6 flex items-start gap-3 font-sans">
              <RotateCcw className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-500 font-mono font-bold text-xs uppercase tracking-wide">Carrito Recuperado</h4>
                <p className="text-text-muted text-xs mt-1 leading-normal">{recoveryMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryMessage(null)}
                className="ml-auto text-text-muted hover:text-accent-text text-xs"
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </div>
          )}

          {recoveryError && (
            <div data-testid="recovery-banner-error" className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-sm mb-6 flex items-start gap-3 font-sans">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-500 font-mono font-bold text-xs uppercase tracking-wide">No se pudo recuperar</h4>
                <p className="text-text-muted text-xs mt-1 leading-normal">{recoveryError}</p>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryError(null)}
                className="ml-auto text-text-muted hover:text-accent-text text-xs"
                aria-label="Cerrar mensaje"
              >
                ×
              </button>
            </div>
          )}

          {orderError && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm mb-6 flex items-start gap-3 font-sans">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-500 font-mono font-bold text-xs uppercase tracking-wide">Error en el Pago</h4>
                <p className="text-text-muted text-xs mt-1 leading-normal">{orderError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipping banner */}
            <div className="lg:col-span-3 bg-accent/5 border border-accent/30 rounded-md p-3 md:p-4 flex items-start gap-3">
              <Truck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <p className="font-mono font-bold uppercase tracking-wider text-foreground mb-1">
                  Gastos de envío
                </p>
                <p className="text-foreground/85 leading-snug">
                  <span className="font-bold text-accent">Envío GRATIS</span> en pedidos superiores a 150€ (Península y Baleares).
                  Envío estándar 6,99€ · Canarias, Ceuta y Melilla consultar.
                </p>
              </div>
            </div>

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border border-card-border p-3 rounded flex items-start gap-3">
                  <div className="bg-background p-2 rounded border border-card-border shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Garantía Oficial
                    </h4>
                    <p className="text-[9px] text-text-muted leading-tight mt-0.5">
                      Recambios originales del fabricante.
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-card-border p-3 rounded flex items-start gap-3">
                  <div className="bg-background p-2 rounded border border-card-border shrink-0">
                    <Truck className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Envío 24-72h
                    </h4>
                    <p className="text-[9px] text-text-muted leading-tight mt-0.5">
                      Desde nuestro almacén a tu puerta.
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-card-border p-3 rounded flex items-start gap-3">
                  <div className="bg-background p-2 rounded border border-card-border shrink-0">
                    <Repeat className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Devolución 14 días
                    </h4>
                    <p className="text-[9px] text-text-muted leading-tight mt-0.5">
                      Sin preguntas. Reembolso íntegro.
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-card-border p-3 rounded flex items-start gap-3">
                  <div className="bg-background p-2 rounded border border-card-border shrink-0">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
                      Pago seguro SSL
                    </h4>
                    <p className="text-[9px] text-text-muted leading-tight mt-0.5">
                      Cifrado 256-bit vía Stripe.
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
                      {isEstimatingShipping ? 'Calculando...' : (shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost))}
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
                            {promoType === 'percent' ? `${promoValue}% de descuento adicional` : promoType === 'free_shipping' ? 'Envío Gratuito' : `${formatPrice(promoValue / 100)} de descuento`}
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
                  <p className="text-[10px] text-text-muted font-sans">Stripe • Tarjeta, Bizum, Klarna</p>
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
