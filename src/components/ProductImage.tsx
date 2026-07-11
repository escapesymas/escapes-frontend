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

export default function ProductImage({
  src, alt, className = '', wrapperClassName = '', priority,
  srcDesktop, srcMobile, srcCardDesktop, srcCardMobile,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${wrapperClassName || 'w-full h-full'}`}>
        <div className="w-16 h-16 rounded bg-icon-box flex items-center justify-center border border-card-border">
          <Package className="w-8 h-8 text-text-muted" />
        </div>
        <span className="text-[9px] font-mono uppercase text-text-muted">Imagen no disponible</span>
      </div>
    );
  }

  if (srcCardMobile || srcCardDesktop || srcDesktop || srcMobile) {
    return (
      <div className={wrapperClassName}>
        <picture>
          {srcCardMobile && <source media="(max-width: 767px)" srcSet={srcCardMobile} />}
          {srcCardDesktop && <source media="(min-width: 768px)" srcSet={srcCardDesktop} />}
          {srcMobile && <source media="(max-width: 767px)" srcSet={srcMobile} />}
          {srcDesktop && <source media="(min-width: 768px)" srcSet={srcDesktop} />}
          <img
            src={src}
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
        src={src}
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
