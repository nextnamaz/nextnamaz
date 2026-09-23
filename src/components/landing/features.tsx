import type { ReactNode } from 'react';
import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';
import { FeaturesHall } from './features-hall';
import { MotionStage } from './motion-stage';
import { AnnouncementArt, DarkScreenArt, RemoteArt, SourcePickerArt } from './features-art';

type Item = LandingCopy['features']['items'][number];

/**
 * A feature by its id. The ids are literal types, so if the copy drops one
 * this stops compiling instead of hanging a drawing over the wrong text; the
 * words and the order can change in any language.
 */
function item(items: readonly Item[], id: Item['id']): Item {
  const found = items.find((i) => i.id === id);
  if (!found) throw new Error(`No feature ${id}`);
  return found;
}

/** The four features drawn as tiles; the rest are listed under them. */
const DRAWN: Item['id'][] = ['sources', 'phone', 'dark', 'announcements'];

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
 * heading comes first so it is on screen before the drawing is. The stage is
 * a MotionStage: each drawing plays its idea once it is in view.
 */
function Tile({ item, art, stageClassName, className, delay }: TileProps) {
  return (
    <Reveal delay={delay} className={cn('flex', className)}>
      <article className="flex w-full flex-col md:rounded-3xl md:border md:border-border md:bg-card md:p-2">
        <MotionStage
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-3xl bg-[linear-gradient(165deg,#F6F4F0_0%,#EDEAE4_100%)] md:rounded-[1.1rem]',
            stageClassName
          )}
        >
          {art}
        </MotionStage>
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
interface FeaturesProps {
  t: LandingCopy['features'];
  /** The language the drawn TVs speak: the page's own. */
  display: SupportedLocale;
}

export function Features({ t, display }: FeaturesProps) {
  const source = item(t.items, 'sources');
  const phone = item(t.items, 'phone');
  const dark = item(t.items, 'dark');
  const announcements = item(t.items, 'announcements');
  const listed = t.items.filter((i) => !DRAWN.includes(i.id));

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
          <Reveal className="relative min-h-[26rem] overflow-hidden rounded-3xl border border-border bg-[#EDEAE4] sm:min-h-[34rem] md:col-start-1 md:row-start-3 md:min-h-0 lg:col-span-5 lg:row-start-1">
            <FeaturesHall label={t.imageAlt} display={display} />
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
            art={<RemoteArt rooms={t.rooms} display={display} />}
            stageClassName="px-5 py-7 sm:px-8 sm:py-11"
            className="md:col-span-2 md:row-start-2 lg:col-span-12 lg:row-start-2"
          />

          <Tile
            item={dark}
            art={<DarkScreenArt className="max-w-[21rem]" display={display} />}
            stageClassName="px-5 py-12 sm:px-10 sm:py-14 lg:h-[23rem] lg:py-0"
            className="md:col-start-2 md:row-start-3 lg:col-span-5 lg:col-start-1 lg:row-start-3"
          />

          <Tile
            item={announcements}
            art={<AnnouncementArt className="max-w-[27rem]" poster={t.poster} display={display} />}
            stageClassName="px-5 py-12 sm:px-10 sm:py-14 lg:h-[23rem] lg:py-0"
            className="md:col-span-2 md:row-start-4 lg:col-span-7 lg:col-start-6 lg:row-start-3"
            delay={80}
          />
        </div>

        <Reveal className="mt-16 sm:mt-20">
          <ul className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-5">
            {listed.map((entry) => (
              <li key={entry.id} className="border-t border-border pt-6 pb-9 lg:odd:col-span-5 lg:odd:pe-8 lg:even:col-span-7">
                <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.01em] text-foreground">{entry.title}</h3>
                <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-pretty text-muted-foreground">{entry.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
