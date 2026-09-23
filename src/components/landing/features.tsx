import Image from 'next/image';
import type { ReactNode } from 'react';
import { LANDING_COPY } from '@/lib/landing-copy';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';
import { AnnouncementArt, DarkScreenArt, RemoteArt, SourcePickerArt } from './features-art';

const t = LANDING_COPY.features;

type Item = (typeof t.items)[number];

/**
 * A feature by its title. The titles are literal types, so if the copy
 * renames one this stops compiling instead of hanging a drawing over the
 * wrong text; reordering the copy changes nothing.
 */
function item(title: Item['title']): Item {
  const found = t.items.find((i) => i.title === title);
  if (!found) throw new Error(`No feature titled ${title}`);
  return found;
}

const source = item('Times from the source you use');
const phone = item('Change it from your phone');
const dark = item('A dark screen for prayer');
const announcements = item('Announcements between times');
const drawn: Item[] = [source, phone, dark, announcements];
const listed = t.items.filter((i) => !drawn.includes(i));

interface TileProps {
  item: Item;
  art: ReactNode;
  /** Height and padding of the plaster stage the drawing hangs on. */
  stageClassName?: string;
  className?: string;
  delay?: number;
}

/**
 * One bento tile: the drawing on a plaster stage, then its heading and text,
 * in a white frame. Below `md` the frame goes, the stage is the tile, and the
 * heading comes first so it is on screen before the drawing is.
 */
function Tile({ item, art, stageClassName, className, delay }: TileProps) {
  return (
    <Reveal delay={delay} className={cn('flex', className)}>
      <article className="flex w-full flex-col md:rounded-3xl md:border md:border-border md:bg-card md:p-2">
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-3xl bg-[#EEE7DB] bg-linear-to-b from-[#EEE7DB] to-[#E6DDCD] md:rounded-[1.1rem]',
            stageClassName
          )}
        >
          {art}
        </div>
        <div className="order-first pb-6 md:order-none md:px-6 md:pt-6 md:pb-7">
          <h3 className="font-heading text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-balance text-foreground">{item.title}</h3>
          <p className="mt-2.5 max-w-[56ch] text-[15px] leading-relaxed text-pretty text-muted-foreground">{item.body}</p>
        </div>
      </article>
    </Reveal>
  );
}

/**
 * What a mosque gets beyond the times: an editorial bento of the real screens
 * behind four features, a photograph of a prayer hall, then the rest as a
 * plain two-column list.
 *
 * Desktop runs on one 12-column grid split 5 and 7: the header, the photo
 * beside the source picker, the dark screen beside the poster, and the list.
 * The phone tile takes a full row between them, so its TVs are drawn large
 * enough to read. Tablet: wide tiles span both columns and the photo pairs
 * with the dark screen. Phone: one column, the tiles unframed.
 */
export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
          <h2
            id="features-title"
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem] lg:col-span-5"
          >
            {t.title}
          </h2>
          <p className="max-w-[34ch] text-[16px] leading-relaxed text-pretty text-muted-foreground sm:text-[17px] lg:col-span-6 lg:col-start-6 lg:pb-1">
            {t.subtitle}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-12 sm:mt-14 md:grid-cols-2 md:gap-4 lg:grid-cols-12 lg:gap-5">
          <Reveal className="relative min-h-[26rem] overflow-hidden rounded-3xl border border-border bg-[#E9DFCD] sm:min-h-[34rem] md:col-start-1 md:row-start-3 md:min-h-0 lg:col-span-5 lg:row-start-1">
            {/* Cover-cropped: on desktop the tile is taller than the photo's
                4:5, so the image renders wider than the tile, about 680px. */}
            {/* Cambridge Central Mosque. Unsplash, Rumman Amin (4NPXh6uGdaw), Unsplash License. */}
            <Image
              src="/landing/prayer-hall.jpg"
              alt={t.imageAlt}
              fill
              sizes="(min-width: 1024px) 700px, (min-width: 768px) 50vw, 100vw"
              className="object-cover object-[17%_50%]"
            />
          </Reveal>

          <Tile
            item={source}
            art={
              /* On phones only the chosen source shows whole and the list
                 fades out under it, so the drawing fits a screen. */
              <div className="flex h-full w-full items-start justify-center mask-b-from-85% sm:h-auto sm:mask-none">
                <SourcePickerArt />
              </div>
            }
            stageClassName="h-[34rem] items-start px-5 pt-6 sm:h-auto sm:items-center sm:px-10 sm:py-11"
            className="md:col-span-2 md:row-start-1 lg:col-span-7 lg:col-start-6 lg:row-start-1"
          />

          <Tile
            item={phone}
            art={<RemoteArt />}
            stageClassName="px-5 py-7 sm:px-8 sm:py-11"
            className="md:col-span-2 md:row-start-2 lg:col-span-12 lg:row-start-2"
          />

          <Tile
            item={dark}
            art={<DarkScreenArt className="max-w-[21rem]" />}
            stageClassName="px-5 py-12 sm:px-10 sm:py-14 lg:h-[23rem] lg:py-0"
            className="md:col-start-2 md:row-start-3 lg:col-span-5 lg:col-start-1 lg:row-start-3"
          />

          <Tile
            item={announcements}
            art={<AnnouncementArt className="max-w-[27rem]" />}
            stageClassName="px-5 py-12 sm:px-10 sm:py-14 lg:h-[23rem] lg:py-0"
            className="md:col-span-2 md:row-start-4 lg:col-span-7 lg:col-start-6 lg:row-start-3"
            delay={80}
          />
        </div>

        <Reveal className="mt-16 sm:mt-20">
          <ul className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-5">
            {listed.map((entry) => (
              <li key={entry.title} className="border-t border-border pt-6 pb-9 lg:odd:col-span-5 lg:odd:pr-8 lg:even:col-span-7">
                <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.01em] text-foreground">{entry.title}</h3>
                <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted-foreground">{entry.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
