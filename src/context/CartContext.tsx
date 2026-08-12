'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface CartItem {
  id: number;
  title: string;
  name?: string;
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
  restoreLastRemoved: () => void;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasFetchedDB, setHasFetchedDB] = useState(false);

  function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Initialize session token & load cart from local storage first
  useEffect(() => {
    let token = localStorage.getItem('escapes_cart_session_token');

    if (!token) {
      token = 'token_' + generateUUID();
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
    let cancelled = false;

    const fetchDBCart = async () => {
      try {
        const res = await fetch(`/api/cart?sessionToken=${encodeURIComponent(sessionToken)}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            setCart((prev) => {
              const merged = [...data.items];
              for (const local of prev) {
                if (!merged.find((m: any) => m.id === local.id)) {
                  merged.push(local);
                }
              }
              return merged;
            });
          }
        }
      } catch (e) {
        console.error('Failed to sync PostgreSQL cart on mount:', e);
      } finally {
        if (!cancelled) setHasFetchedDB(true);
      }
    };

    fetchDBCart();
    return () => { cancelled = true; };
  }, [user, sessionToken, isInitialized]);

  // Push cart updates to PostgreSQL and local storage
  useEffect(() => {
    if (!isInitialized || !sessionToken || !hasFetchedDB) return;

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

    const timeout = setTimeout(syncToDB, 250);
    return () => clearTimeout(timeout);
  }, [cart, sessionToken, user, isInitialized, hasFetchedDB]);

  const addToCart = (product: any, quantity: number = 1) => {
    const itemTitle = product.name || product.title || 'Producto';
    const itemImage = product.image || (product.images && product.images[0]?.src) || '';
    const itemCategory = product.category || '';

    const updated = setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQty = existing ? existing.quantity + quantity : quantity;

      if (product.stock != null && newQty > product.stock) {
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(newQty, product.stock ?? newQty) } : item
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

    showToast({ message: `Añadido al carrito: ${itemTitle}`, type: 'success' });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: number) => {
    const removed = cart.find((item) => item.id === id);
    setCart((prev) => prev.filter((item) => item.id !== id));
    if (removed) {
      setLastRemovedItem(removed);
      showToast({
        message: 'Producto eliminado',
        type: 'info',
        duration: 5000,
        action: { label: 'Deshacer', onClick: () => {
          setCart((prev) => [...prev, removed]);
          setLastRemovedItem(null);
        }},
      });
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const restoreCart = (items: CartItem[]) => {
    setCart(items);
  };

  const restoreLastRemoved = () => {
    if (!lastRemovedItem) return;
    setCart((prev) => [...prev, lastRemovedItem]);
    setLastRemovedItem(null);
    showToast({ message: `Restaurado: ${lastRemovedItem.title}`, type: 'success' });
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
        restoreLastRemoved,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
