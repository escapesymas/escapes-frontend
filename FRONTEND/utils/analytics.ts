import { Product } from '../types';

// Helper to safely access window.gtag
const gtag = (command: string, ...args: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag(command, ...args);
        // Dev log for verification
        if (import.meta.env.DEV) {
            console.debug(`[Analytics] ${command}`, args);
        }
    } else {
        if (import.meta.env.DEV) {
            console.warn(`[Analytics] gtag not found. Call ignored: ${command}`, args);
        }
    }
};

export const trackPageView = (path: string, title?: string) => {
    gtag('event', 'page_view', {
        page_path: path,
        page_title: title
    });
};

export const trackViewItem = (product: Product) => {
    gtag('event', 'view_item', {
        currency: 'EUR',
        value: product.price,
        items: [
            {
                item_id: product.id.toString(),
                item_name: product.title,
                price: product.price,
                item_brand: product.brand || 'Escapes y Más',
                item_category: product.category,
                quantity: 1
            }
        ]
    });
};

export const trackAddToCart = (product: Product, quantity: number = 1) => {
    gtag('event', 'add_to_cart', {
        currency: 'EUR',
        value: product.price * quantity,
        items: [
            {
                item_id: product.id.toString(),
                item_name: product.title,
                price: product.price,
                item_brand: product.brand || 'Escapes y Más',
                item_category: product.category,
                quantity: quantity
            }
        ]
    });
};

export const trackBeginCheckout = (total: number, items: any[]) => {
    gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: total,
        items: items.map(item => ({
            item_id: item.id.toString(),
            item_name: item.title,
            price: item.price,
            quantity: item.quantity
        }))
    });
};

export const trackPurchase = (transactionId: string, total: number, items: any[]) => {
    gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: total,
        currency: 'EUR',
        items: items.map(item => ({
            item_id: item.id.toString(),
            item_name: item.title,
            price: item.price,
            quantity: item.quantity
        }))
    });
};
