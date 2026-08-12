'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hover-triggered prefetch for the App Router.
 *
 * Next.js 16 prefetches `<Link>` targets as soon as they enter the viewport,
 * which is fine in most cases but wasteful on long catalog pages (every card
 * the user scrolls past burns a prefetch). This hook delays the prefetch
 * until the user actually shows intent by hovering the element.
 *
 * Usage:
 * ```tsx
 * const prefetchProps = useHoverPrefetch('/producto/abc');
 * <a href="/producto/abc" {...prefetchProps}>…</a>
 * ```
 *
 * Returns the props (onMouseEnter / onMouseLeave / onFocus / onTouchStart)
 * that should be spread onto the link element so the prefetch fires on
 * hover (and on keyboard focus / touch as a fallback for accessibility).
 *
 * @param href  Absolute or relative path to prefetch.
 * @param delay Optional debounce in ms before firing the prefetch on hover.
 *              Default 0 — fire immediately. Bump to e.g. 80ms to skip
 *              accidental hovers from scrolling past cards.
 */
export function useHoverPrefetch(href: string, delay: number = 0) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPrefetch = useCallback(() => {
    clearTimer();
    if (delay <= 0) {
      router.prefetch(href);
      return;
    }
    timerRef.current = setTimeout(() => {
      router.prefetch(href);
      timerRef.current = null;
    }, delay);
  }, [router, href, delay, clearTimer]);

  const cancelPrefetch = useCallback(() => {
    clearTimer();
    // router.prefetch has no public cancel API in Next 16, so the best we
    // can do is drop the pending timer. In-flight requests still complete
    // but their result is harmless (the Next client cache handles dedupe).
  }, [clearTimer]);

  // Make sure we don't leak a timer if the component unmounts mid-hover.
  useEffect(() => clearTimer, [clearTimer]);

  return {
    onMouseEnter: startPrefetch,
    onMouseLeave: cancelPrefetch,
    onFocus: startPrefetch,
    onBlur: cancelPrefetch,
    onTouchStart: startPrefetch,
  };
}
