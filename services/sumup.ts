import { STORE_CONFIG, PAYMENT_CONFIG } from '../storeData';

interface CreateCheckoutResponse {
  id?: string;
  checkout_id?: string;
  status?: string;
  redirect_url?: string;
  error_code?: string;
  message?: string;
}

/**
 * Creates a Checkout Session via our Internal Server Proxy.
 * 
 * This keeps the Secret Key hidden on the server side.
 */
export const createSumUpCheckout = async (amount: number, orderRef: string): Promise<CreateCheckoutResponse | null> => {
  try {
    // We call our own server instead of api.sumup.com
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderRef: orderRef,
        amount: amount,
        currency: STORE_CONFIG.currency,
        merchantEmail: PAYMENT_CONFIG.merchantEmail
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        console.error("Server Proxy Error:", data);
        return null;
    }
    
    return data;
  } catch (error) {
    console.error("Network Error calling Server Proxy:", error);
    return null;
  }
};