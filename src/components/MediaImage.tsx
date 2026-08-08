'use client';

import { PhotoMediaType } from '@/types';

interface MediaImageProps {
  src: string;
  type?: PhotoMediaType;
  alt?: string;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync';
}

// Renders either an <img> (photo) or a <video> (video) element depending on
// the stored media type. Videos use the thumb/original URLs directly.
export default function MediaImage({
  src,
  type,
  alt = '',
  className,
  controls = false,
  muted = false,
  autoPlay = false,
  loop = false,
  preload = 'metadata',
  width,
  height,
  loading,
  decoding,
}: MediaImageProps) {
  if (type === 'video') {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        preload={preload}
        playsInline
        width={width}
        height={height}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
    />
  );
}
