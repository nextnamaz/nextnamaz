import type { SlideItem } from '@/types/database';

// A Google Slides deck published to the web ("File → Share → Publish to web")
// is addressed by an id like 2PACX-1v… . The settings store one item for the
// deck; the TV expands it into one item per slide, so each slide takes its
// turn in the slideshow exactly like an uploaded photo, and slides added or
// removed in Google show up without touching the settings.

const PUBLISHED_ID = /docs\.google\.com\/presentation\/d\/e\/(2PACX-[A-Za-z0-9_-]{20,200})/;
const SLIDE_ID = /^[A-Za-z0-9_.-]{1,100}$/;

/** Prefix of the stored path for a Google Slides deck item. */
export const DECK_PREFIX = 'gslides:';

/** The published id in a "Publish to web" link or its <iframe> embed code, or null. */
export function publishedDeckId(input: string): string | null {
  return PUBLISHED_ID.exec(input)?.[1] ?? null;
}

export function deckItem(deckId: string): SlideItem {
  return {
    path: `${DECK_PREFIX}${deckId}`,
    url: `https://docs.google.com/presentation/d/e/${deckId}/pub`,
    kind: 'google-slides',
  };
}

/** The deck id a stored item points at, or null when the item is not a valid deck. */
export function deckIdOf(item: SlideItem): string | null {
  if (item.kind !== 'google-slides' || !item.path.startsWith(DECK_PREFIX)) return null;
  const id = item.path.slice(DECK_PREFIX.length);
  return publishedDeckId(`docs.google.com/presentation/d/e/${id}`) === id ? id : null;
}

/** Google's player showing one slide, standing still. */
export function slideEmbedUrl(deckId: string, slideId: string): string {
  return `https://docs.google.com/presentation/d/e/${deckId}/pubembed?start=false&loop=false&rm=minimal&slide=id.${slideId}`;
}

/**
 * The slide ids, in order, from the published page. Its `docData` holds the
 * page size and then one entry per slide, each opening with the slide id.
 */
export function parseSlideIds(html: string): string[] {
  const start = html.indexOf('docData:');
  if (start < 0) return [];
  const ids = [...html.slice(start).matchAll(/\["([A-Za-z0-9_.-]+)",\d+,"/g)]
    .map((m) => m[1] ?? '')
    .filter((id) => SLIDE_ID.test(id));
  return [...new Set(ids)];
}

/** Fetch a published deck's slide ids. Throws when the deck is not reachable. */
export async function fetchSlideIds(deckId: string): Promise<string[]> {
  const res = await fetch(deckItem(deckId).url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Google Slides answered ${res.status}`);
  return parseSlideIds(await res.text());
}

/**
 * Replace each deck item with one item per slide. A deck that can't be read
 * right now is left out, so the TV shows the other media and the times
 * rather than a broken frame.
 */
export async function expandDecks(items: SlideItem[]): Promise<SlideItem[]> {
  const expanded = await Promise.all(
    items.map(async (item): Promise<SlideItem[]> => {
      if (item.kind !== 'google-slides') return [item];
      const deckId = deckIdOf(item);
      if (!deckId) return [];
      try {
        const slideIds = await fetchSlideIds(deckId);
        return slideIds.map((slideId) => ({
          path: `${item.path}#${slideId}`,
          url: slideEmbedUrl(deckId, slideId),
          kind: 'google-slides',
        }));
      } catch {
        return [];
      }
    })
  );
  return expanded.flat();
}
