'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  srcDesktop?: string;
  srcMobile?: string;
  srcCardDesktop?: string;
  srcCardMobile?: string;
}

function normalizeImgSrc(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.escapesymas.com').replace(/\/$/, '');
    return `${baseUrl}${url}`;
  }
  return url;
}

export default function ProductImage({
  src, alt, className = '', wrapperClassName = '', priority,
  srcDesktop, srcMobile, srcCardDesktop, srcCardMobile,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  const mainSrc = normalizeImgSrc(src);
  const cardMobile = normalizeImgSrc(srcCardMobile);
  const cardDesktop = normalizeImgSrc(srcCardDesktop);
  const mobile = normalizeImgSrc(srcMobile);
  const desktop = normalizeImgSrc(srcDesktop);

  if (!mainSrc || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${wrapperClassName || 'w-full h-full'}`}>
        <div className="w-16 h-16 rounded bg-icon-box flex items-center justify-center border border-card-border">
          <Package className="w-8 h-8 text-text-muted" />
        </div>
        <span className="text-[9px] font-mono uppercase text-text-muted">Imagen no disponible</span>
      </div>
    );
  }

  if (cardMobile || cardDesktop || desktop || mobile) {
    return (
      <div className={wrapperClassName}>
        <picture>
          {cardMobile && <source media="(max-width: 767px)" srcSet={cardMobile} />}
          {cardDesktop && <source media="(min-width: 768px)" srcSet={cardDesktop} />}
          {mobile && <source media="(max-width: 767px)" srcSet={mobile} />}
          {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
          <img
            src={mainSrc}
            alt={alt}
            fetchPriority={priority ? 'high' : undefined}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width={200}
            height={200}
            className={className}
            onError={() => setFailed(true)}
          />
        </picture>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <img
        src={mainSrc}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        width={200}
        height={200}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
