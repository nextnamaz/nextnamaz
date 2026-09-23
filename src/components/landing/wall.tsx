import Image from 'next/image';

/**
 * The wall the hero's television hangs on: lime plaster in soft side light.
 * Cropped from the plain half of the photograph, so nothing in it competes
 * with the headline or the set, and mirrored so the light comes from the
 * left, so the headline sits in the brightest plaster. The set's shadow
 * falls straight down.
 * Decorative, and hidden from assistive technology.
 *
 * Unsplash, mk. s (kJL4SiTBXqg), Unsplash License.
 */
export function Wall() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#E9E1D1]">
      <Image
        src="/landing/hero-wall.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[30%_50%]"
      />
      {/* A touch more light where the headline sits; the photograph's darker right edge lifted
          so the set hangs on even plaster; a faint fall-off toward the floor. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_18%_45%,rgba(255,252,245,0.45),transparent_70%),linear-gradient(to_left,rgba(250,246,236,0.78),rgba(250,246,236,0.6)_20%,rgba(250,246,236,0.5)_40%,transparent_62%),linear-gradient(to_bottom,transparent_60%,rgba(90,66,38,0.08))]" />
    </div>
  );
}
