'use client';

import dynamic from 'next/dynamic';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';
import { AmbientVideo } from './ambient-video';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';

const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** The scene's width for the tile's size: 16:9, covering the tile like a photograph. */
const SCENE_W = 'max(100cqw, 177.778cqh)';
/** Across the scene, the point kept in view when the tile is narrower than it: the wall beside the mihrab. */
const FOCUS_X = 0.45;
/** Where the set hangs on that wall, as shares of the scene. */
const SET = { left: '43%', top: '31%', width: '13%' };

/**
 * A prayer hall in morning light: the mihrab, a brass lantern, sun through the
 * lattice drifting over the wall and the carpet's rows (ElevenLabs, Seedream
 * still, Kling clip). On the plain wall beside the mihrab hangs a set on its
 * side, running the real display in the page's language.
 *
 * The scene covers its tile like a photograph, and the set is placed in the
 * same box so the two stay together at any size.
 */
export function FeaturesHall({ label, display }: { label: string; display: SupportedLocale }) {
  return (
    <div role="img" aria-label={label} dir="ltr" className="absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
      <div
        className="absolute top-1/2 aspect-video -translate-y-1/2"
        style={{
          width: SCENE_W,
          left: `clamp(calc(100cqw - ${SCENE_W}), calc(50cqw - ${FOCUS_X} * ${SCENE_W}), 0px)`,
        }}
      >
        <AmbientVideo
          src="/landing/prayer-hall.mp4"
          poster="/landing/prayer-hall.jpg"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute" style={SET}>
          <TvFrame portrait>
            <DemoDisplay locale={resolveDisplayLocale(display)} portrait />
          </TvFrame>
        </div>
      </div>
    </div>
  );
}
