'use client';

import { useRef, useState } from 'react';
import { Package } from 'lucide-react';
import ProductImage from '../ProductImage';
import { ProductImage as ProductImageType } from '../../types';
import { getImageUrl } from '../../lib/constants';

interface Props {
  images: ProductImageType[];
  alt: string;
  badge?: React.ReactNode;
}

function srcOf(img: ProductImageType): string {
  return getImageUrl(img.src || img.srcCardDesktop || img.srcMobile || '');
}

/**
 * Galería de la ficha. En móvil se desliza con el dedo (scroll-snap) y muestra
 * puntos; en escritorio, miniaturas. Sin imágenes: un hueco pequeño en lugar
 * de ocupar media pantalla.
 */
export default function ProductGallery({ images, alt, badge }: Props) {
  const valid = images.filter((img) => srcOf(img));
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (valid.length === 0) {
    return (
      <div className="relative h-36 md:h-80 bg-image-wrapper border-b md:border md:rounded-md border-card-border flex flex-col items-center justify-center gap-2 text-text-muted">
        {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}
        <Package className="w-8 h-8" aria-hidden="true" />
        <span className="text-[10px] font-mono uppercase">Imagen no disponible</span>
      </div>
    );
  }

  const goTo = (i: number) => {
    setIdx(i);
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== idx) setIdx(i);
        }}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-image-wrapper md:rounded-md md:border border-card-border"
        aria-roledescription="carrusel"
      >
        {valid.map((img, i) => (
          <div key={i} className="snap-center shrink-0 w-full aspect-square max-h-[45vh] md:max-h-none flex items-center justify-center p-4">
            <ProductImage
              src={srcOf(img)}
              srcMobile={img.srcMobile}
              alt={img.alt || alt}
              priority={i === 0}
              className="w-full h-full object-contain"
              wrapperClassName="w-full h-full"
            />
          </div>
        ))}
      </div>

      {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}

      {valid.length > 1 && (
        <>
          <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist">
            {valid.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Imagen ${i + 1} de ${valid.length}`}
                aria-selected={i === idx}
                role="tab"
                className={`w-2 h-2 rounded-full ${i === idx ? 'bg-accent' : 'bg-foreground/25'}`}
              />
            ))}
          </div>
          <div className="hidden md:flex gap-2 mt-3">
            {valid.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`w-16 h-16 rounded border-2 overflow-hidden bg-image-wrapper cursor-pointer ${i === idx ? 'border-accent' : 'border-card-border'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={srcOf(img)} alt="" className="w-full h-full object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
