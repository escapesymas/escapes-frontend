import { useState, useEffect } from 'react';
import { CartItem, Product, User } from '../types';
import { getUserCart, fetchProducts, saveUserCart, API_BASE } from '../services/apiService';
import { trackAddToCart } from '../utils/analytics';

export function useCart(user: User | null, setToast: (toast: any) => void) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('escapesymas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load / Sync cart from PostgreSQL on mount / session change
  useEffect(() => {
    (async () => {
      try {
        let token = localStorage.getItem('escapes_cart_session_token');
        if (!token) {
          token = 'token_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
          localStorage.setItem('escapes_cart_session_token', token);
        }
        setSessionToken(token);

        const uId = user?.id ? String(user.id) : '';
        const res = await fetch(`${API_BASE}/api/cart?sessionToken=${token}${uId ? `&userId=${uId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            setCart(data.items);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to sync PostgreSQL cart on mount', e);
      }
    })();
  }, [user]);

  // Synchronize cart with local storage and database
  useEffect(() => {
    localStorage.setItem('escapesymas_cart', JSON.stringify(cart));
    if (!sessionToken) return;

    (async () => {
      try {
        await fetch(`${API_BASE}/api/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id ? String(user.id) : null,
            sessionToken,
            items: cart,
            userEmail: user?.email || null,
            userFirstName: user?.firstName || null,
            userLastName: user?.lastName || null,
            userUsername: user?.username || null
          })
        });
      } catch (e) {
        console.error('Failed to sync cart to database', e);
      }
    })();
  }, [cart, sessionToken, user]);

  const addToCart = (product: Product, quantity: number = 1) => {
    trackAddToCart(product, quantity);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    // Mostrar Toast
    setToast({
      message: `Añadido: ${product.title} (${quantity})`,
      type: 'success'
    });

    // Auto-hide toast
    setTimeout(() => setToast(null), 3000);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return { cart, setCart, addToCart, updateQuantity, removeItem };
}
