import Image from 'next/image';
import { Reveal } from './reveal';

/**
 * Photographs of mosques that break up the page between sections (ElevenLabs,
 * Seedream). Decoration only, so they carry no words to translate and are
 * hidden from screen readers.
 */

interface Photo {
  src: string;
  /** Where the crop holds, as an object-position, when the tile is narrower than the picture. */
  focus?: string;
}

/** Two side by side: the wide one leads and the second sits lower. Phones stack them. */
export function PhotoPair({ wide, tall }: { wide: Photo; tall: Photo }) {
  return (
    <section aria-hidden className="px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-5">
        <Reveal className="relative aspect-16/10 overflow-hidden rounded-3xl sm:col-span-7">
          <Image src={wide.src} alt="" fill sizes="(min-width: 640px) 58vw, 100vw" className="object-cover" style={{ objectPosition: wide.focus }} />
        </Reveal>
        <Reveal delay={120} className="relative aspect-16/10 overflow-hidden rounded-3xl sm:col-span-5 sm:mt-16 sm:aspect-4/5">
          <Image src={tall.src} alt="" fill sizes="(min-width: 640px) 42vw, 100vw" className="object-cover" style={{ objectPosition: tall.focus }} />
        </Reveal>
      </div>
    </section>
  );
}

/** The mosaic's tiles in reading order: two wide on top, three beneath. Phones show the first three. */
const MOSAIC: readonly (Photo & { className: string; sizes: string })[] = [
  { src: '/landing/mosque-hillside.jpg', className: 'sm:col-span-7 sm:h-[22rem] lg:h-[26rem]', sizes: '(min-width: 640px) 58vw, 100vw' },
  { src: '/landing/mosque-snow.jpg', className: 'sm:col-span-5 sm:h-[22rem] lg:h-[26rem]', sizes: '(min-width: 640px) 42vw, 100vw' },
  { src: '/landing/mosque-courtyard.jpg', className: 'sm:col-span-4 sm:h-[15rem] lg:h-[18rem]', sizes: '(min-width: 640px) 33vw, 100vw' },
  { src: '/landing/mosque-interior.jpg', className: 'hidden sm:col-span-4 sm:block sm:h-[15rem] lg:h-[18rem]', sizes: '33vw' },
  { src: '/landing/mosque-modern.jpg', className: 'hidden sm:col-span-4 sm:block sm:h-[15rem] lg:h-[18rem]', sizes: '33vw', focus: '70% 50%' },
];

/** Mosques as they are: a hillside town at golden hour, snow at night, a courtyard, a dome from inside, a new one in a city. */
export function MosqueMosaic() {
  return (
    <section aria-hidden className="px-6 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-5">
        {MOSAIC.map(({ src, className, sizes, focus }, i) => (
          <Reveal key={src} delay={i * 80} className={`relative aspect-16/10 overflow-hidden rounded-3xl sm:aspect-auto ${className}`}>
            <Image src={src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: focus }} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
