
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle, Loader2, AlertCircle, XCircle, User, ArrowRight, Mail, HelpCircle, MessageSquare } from 'lucide-react';
import { CartItem, User as UserType } from '../types';
import { createOrder, updateOrderStatus, fetchUserRank, makeRequest } from '../services/woocommerce';
import { createSumUpCheckout } from '../services/sumup';
import { loginUser, registerUser } from '../services/auth';
import { trackPurchase } from '../utils/analytics';

interface CheckoutProps {
  cart: CartItem[];
  user?: UserType | null;
  onBack: () => void;
  onOrderComplete: () => void;
  onLoginSuccess: (user: UserType) => void;
}

// Declare Globals
declare global {
  interface Window {
    SumUpCard: any;
    Stripe: any;
  }
}

export const Checkout: React.FC<CheckoutProps> = (props) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKlarnaCancel, setIsKlarnaCancel] = useState(false);

  // Auth Gate State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login Inputs
  const [loginUserVal, setLoginUserVal] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register Inputs
  const [regData, setRegData] = useState({
    firstName: '', lastName: '', email: '', username: '', password: ''
  });

  // SumUp State
  const [sumupCheckoutId, setSumupCheckoutId] = useState<string | null>(null);
  const [isSumupLoading, setIsSumupLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'sumup' | 'klarna'>('sumup');

  // Check for Klarna return status (handles return from portal)
  useEffect(() => {
    const status = searchParams.get('klarna_status');
    const redirectStatus = searchParams.get('redirect_status');

    if (status === 'error' || status === 'cancel' || redirectStatus === 'failed') {
      setIsKlarnaCancel(true);
      setErrorMessage("El pago con Klarna no se ha podido completar. ¿Necesitas ayuda para finalizar tu pedido?");
    } else if (redirectStatus === 'succeeded') {
      const pi = searchParams.get('payment_intent');
      if (pi) finalizeOrder('klarna', pi);
    }
  }, [searchParams]);
  const stripeRef = useRef<any>(null);

  // Pending Order State (para tracking de carritos abandonados)
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    phone: ''
  });

  // REF: Mantiene siempre la última versión de los datos para los callbacks externos (SumUp)
  const formDataRef = useRef(formData);

  // Auto-fill User Data
  useEffect(() => {
    if (props.user) {
      const initialData = {
        firstName: props.user.firstName || '',
        lastName: props.user.lastName || '',
        email: props.user.email || '',
        address: props.user.billing?.address_1 || '',
        city: props.user.billing?.city || '',
        zip: props.user.billing?.postcode || '',
        phone: props.user.billing?.phone || ''
      };
      setFormData(initialData);
      formDataRef.current = initialData;
    }
  }, [props.user]);

  // Sync Ref with State on every change
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Rank Discount State
  const [userRank, setUserRank] = useState<{ discount: number, title: string } | null>(null);
  const [isRankLoading, setIsRankLoading] = useState(true);

  useEffect(() => {
    if (props.user && props.user.id) {
      fetchUserRank(props.user!.id).then(rank => {
        if (rank && rank.discount > 0) {
          setUserRank({ discount: rank.discount, title: rank.title });
        }
        setIsRankLoading(false);
      });
    } else {
      setIsRankLoading(false);
    }
  }, [props.user]);

  // Calculations
  const subtotal = props.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = userRank ? (subtotal * userRank.discount) / 100 : 0;

  const shippingThreshold = 150;
  const shippingCost = subtotal > shippingThreshold ? 0 : 9.95;
  const total = subtotal + shippingCost - discountAmount;

  // Initialize Payment Gateways when user is logged in
  useEffect(() => {
    if (props.user && !isRankLoading) {
      if (paymentMethod === 'sumup') {
        if (!sumupCheckoutId) {
          loadSumUpScriptAndInit();
        } else {
          // Si ya tenemos el ID, nos aseguramos de montar el widget (crucial tras cambiar de pestaña)
          setTimeout(() => mountSumUpWidget(sumupCheckoutId), 100);
        }
      } else if (paymentMethod === 'klarna') {
        loadStripeScript();
      }

      // Crear pedido pendiente para tracking de abandonos
      if (!pendingOrderId) createPendingOrder();
    }
  }, [props.user, isRankLoading, paymentMethod]);

  // Crear pedido pendiente en WooCommerce
  const createPendingOrder = async () => {
    if (!props.user || pendingOrderId) return;

    const currentData = formDataRef.current;
    const orderPayload = {
      status: 'pending',
      payment_method: paymentMethod === 'sumup' ? 'sumup_gateway' : 'woocommerce_payments',
      payment_method_title: paymentMethod === 'sumup' ? 'Tarjeta (SumUp)' : 'Klarna / Pago Flexible',
      set_paid: false,
      customer_id: props.user.id || 0,
      billing: {
        first_name: currentData.firstName || props.user.firstName || 'Cliente',
        last_name: currentData.lastName || props.user.lastName || '',
        address_1: currentData.address || '',
        city: currentData.city || '',
        postcode: currentData.zip || '',
        country: 'ES',
        email: currentData.email || props.user.email || '',
        phone: currentData.phone || ''
      },
      shipping: {
        first_name: currentData.firstName || props.user.firstName || '',
        last_name: currentData.lastName || props.user.lastName || '',
        address_1: currentData.address || '',
        city: currentData.city || '',
        postcode: currentData.zip || '',
        country: 'ES'
      },
      line_items: props.cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      fee_lines: userRank && userRank.discount > 0 ? [
        {
          name: `Descuento Paddock (${userRank.title})`,
          total: `-${discountAmount.toFixed(2)}`
        }
      ] : [],
      meta_data: [
        { key: '_checkout_source', value: 'react_app' },
        { key: '_checkout_started', value: new Date().toISOString() }
      ]
    };

    try {
      const result = await createOrder(orderPayload);
      if (result.success && result.id) {
        setPendingOrderId(result.id);
        console.log('[CHECKOUT] Pending order created:', result.id);
      }
    } catch (error) {
      console.error('[CHECKOUT] Failed to create pending order:', error);
    }
  };

  // DYNAMIC SCRIPT LOADING
  const loadStripeScript = () => {
    if (window.Stripe) return;
    setIsStripeLoading(true);
    const script = document.createElement('script');
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => setIsStripeLoading(false);
    document.body.appendChild(script);
  };

  const loadSumUpScriptAndInit = () => {
    if (window.SumUpCard) {
      initializeSumUp();
      return;
    }

    setIsSumupLoading(true);
    const script = document.createElement('script');
    script.src = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
    script.async = true;
    script.onload = () => initializeSumUp();
    script.onerror = () => {
      setIsSumupLoading(false);
      setErrorMessage("Error cargando la librería de pagos. Revisa tu conexión.");
    };
    document.body.appendChild(script);
  };

  // Refactor: Mueve la lógica de montado fuera para que sea reutilizable
  const mountSumUpWidget = (checkoutId: string, attemptsLeft = 10) => {
    const container = document.getElementById('sumup-card');

    if (window.SumUpCard && container) {
      try {
        // Limpiamos el contenedor para evitar duplicados o estados corruptos
        container.innerHTML = '';

        window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: checkoutId,
          onResponse: function (type: string, body: any) {
            console.log('[SUMUP] Response callback:', type, body);
            if (type === 'success') {
              if (body.status === 'FAILED') {
                setErrorMessage("El pago ha sido denegado por el banco.");
                if (pendingOrderId) updateOrderStatus(pendingOrderId, 'failed');
                return;
              }
              finalizeOrder('sumup', body.transaction_code || body.id || 'SUMUP_TX');
            } else if (type === 'error') {
              console.error('[SUMUP] Widget Error:', body);
              setErrorMessage("Error en el pago: " + (body.message || "Inténtalo de nuevo"));
              if (pendingOrderId) updateOrderStatus(pendingOrderId, 'failed');
            }
          },
          showFooter: false,
          locale: 'es-ES'
        });

        setIsSumupLoading(false);
      } catch (e) {
        console.error("[SUMUP] Exception during mount()", e);
        if (attemptsLeft > 0) setTimeout(() => mountSumUpWidget(checkoutId, attemptsLeft - 1), 500);
      }
    } else {
      if (attemptsLeft > 0) {
        setTimeout(() => mountSumUpWidget(checkoutId, attemptsLeft - 1), 500);
      } else {
        setIsSumupLoading(false);
      }
    }
  };

  const initializeSumUp = async () => {
    if (!props.user) return;
    setIsSumupLoading(true);
    // Don't clear error message if returning from a cancelled/failed Klarna payment
    const params = new URLSearchParams(window.location.search);
    const klarnaReturn = params.get('klarna_status');
    const redirectFailed = params.get('redirect_status') === 'failed';
    if (!isKlarnaCancel && !klarnaReturn && !redirectFailed) setErrorMessage(null);

    const tempRef = `ORD-${Date.now()}`;
    const checkoutData = await createSumUpCheckout(total, tempRef);

    if (checkoutData && checkoutData.id) {
      setSumupCheckoutId(checkoutData.id);
      mountSumUpWidget(checkoutData.id);
    } else {
      setIsSumupLoading(false);
      setErrorMessage("Error de conexión: No se pudo iniciar la pasarela de pago segura.");
    }
  };

  const handleKlarnaPayment = async () => {
    if (!pendingOrderId && !props.user) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Obtener Client Secret a través de nuestra nueva API en escapes-api
      const response = await makeRequest('/escapes/v1/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ order_id: pendingOrderId || 0 })
      });

      const { client_secret, publishable_key, stripe_account } = response.data;

      if (!client_secret || !publishable_key) {
        throw new Error("No se pudo obtener el token de pago de Stripe.");
      }

      // 2. Inicializar Stripe si no lo está
      if (!window.Stripe) {
        throw new Error("La librería de Stripe no ha cargado correctamente.");
      }

      const stripe = window.Stripe(publishable_key, stripe_account ? { stripeAccount: stripe_account } : {});

      // 3. Confirmar pago con Klarna
      const { error, paymentIntent } = await stripe.confirmKlarnaPayment(client_secret, {
        payment_method: {
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
        },
        return_url: `${window.location.origin}/checkout?klarna_status=return&order=${pendingOrderId}`,
      });

      if (error) {
        setErrorMessage(error.message || "Error al procesar el pago con Klarna.");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        finalizeOrder('klarna', paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Stripe redirigirá automáticamente si es necesario
      }
    } catch (err: any) {
      console.error("[KLARNA ERROR]", err);
      setErrorMessage(err.message || "Error al conectar con la pasarela de Klarna.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // --- AUTH HANDLERS ---
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const session = await loginUser(loginUserVal, loginPass);
      // loginUser devuelve Session directamente o lanza error
      if (session && session.token) {
        props.onLoginSuccess({
          id: 0,
          username: loginUserVal,
          email: session.user_email,
          firstName: session.user_display_name,
          lastName: '',
          token: session.token,
        });
      } else if (session.warning) {
        setAuthError(session.warning);
      } else {
        setAuthError("Credenciales incorrectas");
      }
    } catch (err: any) {
      setAuthError(err.message || "Error de conexión");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await registerUser(regData);
      // registerUser devuelve Session directamente o lanza error
      if (result && result.token) {
        props.onLoginSuccess({
          id: result.user_id || 0,
          username: regData.username,
          email: result.user_email,
          firstName: result.user_display_name || regData.firstName,
          lastName: regData.lastName,
          token: result.token,
        });
      } else if (result.warning) {
        // Usuario creado pero sin token - pedir login manual
        setAuthMode('login');
        setAuthError(result.warning);
      } else {
        setAuthError("Error al registrarse");
      }
    } catch (err: any) {
      setAuthError(err.message || "Error de conexión");
    } finally {
      setAuthLoading(false);
    }
  };

  // Finalize order in WooCommerce after successful payment
  const finalizeOrder = async (method: string, transactionId: string) => {
    setIsProcessing(true);

    const currentData = formDataRef.current;

    // Fallback email logic
    let safeEmail = currentData.email;
    if (!safeEmail || !safeEmail.includes('@')) {
      console.warn("Email inválido detectado tras pago. Usando fallback.");
      safeEmail = `cliente-sin-email-${Date.now()}@escapesymas.com`;
    }

    // Si ya existe un pedido pendiente, actualizarlo en lugar de crear uno nuevo
    if (pendingOrderId) {
      try {
        // Actualizar el pedido pendiente a processing (pagado)
        await updateOrderStatus(pendingOrderId, 'processing');
        console.log('[CHECKOUT] Pending order updated to processing:', pendingOrderId);
        setOrderId(pendingOrderId);
        setStep('success');
      } catch (error) {
        console.error('[CHECKOUT] Failed to update pending order:', error);
        setErrorMessage("Error actualizando el pedido. Referencia: " + transactionId);
      }
      setIsProcessing(false);
      return;
    }

    // Fallback: crear nuevo pedido si no hay pendiente
    const orderPayload = {
      payment_method: 'sumup_gateway',
      payment_method_title: 'Tarjeta (SumUp)',
      set_paid: true,
      status: 'processing',
      transaction_id: transactionId,
      customer_id: props.user?.id || 0,
      billing: {
        first_name: currentData.firstName || 'Cliente',
        last_name: currentData.lastName || 'Tienda',
        address_1: currentData.address || 'Dirección Pendiente',
        city: currentData.city || 'Ciudad Pendiente',
        postcode: currentData.zip || '00000',
        country: 'ES',
        email: safeEmail,
        phone: currentData.phone
      },
      shipping: {
        first_name: currentData.firstName,
        last_name: currentData.lastName,
        address_1: currentData.address,
        city: currentData.city,
        postcode: currentData.zip,
        country: 'ES'
      },
      line_items: props.cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      fee_lines: userRank && userRank.discount > 0 ? [
        {
          name: `Descuento Paddock (${userRank.title})`,
          total: `-${discountAmount.toFixed(2)}`
        }
      ] : []
    };

    const result = await createOrder(orderPayload);

    if (result.success) {
      setOrderId(result.id || 0);

      // Track Purchase
      trackPurchase(
        transactionId,
        total,
        props.cart
      );

      setStep('success');
    } else {
      console.error("Error creating order after payment:", result.error);
      setErrorMessage(result.error || "Pago correcto, pero error guardando el pedido. Contáctanos con Ref: " + transactionId);
    }
    setIsProcessing(false);
  };

  // SUCCESS VIEW
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
        <div className="bg-racing-carbon border border-zinc-800 p-8 rounded-sm max-w-md w-full text-center shadow-2xl shadow-green-900/20">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white uppercase italic mb-2">¡Pago Correcto!</h2>
          <p className="text-zinc-400 mb-8">
            Tu pedido ha sido procesado correctamente. Hemos enviado el recibo a tu email.
          </p>
          <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800 mb-8 text-left">
            <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Referencia Pedido</p>
            <p className="text-white font-mono tracking-widest">#{orderId}</p>
          </div>
          <button
            onClick={props.onOrderComplete}
            className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  // AUTH GATE VIEW (Inline Login/Register)
  if (!props.user) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={props.onBack} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic flex items-center gap-3">
            Finalizar Compra
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* AUTH FORMS */}
          <div className="bg-racing-carbon border border-zinc-800 p-8 rounded-sm shadow-xl">
            <div className="flex gap-4 mb-8 border-b border-zinc-700">
              <button
                onClick={() => setAuthMode('login')}
                className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${authMode === 'login' ? 'text-racing-orange border-racing-orange' : 'text-zinc-500 border-transparent hover:text-white'}`}
              >
                Ya soy cliente
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${authMode === 'register' ? 'text-racing-orange border-racing-orange' : 'text-zinc-500 border-transparent hover:text-white'}`}
              >
                Nuevo Cliente
              </button>
            </div>

            {authError && (
              <div className="bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-sm mb-6 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleInlineLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Usuario / Email</label>
                  <input required type="text" value={loginUserVal} onChange={e => setLoginUserVal(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Contraseña</label>
                  <input required type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <button disabled={authLoading} type="submit" className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors flex items-center justify-center gap-2">
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar y Continuar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleInlineRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Nombre" value={regData.firstName} onChange={e => setRegData({ ...regData, firstName: e.target.value })} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                  <input required placeholder="Apellidos" value={regData.lastName} onChange={e => setRegData({ ...regData, lastName: e.target.value })} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                </div>
                <input required placeholder="Email" type="email" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                <input required placeholder="Usuario (Nick)" value={regData.username} onChange={e => setRegData({ ...regData, username: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                <input required placeholder="Contraseña (mín 6 carac.)" type="password" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />

                <button disabled={authLoading} type="submit" className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors flex items-center justify-center gap-2">
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta y Continuar'}
                </button>
              </form>
            )}
          </div>

          {/* ORDER PREVIEW */}
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Resumen de tu pedido</h3>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <div className="space-y-4 mb-6">
                {props.cart.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-white rounded-sm overflow-hidden flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold line-clamp-1">{item.title}</p>
                      <p className="text-zinc-500 text-xs">{item.quantity} x {formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <span className="text-zinc-400">Total a pagar</span>
                <span className="text-xl font-bold text-white">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-4 text-zinc-500 text-xs">
              <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Pago Seguro</div>
              <div className="flex items-center gap-1"><Lock className="w-4 h-4" /> Datos Encriptados</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM VIEW (Logged In)
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={props.onBack} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic flex items-center gap-3">
          Checkout Seguro <Lock className="w-5 h-5 text-green-500" />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: FORMS & PAYMENT */}
        <div className="lg:col-span-2 space-y-8">

          {/* 1. Shipping Info */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="bg-racing-orange text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Datos de Envío
            </h3>

            {props.user && (
              <div className="mb-4 bg-blue-900/20 border border-blue-800 p-3 rounded-sm text-blue-200 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sesión iniciada como <strong>{props.user.firstName}</strong>. Hemos autocompletado tus datos.</span>
              </div>
            )}

            <form id="shipping-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required name="firstName" placeholder="Nombre" autoComplete="given-name" value={formData.firstName} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              <input required name="lastName" placeholder="Apellidos" autoComplete="family-name" value={formData.lastName} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              <input required name="email" type="email" placeholder="Email (Obligatorio)" autoComplete="email" value={formData.email} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
              <input required name="address" placeholder="Dirección completa" autoComplete="street-address" value={formData.address} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
              <div className="grid grid-cols-2 gap-4">
                <input required name="city" placeholder="Ciudad" autoComplete="address-level2" value={formData.city} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
                <input required name="zip" placeholder="Código Postal" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]*" value={formData.zip} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              </div>
              <input required name="phone" placeholder="Teléfono" autoComplete="tel" inputMode="numeric" pattern="[0-9]*" value={formData.phone} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white text-base rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
            </form>
          </section>

          {/* 2. Payment Method Selector */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="bg-racing-orange text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Método de Pago
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setPaymentMethod('sumup')}
                className={`group relative p-6 border rounded-sm transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden ${paymentMethod === 'sumup'
                  ? 'border-racing-orange bg-racing-orange/5 shadow-[0_0_20px_rgba(255,102,0,0.1)]'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 grayscale opacity-60'
                  }`}
              >
                {paymentMethod === 'sumup' && (
                  <div className="absolute top-0 right-0 p-1.5 bg-racing-orange text-white rounded-bl-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-sm flex items-center justify-center">
                    <img src="/card-icon.png" className="h-5 w-auto" alt="Tarjeta" />
                  </div>
                  <span className="text-white font-extrabold text-sm uppercase tracking-tighter">Tarjeta de Crédito</span>
                </div>
                <div className="flex gap-2 items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1000px-Visa_Inc._logo.svg.png" className="h-2.5 object-contain" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-3 object-contain" />
                  <span className="text-[10px] text-zinc-500 font-medium">y más...</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('klarna')}
                className={`group relative p-6 border rounded-sm transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden ${paymentMethod === 'klarna'
                  ? 'border-[#FFB3C7] bg-[#FFB3C7]/5 shadow-[0_0_20px_rgba(255,179,199,0.1)]'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 grayscale opacity-60'
                  }`}
              >
                {paymentMethod === 'klarna' && (
                  <div className="absolute top-0 right-0 p-1.5 bg-[#FFB3C7] text-black rounded-bl-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-[#FFB3C7] font-black text-2xl tracking-tighter leading-none">Klarna.</span>
                  <span className="text-white font-extrabold text-sm uppercase tracking-tighter">Pago Flexible</span>
                </div>
                <div className="bg-zinc-800/50 px-3 py-0.5 rounded-full">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">3 Plazos Sin Intereses</span>
                </div>
              </button>
            </div>

            {/* PAYMENT CONTENT */}
            <div className="bg-zinc-900 p-6 rounded-sm border border-zinc-800 min-h-[200px] flex flex-col justify-center relative">

              {paymentMethod === 'sumup' ? (
                <div className="animate-fade-in w-full max-w-sm mx-auto">
                  {isSumupLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                      <span className="text-xs text-zinc-400">Cargando pasarela segura...</span>
                    </div>
                  )}

                  <div id="sumup-card" className="bg-white rounded-md p-1 min-h-[150px] w-full"></div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 justify-center pt-4">
                    <Lock className="w-3 h-3" />
                    Transacción segura vía <span className="text-zinc-300 font-bold italic">SumUp</span>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in w-full text-center py-4">
                  <div className="mb-6">
                    <span className="text-[#FFB3C7] font-black text-4xl block mb-2">Klarna.</span>
                    <p className="text-white text-sm font-medium">Paga en 3 plazos de {formatPrice(total / 3)} sin intereses.</p>
                    <p className="text-zinc-500 text-xs mt-1">Recibirás tu pedido ahora y pagarás después.</p>
                  </div>

                  <button
                    onClick={handleKlarnaPayment}
                    disabled={isProcessing || isStripeLoading}
                    className="bg-[#FFB3C7] hover:bg-[#ff94af] text-black font-black uppercase py-4 px-8 rounded-full transition-all flex items-center justify-center gap-3 mx-auto w-full max-w-sm shadow-xl shadow-[#FFB3C7]/10 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>PAGAR CON KLARNA <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  <div className="mt-6 flex items-center justify-center gap-4 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Klarna_Logo.svg/1000px-Klarna_Logo.svg.png" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/d7/Stripe_Logo%2C_revised_2016.svg/1280px-Stripe_Logo%2C_revised_2016.svg.png" className="h-4" />
                  </div>
                </div>
              )}

              {!formData.email && paymentMethod === 'sumup' && !isSumupLoading && (
                <div className="text-center mt-4 p-2 bg-yellow-900/20 border border-yellow-800 rounded-sm">
                  <p className="text-xs text-yellow-500">
                    ⚠️ Rellena los <strong>Datos de Envío</strong> para habilitar el pago.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm sticky top-24">
            <h3 className="text-white font-bold uppercase mb-4 tracking-wide text-sm">Resumen del Pedido</h3>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {props.cart.map(item => (
                <div key={item.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-zinc-400 truncate flex-1">{item.quantity}x {item.title}</span>
                  <span className="text-white font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>

              {userRank && (
                <div className="flex justify-between text-racing-orange text-sm">
                  <span>Descuento {userRank.title} (-{userRank.discount}%)</span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Envío</span>
                <span className={shippingCost === 0 ? "text-green-500 font-bold" : "text-white font-medium"}>
                  {shippingCost === 0 ? "GRATIS" : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-zinc-800 mt-4">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6">
              <span className="text-white font-bold uppercase">Total</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-white block leading-none">{formatPrice(total)}</span>
                <span className="text-zinc-500 text-xs">Impuestos incluidos</span>
              </div>
            </div>

            {errorMessage && (
              <div className={`mb-6 p-4 rounded-sm flex flex-col gap-3 ${isKlarnaCancel ? 'bg-zinc-800 border border-zinc-700 shadow-xl' : 'bg-red-900/20 border border-red-800 text-red-200'}`}>
                <div className="flex items-start gap-3">
                  {isKlarnaCancel ? <HelpCircle className="w-5 h-5 text-racing-orange flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                  <p className={`text-sm font-medium ${isKlarnaCancel ? 'text-white' : 'text-red-200'}`}>{errorMessage}</p>
                </div>

                {isKlarnaCancel && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-zinc-700/50 mt-1">
                    <button
                      onClick={() => navigate('/contacto')}
                      className="flex items-center justify-center gap-2 bg-racing-orange text-white px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Contactar con un experto
                    </button>
                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        setIsKlarnaCancel(false);
                      }}
                      className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cerrar e intentar de nuevo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold">
                <ShieldCheck className="w-3 h-3" /> SSL Seguro
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold">
                <CheckCircle className="w-3 h-3" /> Garantía Oficial
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
