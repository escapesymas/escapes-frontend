'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: number;
  title: string;
  name?: string; // name in next.js types
  slug: string;
  price: number;
  regularPrice?: number;
  sku: string;
  image: string;
  inStock: boolean;
  stock?: number;
  category: string;
  categorySlug?: string;
  description?: string;
  shortDescription?: string;
  quantity: number;
}

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: any, quantity?: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  toast: { message: string; type: 'success' | 'info' } | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session token & load cart from local storage first
  useEffect(() => {
    let token = localStorage.getItem('escapes_cart_session_token');
    if (!token) {
      token = 'token_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('escapes_cart_session_token', token);
    }
    setSessionToken(token);

    const saved = localStorage.getItem('escapesymas_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing local cart:', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Fetch cart from PostgreSQL when sessionToken or user changes
  useEffect(() => {
    if (!sessionToken || !isInitialized) return;

    const fetchDBCart = async () => {
      try {
        const uId = user?.id ? String(user.id) : '';
        const res = await fetch(`/api/cart?sessionToken=${sessionToken}${uId ? `&userId=${uId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            // Merge PostgreSQL cart with local cart (prefer Postgres)
            setCart(data.items);
            localStorage.setItem('escapesymas_cart', JSON.stringify(data.items));
          }
        }
      } catch (e) {
        console.error('Failed to sync PostgreSQL cart on mount:', e);
      }
    };

    fetchDBCart();
  }, [user, sessionToken, isInitialized]);

  // Push cart updates to PostgreSQL and local storage
  useEffect(() => {
    if (!isInitialized || !sessionToken) return;

    localStorage.setItem('escapesymas_cart', JSON.stringify(cart));

    const syncToDB = async () => {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id ? String(user.id) : null,
            sessionToken,
            items: cart,
            userEmail: user?.email || null,
            userFirstName: user?.firstName || null,
            userLastName: user?.lastName || null,
            userUsername: user?.username || null,
          }),
        });
      } catch (e) {
        console.error('Failed to sync cart to database:', e);
      }
    };

    // Debounce database sync slightly to prevent hammering the server on rapid clicks
    const timeout = setTimeout(syncToDB, 500);
    return () => clearTimeout(timeout);
  }, [cart, sessionToken, user, isInitialized]);

  const addToCart = (product: any, quantity: number = 1) => {
    // Normalizar campos del producto
    const itemTitle = product.name || product.title || 'Producto';
    const itemImage = product.image || (product.images && product.images[0]?.src) || '';
    const itemCategory = product.category || '';

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: itemTitle,
          slug: product.slug || '',
          price: product.price,
          regularPrice: product.regularPrice || product.price,
          sku: product.sku || '',
          image: itemImage,
          inStock: product.inStock !== undefined ? product.inStock : true,
          stock: product.stock,
          category: itemCategory,
          categorySlug: product.categorySlug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          quantity,
        },
      ];
    });

    setToast({
      message: `Añadido al carrito: ${itemTitle}`,
      type: 'success',
    });

    setTimeout(() => setToast(null), 3000);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const restoreCart = (items: CartItem[]) => {
    setCart(items);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        restoreCart,
        toast,
      }}
    >
      {children}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
          <div className="bg-slate-900 border border-slate-800 text-white font-sans text-xs font-bold uppercase tracking-wider px-5 py-3 rounded shadow-lg shadow-black/50 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            {toast.message}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
