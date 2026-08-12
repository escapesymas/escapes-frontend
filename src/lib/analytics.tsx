'use client';

import { Product } from '../types';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

function pushEvent(event: string, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export const trackEvent = {
  viewItemList: (items: { id: number; name: string; price: number }[], listName: string) => {
    pushEvent('view_item_list', {
      item_list_name: listName,
      items: items.map((it, i) => ({ item_id: String(it.id), item_name: it.name, price: it.price, index: i })),
    });
  },

  viewItem: (product: Product) => {
    pushEvent('view_item', {
      currency: 'EUR',
      value: (product.salePrice || product.price),
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: (product.salePrice || product.price),
        item_variant: product.sku,
      }],
    });
  },

  addToCart: (product: Product, quantity: number) => {
    pushEvent('add_to_cart', {
      currency: 'EUR',
      value: (product.salePrice || product.price) * quantity,
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_brand: product.brand,
        price: (product.salePrice || product.price),
        quantity,
      }],
    });
  },

  removeFromCart: (product: Product, quantity: number) => {
    pushEvent('remove_from_cart', {
      currency: 'EUR',
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        price: (product.salePrice || product.price),
        quantity,
      }],
    });
  },

  beginCheckout: (items: { product: Product; quantity: number }[], value: number) => {
    const eventId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('begin_checkout_event_id', eventId);
      } catch {}
    }
    pushEvent('begin_checkout', {
      event_id: eventId,
      currency: 'EUR',
      value,
      items: items.map((it) => ({
        item_id: String(it.product.id),
        item_name: it.product.name,
        price: (it.product.salePrice ?? it.product.price),
        quantity: it.quantity,
      })),
    });
  },

  getBeginCheckoutEventId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      return sessionStorage.getItem('begin_checkout_event_id') || undefined;
    } catch {
      return undefined;
    }
  },

  clearBeginCheckoutEventId(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('begin_checkout_event_id');
    } catch {}
  },

  purchase: (orderId: string, items: { product: Product; quantity: number }[], value: number) => {
    const eventId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
    pushEvent('purchase', {
      event_id: eventId,
      transaction_id: orderId,
      currency: 'EUR',
      value,
      items: items.map((it) => ({
        item_id: String(it.product.id),
        item_name: it.product.name,
        price: (it.product.salePrice || it.product.price),
        quantity: it.quantity,
      })),
    });
  },

  chatInteraction: (intent: 'open' | 'message' | 'product_click' | 'add_to_cart_from_chat') => {
    pushEvent('chat_interaction', { intent });
  },

  bikeSelected: (bike: string) => {
    pushEvent('bike_selected', { bike });
  },
};

export function trackPageView(path: string, title?: string) {
  pushEvent('page_view', { page_path: path, page_title: title || document?.title });
}

export function GtmScript() {
  if (!GTM_ID) return null;
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
}

export function GtmNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
