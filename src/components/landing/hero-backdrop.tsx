import Image from 'next/image';

/**
 * A photograph, nearly gone, behind the hero.
 *
 * Two geometric backdrops sat behind the type like scratches. A photograph
 * at eleven percent, softened, reads as warmth rather than as a thing to look
 * at. It is
 * the prayer hall from the closing section, so the page ends where it
 * began, and it is masked toward the right so the copy sits on plain paper.
 * Decorative, and hidden from assistive technology.
 */
const MASK =
  'radial-gradient(ellipse 78% 90% at 68% 45%, #000 0%, rgba(0,0,0,0.6) 45%, transparent 76%)';

export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      {/* Sheikh Zayed Grand Mosque. Unsplash (vlxgphzJomk), same file as the CTA. */}
      <Image src="/landing/hero-wash.jpg" alt="" fill sizes="100vw" className="scale-105 object-cover opacity-[0.11] blur-[3px]" />
    </div>
  );
}
