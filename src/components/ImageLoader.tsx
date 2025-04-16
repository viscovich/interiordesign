import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner.tsx';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

export function ImageLoader({
  src,
  alt,
  className = '',
  fallbackSrc,
  onLoad,
  onError,
  onClick
}: ImageLoaderProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setStatus('loading');
    setCurrentSrc(src);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setStatus('loaded');
      onLoad?.();
    };

    img.onerror = () => {
      if (fallbackSrc && fallbackSrc !== src) {
        setCurrentSrc(fallbackSrc);
        const fallbackImg = new Image();
        fallbackImg.src = fallbackSrc;
        fallbackImg.onload = () => setStatus('loaded');
        fallbackImg.onerror = () => setStatus('error');
      } else {
        setStatus('error');
        onError?.();
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc, onLoad, onError]);

  if (status === 'loading') {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <Spinner size="md" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}>
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onClick={onClick}
    />
  );
}
