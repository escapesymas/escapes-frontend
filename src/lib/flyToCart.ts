/**
 * Efecto «vuela al carrito»: un punto amarillo sale del botón de añadir y viaja al icono del carrito de la cabecera.
 * Es decoración sobre el botón, que sigue haciendo lo de siempre: si algo falla (no hay icono, el navegador no admite
 * animaciones web, el cliente pide menos movimiento) no pasa nada. No toca el diseño: el punto es `position: fixed`.
 */
export function flyToCart(source: Element | null | undefined): void {
  try {
    if (typeof window === 'undefined' || !source) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = document.querySelector('[data-cart-target]');
    if (!target || typeof (target as HTMLElement).animate !== 'function') return;
    const a = source.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !a.height || !b.width || !b.height) return;

    const size = 18;
    const x0 = a.left + a.width / 2 - size / 2;
    const y0 = a.top + a.height / 2 - size / 2;
    const dx = b.left + b.width / 2 - size / 2 - x0;
    const dy = b.top + b.height / 2 - size / 2 - y0;

    const dot = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style, {
      position: 'fixed', left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px`, borderRadius: '9999px',
      background: 'var(--accent)', boxShadow: '0 0 14px 3px color-mix(in srgb, var(--accent) 65%, transparent)',
      zIndex: '2147483000', pointerEvents: 'none', willChange: 'transform, opacity',
    } as CSSStyleDeclaration);
    document.body.appendChild(dot);

    // Arco: sube un poco y cae sobre el carrito, encogiéndose.
    const anim = dot.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(0.85)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.25 },
      ],
      { duration: 680, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
    );
    const done = () => dot.remove();
    anim.onfinish = done;
    anim.oncancel = done;
    setTimeout(done, 1500); // por si el navegador no llega a disparar el final
  } catch {
    /* el efecto es opcional */
  }
}
