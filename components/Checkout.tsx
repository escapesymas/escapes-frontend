
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle, Loader2, AlertCircle, XCircle, User, ArrowRight, Mail } from 'lucide-react';
import { CartItem, User as UserType } from '../types';
import { createOrder } from '../services/woocommerce';
import { createSumUpCheckout } from '../services/sumup';
import { loginUser, registerUser } from '../services/auth';

interface CheckoutProps {
  cart: CartItem[];
  user?: UserType | null;
  onBack: () => void;
  onOrderComplete: () => void;
  onLoginSuccess: (user: UserType) => void;
}

// Declare SumUp global if typescript complains
declare global {
  interface Window {
    SumUpCard: any;
  }
}

export const Checkout: React.FC<CheckoutProps> = (props) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderId, setOrderId] = useState<number | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Calculations
  const subtotal = props.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingThreshold = 150;
  const shippingCost = subtotal > shippingThreshold ? 0 : 9.95;
  const total = subtotal + shippingCost;

  // Initialize SumUp ONLY when user is logged in
  useEffect(() => {
    if (props.user && !sumupCheckoutId) {
      loadSumUpScriptAndInit();
    }
  }, [props.user]);

  // DYNAMIC SCRIPT LOADING
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

  const initializeSumUp = async () => {
    if (!props.user) return;

    setIsSumupLoading(true);
    setErrorMessage(null);
    
    // Create a temporary reference ID
    const tempRef = `ORD-${Date.now()}`;
    
    // Call our service to create checkout
    const checkoutData = await createSumUpCheckout(total, tempRef);
    
    if (checkoutData && checkoutData.id) {
      setSumupCheckoutId(checkoutData.id);
      
      // Mount Widget with a robust retry mechanism for mobile
      const mountWidget = (attemptsLeft = 5) => {
        if (window.SumUpCard && document.getElementById('sumup-card')) {
           try {
            window.SumUpCard.mount({
              id: 'sumup-card',
              checkoutId: checkoutData.id,
              onResponse: function (type: string, body: any) {
                console.log('SumUp Response:', type, body);
                
                if (type === 'success') {
                  if (body.status === 'FAILED') {
                     setErrorMessage("El pago ha sido denegado por el banco.");
                     return;
                  }
                  setTimeout(() => {
                    finalizeOrder('sumup', body.transaction_code || body.id || 'SUMUP_TX');
                  }, 100);

                } else if (type === 'error') {
                   setErrorMessage("Error en el pago: " + (body.message || "Inténtalo de nuevo"));
                }
              },
              showFooter: false, 
              locale: 'es-ES'
            });
            setIsSumupLoading(false);
          } catch (e) {
            console.error("Error mounting SumUp widget", e);
            setErrorMessage("Error cargando el widget de pago.");
            setIsSumupLoading(false);
          }
        } else {
          if (attemptsLeft > 0) {
            setTimeout(() => mountWidget(attemptsLeft - 1), 800);
          } else {
            setErrorMessage("La librería de pagos no cargó. Refresca la página.");
            setIsSumupLoading(false);
          }
        }
      };

      // Start mounting process
      mountWidget();

    } else {
      setIsSumupLoading(false);
      setErrorMessage("Error de conexión: No se pudo iniciar la pasarela de pago segura.");
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
      const result = await loginUser(loginUserVal, loginPass);
      if (result.success && result.user) {
        props.onLoginSuccess(result.user);
      } else {
        setAuthError(result.error || "Credenciales incorrectas");
      }
    } catch (err) {
      setAuthError("Error de conexión");
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
      if (result.success) {
        // Auto login after register attempt
        const loginRes = await loginUser(regData.username || regData.email, regData.password);
        if (loginRes.success && loginRes.user) {
           props.onLoginSuccess(loginRes.user);
        } else {
           setAuthMode('login');
           setAuthError("Cuenta creada. Por favor inicia sesión.");
        }
      } else {
        setAuthError(result.error || "Error al registrarse");
      }
    } catch (err) {
      setAuthError("Error de conexión");
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

    const orderPayload = {
      payment_method: 'sumup_gateway',
      payment_method_title: 'Tarjeta (SumUp)',
      set_paid: true,
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
      }))
    };

    const result = await createOrder(orderPayload);
      
    if (result.success) {
      setOrderId(result.id || 0);
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
                    <input required placeholder="Nombre" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                    <input required placeholder="Apellidos" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                  </div>
                  <input required placeholder="Email" type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                  <input required placeholder="Usuario (Nick)" value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                  <input required placeholder="Contraseña (mín 6 carac.)" type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none" />
                  
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
              <input required name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              <input required name="lastName" placeholder="Apellidos" value={formData.lastName} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              <input required name="email" type="email" placeholder="Email (Obligatorio)" value={formData.email} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
              <input required name="address" placeholder="Dirección completa" value={formData.address} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
              <div className="grid grid-cols-2 gap-4">
                 <input required name="city" placeholder="Ciudad" value={formData.city} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
                 <input required name="zip" placeholder="Código Postal" value={formData.zip} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500" />
              </div>
              <input required name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none placeholder-zinc-500 md:col-span-2" />
            </form>
          </section>

          {/* 2. Payment Method (ONLY SUMUP) */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="bg-racing-orange text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Pago con Tarjeta
            </h3>
            
            {/* PAYMENT CONTENT */}
            <div className="bg-zinc-900 p-6 rounded-sm border border-zinc-800 min-h-[200px] flex flex-col justify-center relative">
              
                <div className="animate-fade-in w-full max-w-sm mx-auto">
                   {isSumupLoading && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                        <span className="text-xs text-zinc-400">Cargando pasarela segura...</span>
                     </div>
                   )}
                   
                   {/* This div is where SumUp mounts. Important: width full for mobile */}
                   <div id="sumup-card" className="bg-white rounded-md p-1 min-h-[150px] w-full"></div>
                   
                   {!formData.email && !isSumupLoading && (
                      <div className="text-center mt-4 p-2 bg-yellow-900/20 border border-yellow-800 rounded-sm">
                        <p className="text-xs text-yellow-500">
                          ⚠️ Rellena los <strong>Datos de Envío</strong> para recibir el recibo.
                        </p>
                      </div>
                   )}
                </div>

               <div className="flex items-center gap-2 text-[10px] text-zinc-500 justify-center pt-4">
                  <Lock className="w-3 h-3" />
                  Transacción protegida por <span className="text-zinc-300 font-bold">SumUp</span>
                </div>
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
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-200 text-xs rounded-sm flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errorMessage}
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
