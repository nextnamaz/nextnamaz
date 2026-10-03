'use client';

import { useCallback } from 'react';
import type { CSSProperties } from 'react';

interface AmbientVideoProps {
  src: string;
  /** The first frame as a still: shown until the video plays, and instead of it under reduced motion. */
  poster: string;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Hands the element over once it is mounted, for a caller that drives playback itself. */
  onVideo?: (video: HTMLVideoElement | null) => void;
  onEnded?: () => void;
  /** Called instead of playing when the clip comes into view under reduced motion. */
  onStill?: () => void;
}

/**
 * A silent background clip that plays only while it is on screen, and not at
 * all under reduced motion, where the poster stands in for it. Never
 * decorative content the reader needs: the caller labels the scene.
 */
export function AmbientVideo({ src, poster, loop = true, className, style, onVideo, onEnded, onStill }: AmbientVideoProps) {
  const watch = useCallback(
    (video: HTMLVideoElement | null) => {
      onVideo?.(video);
      if (!video) return;
      const io = new IntersectionObserver(([entry]) => {
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (entry?.isIntersecting && still) onStill?.();
        if (entry?.isIntersecting && !still && !video.ended) void video.play().catch(() => {});
        else video.pause();
      });
      io.observe(video);
      return () => {
        io.disconnect();
        onVideo?.(null);
      };
    },
    [onVideo, onStill]
  );

  return (
    <video
      ref={watch}
      src={src}
      poster={poster}
      muted
      playsInline
      loop={loop}
      preload="metadata"
      aria-hidden
      onEnded={onEnded}
      className={className}
      style={style}
    />
  );
}
