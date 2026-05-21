import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'escapes_cart_v1';
const API_BASE = 'https://backendescapes.com';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Initialize sessionToken and load cart on mount
    useEffect(() => {
        (async () => {
            try {
                // 1. Get or generate session token
                let token = await AsyncStorage.getItem('escapes_cart_session_token');
                if (!token) {
                    token = 'token_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
                    await AsyncStorage.setItem('escapes_cart_session_token', token);
                }
                setSessionToken(token);

                // 2. Check if logged in to get userId
                let uId: string | null = null;
                const sessionRaw = await AsyncStorage.getItem('escapesymas_mobile_session');
                if (sessionRaw) {
                    const session = JSON.parse(sessionRaw);
                    uId = session.id || session.userId || null;
                    setUserId(uId ? String(uId) : null);
                }

                // 3. Try to load from server
                try {
                    const res = await fetch(`${API_BASE}/api/cart?sessionToken=${token}${uId ? `&userId=${uId}` : ''}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.items && Array.isArray(data.items)) {
                            setItems(data.items);
                            return; // Success, bypass local storage fallback
                        }
                    }
                } catch (err) {
                    console.warn("Could not sync cart from server on mount, falling back to local storage", err);
                }

                // 4. Fallback: Load from local storage
                const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
                if (stored) {
                    setItems(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to initialize cart", e);
            }
        })();
    }, []);

    // Keep session / userId in sync in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const sessionRaw = await AsyncStorage.getItem('escapesymas_mobile_session');
                if (sessionRaw) {
                    const session = JSON.parse(sessionRaw);
                    const currentUserId = session.id || session.userId || null;
                    const strUserId = currentUserId ? String(currentUserId) : null;
                    if (strUserId !== userId) {
                        setUserId(strUserId);
                    }
                } else if (userId !== null) {
                    setUserId(null);
                }
            } catch (e) {
                console.error("Error checking session background status", e);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [userId]);

    // Save/Sync cart on change
    useEffect(() => {
        if (!sessionToken) return;

        (async () => {
            try {
                // 1. Save locally
                await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

                // 2. Refresh userId from session storage
                let currentUserId = userId;
                let userEmail = null;
                let userFirstName = null;
                let userLastName = null;
                let userUsername = null;
                const sessionRaw = await AsyncStorage.getItem('escapesymas_mobile_session');
                if (sessionRaw) {
                    const session = JSON.parse(sessionRaw);
                    const idVal = session.id || session.userId || null;
                    currentUserId = idVal ? String(idVal) : null;
                    userEmail = session.user_email || session.email || null;
                    userFirstName = session.first_name || session.firstName || null;
                    userLastName = session.last_name || session.lastName || null;
                    userUsername = session.user_nicename || session.username || null;
                    if (currentUserId !== userId) {
                        setUserId(currentUserId);
                    }
                }

                // 3. Sync to server
                await fetch(`${API_BASE}/api/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUserId,
                        sessionToken,
                        items,
                        userEmail,
                        userFirstName,
                        userLastName,
                        userUsername
                    })
                });
            } catch (e) {
                console.error("Failed to sync cart to server", e);
            }
        })();
    }, [items, sessionToken]);

    const addItem = (product: Product, quantity = 1) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id);
            if (existing) {
                return current.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...current, { ...product, quantity }];
        });
    };

    const removeItem = (productId: number) => {
        setItems(current => current.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(current => current.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
