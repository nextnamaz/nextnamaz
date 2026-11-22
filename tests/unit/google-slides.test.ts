import { afterEach, describe, expect, it, vi } from 'vitest';
import { deckIdOf, deckItem, expandDecks, parseSlideIds, publishedDeckId } from '@/lib/google-slides';
import type { SlideItem } from '@/types/database';

const DECK = '2PACX-1vRCVjAWGnmJNdw7vc0BYClr6SdOufhrPsDa_oy332tY0j8hQ5m3w0YPD1vV1-0aYhuBcF6Dzq7DvrVB';

// The shape of a published deck page: page size, then one entry per slide.
const PAGE = `<script>var x = {title: 'Bildspel', docData: [[487680,274320],[["p16",0,"",[],[]],["p17",0,"",[]],["g2f3_0",1,"",[]]]]};</script>`;

describe('publishedDeckId', () => {
  it('reads the id from a Publish to web link', () => {
    expect(publishedDeckId(`https://docs.google.com/presentation/d/e/${DECK}/pub?start=false`)).toBe(DECK);
  });

  it('reads the id from the old embed code', () => {
    const iframe = `<iframe src="https://docs.google.com/presentation/d/e/${DECK}/pubembed?start=true&loop=false&delayms=10000" frameborder="0" width="1920" height="1109"></iframe>`;
    expect(publishedDeckId(iframe)).toBe(DECK);
  });

  it('refuses an editing link, which only works for the signed-in owner', () => {
    expect(publishedDeckId('https://docs.google.com/presentation/d/1AbCdEfGh/edit')).toBeNull();
    expect(publishedDeckId('https://example.com/presentation/d/e/2PACX-x')).toBeNull();
  });
});

describe('deck items', () => {
  it('round-trips the deck id and rejects a crafted path', () => {
    expect(deckIdOf(deckItem(DECK))).toBe(DECK);
    const crafted: SlideItem = { path: 'gslides:../../other', url: 'https://x.test', kind: 'google-slides' };
    expect(deckIdOf(crafted)).toBeNull();
  });
});

describe('parseSlideIds', () => {
  it('lists the slides in order', () => {
    expect(parseSlideIds(PAGE)).toEqual(['p16', 'p17', 'g2f3_0']);
  });

  it('finds nothing in a page without slides', () => {
    expect(parseSlideIds('<html>Not found</html>')).toEqual([]);
  });
});

describe('expandDecks', () => {
  afterEach(() => vi.unstubAllGlobals());

  const photo: SlideItem = { path: 'abc/1.jpg', url: 'https://cdn.test/1.jpg', kind: 'image' };

  it('turns a deck into one item per slide, between the other media', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(PAGE)));
    const items = await expandDecks([photo, deckItem(DECK)]);
    expect(items.map((i) => i.kind)).toEqual(['image', 'google-slides', 'google-slides', 'google-slides']);
    expect(items[1]?.url).toContain(`/d/e/${DECK}/pubembed?`);
    expect(items[1]?.url).toContain('slide=id.p16');
    expect(new Set(items.map((i) => i.path)).size).toBe(4);
  });

  it('leaves out a deck Google will not serve, keeping the photos', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('gone', { status: 404 })));
    expect(await expandDecks([photo, deckItem(DECK)])).toEqual([photo]);
  });
});
