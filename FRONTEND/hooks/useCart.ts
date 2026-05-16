import { useState, useEffect } from 'react';
import { CartItem, Product, User } from '../types';
import { getUserCart, fetchProducts, saveUserCart } from '../services/woocommerce';
import { trackAddToCart } from '../utils/analytics';

export function useCart(user: User | null, setToast: (toast: any) => void) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('escapesymas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Restaurar carrito desde el servidor si el local está vacío al iniciar sesión
  useEffect(() => {
    const restoreCart = async () => {
      const localCart = localStorage.getItem('escapesymas_cart');
      const hasLocalItems = localCart && JSON.parse(localCart).length > 0;

      if (user?.id && user.id > 0 && !hasLocalItems) {
        try {
          const savedCart = await getUserCart(user.id);
          if (savedCart.length > 0) {
            const { products: allProducts } = await fetchProducts(undefined, undefined, 1, 100);
            const restoredCart = savedCart.map(item => {
              const product = allProducts.find(p => p.id === item.product_id);
              return product ? { ...product, quantity: item.quantity } : null;
            }).filter(Boolean) as CartItem[];
            if (restoredCart.length > 0) setCart(restoredCart);
          }
        } catch (e) { console.error('Error restoring cart', e); }
      }
    };

    if (user) {
      restoreCart();
    }
  }, [user]);

  // Sincronizar carrito con LocalStorage y el Servidor
  useEffect(() => {
    localStorage.setItem('escapesymas_cart', JSON.stringify(cart));

    if (user && user.id && user.id > 0 && cart.length > 0) {
      const cartData = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
      saveUserCart(user.id, cartData);
    }
  }, [cart, user]);

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
