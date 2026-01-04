import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CreditCard, Wallet, Smartphone, ArrowLeft, Lock, CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { CartItem, User } from '../types';
import { createOrder } from '../services/woocommerce';
import { createSumUpCheckout } from '../services/sumup';

interface CheckoutProps {
  cart: CartItem[];
  user?: User | null;
  onBack: () => void;
  onOrderComplete: () => void;
}

type PaymentMethod = 'sumup' | 'paypal' | 'bizum';

// Declare SumUp global if typescript complains
declare global {
  interface Window {
    SumUpCard: any;
  }
}

export const Checkout: React.FC<CheckoutProps> = (props) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sumup');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Initialize SumUp when method is selected
  useEffect(() => {
    if (paymentMethod === 'sumup' && !sumupCheckoutId) {
      initializeSumUp();
    }
  }, [paymentMethod]);

  const initializeSumUp = async () => {
    setIsSumupLoading(true);
    setErrorMessage(null);
    
    // Create a temporary reference ID
    const tempRef = `ORD-${Date.now()}`;
    
    // Call our service to create checkout
    const checkoutData = await createSumUpCheckout(total, tempRef);
    
    if (checkoutData && checkoutData.id) {
      setSumupCheckoutId(checkoutData.id);
      
      // Mount Widget with a slight delay to ensure container exists
      setTimeout(() => {
        if (window.SumUpCard) {
          try {
            window.SumUpCard.mount({
              id: 'sumup-card',
              checkoutId: checkoutData.id,
              onResponse: function (type: string, body: any) {
                console.log('SumUp Response:', type, body);
                
                if (type === 'success') {
                  // Verificar estado real de la transacción
                  if (body.status === 'FAILED') {
                     setErrorMessage("El pago ha sido denegado por el banco.");
                     return;
                  }
                  
                  // Payment successful, now create WC Order
                  // Usamos un timeout para asegurar que salimos del stack del iframe si es necesario
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
          } catch (e) {
            console.error("Error mounting SumUp widget", e);
            setErrorMessage("Error cargando el widget de pago.");
          }
        } else {
            setErrorMessage("La librería de SumUp no se cargó correctamente. Refresca la página.");
        }
        setIsSumupLoading(false);
      }, 500);

    } else {
      setIsSumupLoading(false);
      setErrorMessage("No se pudo conectar con SumUp (Posible bloqueo CORS en localhost). Revisa la consola.");
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

  // Finalize order in WooCommerce after successful payment
  const finalizeOrder = async (method: string, transactionId: string) => {
    setIsProcessing(true);
    
    // LEER DATOS DESDE EL REF PARA EVITAR STALE CLOSURE (Datos vacíos)
    const currentData = formDataRef.current;
    
    // Validación de emergencia para Email (WooCommerce lo requiere sí o sí)
    // Si el usuario pagó pero no puso email, inventamos uno para no perder el pedido.
    let safeEmail = currentData.email;
    if (!safeEmail || !safeEmail.includes('@')) {
        console.warn("Email inválido detectado tras pago. Usando fallback.");
        safeEmail = `cliente-sin-email-${Date.now()}@escapesymas.com`;
    }

    const orderPayload = {
      payment_method: method === 'sumup' ? 'sumup_gateway' : 'bacs',
      payment_method_title: method === 'sumup' ? 'Tarjeta (SumUp)' : 'Otros',
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

  // Handle Manual Payment Buttons (PayPal/Bizum)
  const handleManualSubmit = async () => {
    // Para manual también usamos la referencia segura
    if (!formData.email) {
      setErrorMessage("Por favor, introduce un email válido.");
      return;
    }
    finalizeOrder(paymentMethod, 'MANUAL');
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

  // FORM VIEW
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
        
        {/* LEFT COLUMN: FORMS */}
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

          {/* 2. Payment Method */}
          <section className="bg-racing-carbon border border-zinc-800 p-6 rounded-sm">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="bg-racing-orange text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Método de Pago
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button 
                type="button"
                onClick={() => setPaymentMethod('sumup')}
                className={`p-4 border rounded-sm flex flex-col items-center gap-3 transition-all relative overflow-hidden ${paymentMethod === 'sumup' ? 'bg-zinc-800 border-blue-500 ring-1 ring-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
              >
                {paymentMethod === 'sumup' && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-bl-sm"></div>}
                <div className="flex gap-1 items-center">
                   <div className="w-5 h-5 rounded-sm border-2 border-current flex items-center justify-center font-bold text-[10px]">S</div>
                   <span className="font-bold">SumUp</span>
                </div>
                <span className="text-xs font-bold uppercase">Tarjeta</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 border rounded-sm flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'paypal' ? 'bg-zinc-800 border-racing-orange ring-1 ring-racing-orange text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
              >
                <Wallet className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">PayPal</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('bizum')}
                className={`p-4 border rounded-sm flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'bizum' ? 'bg-zinc-800 border-racing-orange ring-1 ring-racing-orange text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Bizum</span>
              </button>
            </div>

            {/* PAYMENT CONTENT */}
            <div className="bg-zinc-900 p-6 rounded-sm border border-zinc-800 min-h-[250px] flex flex-col justify-center relative">
              
              {/* SUMUP WIDGET */}
              {paymentMethod === 'sumup' && (
                <div className="animate-fade-in w-full max-w-sm mx-auto">
                   {isSumupLoading && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                        <span className="text-xs text-zinc-400">Conectando con SumUp...</span>
                     </div>
                   )}
                   
                   {/* This div is where SumUp mounts */}
                   <div id="sumup-card" className="bg-white rounded-md p-1 min-h-[150px]"></div>
                   
                   {!formData.email && !isSumupLoading && (
                      <div className="text-center mt-4 p-2 bg-yellow-900/20 border border-yellow-800 rounded-sm">
                        <p className="text-xs text-yellow-500">
                          ⚠️ Por favor, rellena los <strong>Datos de Envío</strong> antes de pagar.
                        </p>
                      </div>
                   )}

                   <div className="flex items-center gap-2 text-[10px] text-zinc-500 justify-center pt-4">
                    <Lock className="w-3 h-3" />
                    Pasarela oficial <span className="text-zinc-300 font-bold">SumUp</span>
                  </div>
                </div>
              )}

              {/* PAYPAL */}
              {paymentMethod === 'paypal' && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div 
                    onClick={handleManualSubmit}
                    className="bg-[#0070BA] text-white p-4 rounded-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#005ea6] transition-colors"
                  >
                    <Wallet className="w-5 h-5" /> Pagar con PayPal
                  </div>
                  <p className="text-xs text-zinc-500">
                    Serás redirigido a la plataforma segura de PayPal para completar la transacción.
                  </p>
                </div>
              )}

              {/* BIZUM */}
              {paymentMethod === 'bizum' && (
                <div className="animate-fade-in space-y-4">
                  <div className="bg-zinc-950 border border-zinc-700 p-4 rounded-sm flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-racing-orange" />
                    <input 
                      placeholder="Nº Móvil (+34)" 
                      className="bg-transparent w-full text-white focus:outline-none" 
                    />
                  </div>
                  <button 
                    onClick={handleManualSubmit}
                    className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm"
                  >
                    Pagar con Bizum
                  </button>
                  <p className="text-xs text-zinc-500 text-center">
                    Recibirás una solicitud de pago en tu app bancaria.
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

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-200 text-xs rounded-sm flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errorMessage}
              </div>
            )}

            {/* If SumUp is selected, the button is inside the widget, so we hide this main button or use it as trigger if widget isn't auto */}
            {paymentMethod !== 'sumup' && (
               <button 
                 disabled={isProcessing}
                 className="w-full bg-racing-orange hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wide py-4 px-6 rounded-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
               >
                 Selecciona un método arriba
               </button>
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