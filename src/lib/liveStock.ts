'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '../types';

/**
 * Stock de este momento de las tarjetas que el cliente tiene a la vista.
 *
 * Las listas (búsqueda, filtro por moto, marcas, páginas de modelo…) traen el stock de la última copia; el de Bihr y el de
 * Andreani se mueve a diario. Para que nadie entre a una ficha pensando que hay algo que ya no hay, cada tarjeta pide su
 * stock real cuando se ve: las peticiones de varias tarjetas se juntan en una sola (hasta 48 por lote) y el resultado se
 * recuerda unos minutos. Si el servidor no contesta, la tarjeta se queda como estaba.
 */

export interface LiveStock {
  stock: number;
  inStock: boolean;
  restockDate: string | null;
  restocking: boolean;
}

const TTL_MS = 5 * 60 * 1000;
/** Si no hay dato de un producto (otro proveedor, error), no se vuelve a preguntar enseguida. */
const MISS_TTL_MS = 60 * 1000;
const BATCH_MS = 80;
const BATCH_SIZE = 48;

const known = new Map<number, { at: number; value: LiveStock | null }>();
const waiting = new Map<number, Array<(v: LiveStock | null) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Lo ya sabido y no caducado (undefined = hay que preguntar). */
export function peekLiveStock(id: number): LiveStock | null | undefined {
  const hit = known.get(id);
  if (!hit) return undefined;
  return Date.now() - hit.at < (hit.value ? TTL_MS : MISS_TTL_MS) ? hit.value : undefined;
}

async function flush() {
  timer = null;
  const ids = [...waiting.keys()];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const resolvers = new Map(chunk.map((id) => [id, waiting.get(id) || []] as const));
    chunk.forEach((id) => waiting.delete(id));
    let live: Record<string, LiveStock> = {};
    try {
      const res = await fetch('/api/catalog/live-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chunk }),
      });
      if (res.ok) live = ((await res.json()) as { live?: Record<string, LiveStock> }).live || {};
    } catch {
      // Sin conexión o servidor caído: la tarjeta se queda con lo que traía.
    }
    for (const [id, list] of resolvers) {
      const value = live[String(id)] ?? null;
      known.set(id, { at: Date.now(), value });
      list.forEach((resolve) => resolve(value));
    }
  }
}

/** Pide el stock de un producto; las peticiones que llegan juntas viajan en un solo lote. */
export function getLiveStock(id: number): Promise<LiveStock | null> {
  const hit = peekLiveStock(id);
  if (hit !== undefined) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const list = waiting.get(id) || [];
    list.push(resolve);
    waiting.set(id, list);
    if (!timer) timer = setTimeout(flush, BATCH_MS);
  });
}

/** La tarjeta con el stock en vivo encima (una familia con variantes sigue «en stock» si alguna lo está). */
export function applyLiveStock<T extends Product>(product: T, live: LiveStock | null | undefined): T {
  if (!live) return product;
  const single = !product.family || (product.family.variantCount || 0) <= 1;
  return {
    ...product,
    stock: live.stock,
    inStock: live.inStock,
    restockDate: live.restockDate,
    restocking: live.restocking,
    ...(product.family
      ? { family: { ...product.family, inStock: single ? live.inStock : (product.family.inStock || live.inStock) } }
      : {}),
  };
}

/**
 * Para una tarjeta: devuelve el producto con su stock en vivo y la referencia que hay que poner en el elemento de la
 * tarjeta. El stock se pide cuando la tarjeta está (o está a punto de estar) a la vista, no antes.
 */
export function useLiveStock<T extends Product>(product: T): { product: T; ref: (el: Element | null) => void } {
  const id = product.id;
  const [live, setLive] = useState<LiveStock | null | undefined>(() => peekLiveStock(id));
  const asked = useRef<number | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // Si la lista cambia de producto en la misma tarjeta, se parte de lo que se sepa de él.
  useEffect(() => {
    asked.current = null;
    setLive(peekLiveStock(id));
  }, [id]);

  const ask = useCallback(() => {
    if (asked.current === id) return;
    asked.current = id;
    const hit = peekLiveStock(id);
    if (hit !== undefined) { setLive(hit); return; }
    getLiveStock(id).then((v) => { if (asked.current === id) setLive(v); });
  }, [id]);

  const ref = useCallback((el: Element | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { ask(); return; }
    observer.current = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { ask(); observer.current?.disconnect(); }
    }, { rootMargin: '300px' });
    observer.current.observe(el);
  }, [ask]);

  useEffect(() => () => observer.current?.disconnect(), []);

  return { product: applyLiveStock(product, live), ref };
}
