'use client';

import React, { useState } from 'react';
import { Wrench } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export default function ProductImage({ src, alt, className = '', wrapperClassName = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || src.includes('placehold.co') || failed) {
    return (
      <div className={`flex items-center justify-center ${wrapperClassName || 'w-full h-full'}`}>
        <div className="w-12 h-12 rounded bg-icon-box flex items-center justify-center border border-card-border">
          <Wrench className="w-6 h-6 text-accent-text" />
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
