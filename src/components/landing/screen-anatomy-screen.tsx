'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { DemoDisplay } from './demo-display';
import { AnatomyBadge } from './screen-anatomy-badge';
import type { DisplayLocale } from '@/lib/display-locale';
import { cn } from '@/lib/utils';

/** A rectangle on the screen, in percent of its width and height. */
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A numbered part: its marker's centre, the area it lights, and what a phone zooms to. */
interface Part {
  x: number;
  y: number;
  box: Box;
  focus: Box;
  /** Caps the zoom, for a part too thin to fill the frame without losing the screen around it. */
  zoomMax?: number;
}

interface Layout {
  /** In legend order. Null when the theme has no such element to point at. */
  parts: (Part | null)[];
  /** Marker diameter in px. */
  size: number;
  /** Marker radius, in percent of the screen's height. */
  radiusY: number;
  /** Identifies the geometry, so an unchanged measure does not re-render. */
  key: string;
}

/** How the screen is framed: scale, then an offset in percent of its size. */
interface View {
  s: number;
  tx: number;
  ty: number;
}

const WHOLE: View = { s: 1, tx: 0, ty: 0 };
const ZOOM_MAX = 2.6;
/** The footer is a thin strip: zoomed to fit, the frame is mostly a crop of bare times. */
const FOOTER_ZOOM_MAX = 1.4;

/** Everything outside the part dims, and the part gets a gold edge. */
const SPOTLIGHT = '0 0 0 100cqmax rgba(18,12,6,0.36), inset 0 0 0 max(1px, 0.3cqw) #E8A817';

/**
 * Reads where the parts are from the theme's own DOM rather than from fixed
 * numbers, so the markers stay clear of the text whatever font the visitor's
 * system has, whatever the language, and on whichever side a right-to-left
 * screen puts things. Markers sit on the edges of their part, not beside
 * centred text; the footer's sits just ahead of its line, measured.
 */
function measure(root: HTMLElement): Layout | null {
  const R = root.getBoundingClientRect();
  const W = root.offsetWidth;
  const H = root.offsetHeight;
  if (!W || !H || !R.width || !R.height) return null;

  // Relative to the root, so a zoom or an entrance transform cancels out.
  const rel = (r: DOMRect): Box => ({
    left: ((r.left - R.left) / R.width) * 100,
    top: ((r.top - R.top) / R.height) * 100,
    width: (r.width / R.width) * 100,
    height: (r.height / R.height) * 100,
  });
  const find = (selector: string): Box | null => {
    const el = root.querySelector(selector);
    return el ? rel(el.getBoundingClientRect()) : null;
  };

  const header = find('.default-header');
  const body = find('.default-body');
  const head = find('.default-table > section');
  const next = find('.default-next');
  const footerEl = root.querySelector('.default-footer');
  const litEl = root.querySelector('.default-pulse')?.closest('.default-row');
  if (!header || !body || !head || !next || !footerEl) return null;
  const footer = rel(footerEl.getBoundingClientRect());
  const lit = litEl ? rel(litEl.getBoundingClientRect()) : null;
  const range = document.createRange();
  range.selectNodeContents(footerEl);
  const line = rel(range.getBoundingClientRect());

  // DemoDisplay mirrors the theme for Arabic and Urdu, as the real TV does.
  const theme = root.querySelector('.default-theme');
  const rtl = theme ? getComputedStyle(theme).direction === 'rtl' : false;
  const size = Math.min(30, Math.max(12, W * 0.033));
  // A marker's centre sits its radius plus a third of itself in from an edge.
  const inX = ((size * 0.85) / W) * 100;
  const inY = ((size * 0.85) / H) * 100;
  const start = (b: Box) => (rtl ? b.left + b.width - inX : b.left + inX);
  const end = (b: Box) => (rtl ? b.left + inX : b.left + b.width - inX);
  const middle = (b: Box) => b.top + b.height / 2;

  const lineX = rtl ? line.left + line.width + inX : line.left - inX;
  const lineFocus: Box = {
    left: Math.min(line.left, lineX) - inX,
    top: footer.top,
    width: line.width + inX * 3,
    height: footer.height,
  };

  const parts: (Part | null)[] = [
    { x: start(header), y: middle(header), box: header, focus: header },
    { x: end(head), y: middle(head), box: body, focus: body },
    lit ? { x: end(lit), y: middle(lit), box: lit, focus: lit } : null,
    { x: end(next), y: next.top + inY, box: next, focus: next },
    { x: lineX, y: middle(footer), box: footer, focus: lineFocus, zoomMax: FOOTER_ZOOM_MAX },
  ];

  const round = (v: number) => Math.round(v * 20) / 20;
  const key = JSON.stringify([size, parts], (_, v: unknown) => (typeof v === 'number' ? round(v) : v));
  return { parts, size, radiusY: ((size / 2 + 1) / H) * 100, key };
}

/**
 * Measures on resize, on a new language, and whenever the theme's elements or
 * classes change (a new lit row, a direction). Not on text: the clock ticks
 * every second without moving a part.
 */
function useLayout(ref: RefObject<HTMLDivElement | null>, locale: DisplayLocale): Layout | null {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure(root);
        setLayout((prev) => (prev?.key === next?.key ? prev : next));
      });
    };
    const resize = new ResizeObserver(update);
    resize.observe(root);
    const mutation = new MutationObserver(update);
    mutation.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'dir'],
    });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [ref, locale]);

  return layout;
}

/** Frames a part as large as fits, without showing past the screen's edges. */
function viewOnto(f: Box, max = ZOOM_MAX): View {
  const s = Math.min(max, 0.88 * Math.min(100 / f.width, 100 / f.height));
  if (s < 1.25) return WHOLE;
  const offset = (centre: number) => Math.min(0, Math.max(100 - 100 * s, 50 - centre * s));
  return { s, tx: offset(f.left + f.width / 2), ty: offset(f.top + f.height / 2) };
}

interface AnatomyScreenProps {
  locale: DisplayLocale;
  active: number | null;
  /** Zoom onto the active part: the phone layout, where the screen is small. */
  zoom: boolean;
  onHover: (index: number | null) => void;
  onPick: (index: number) => void;
}

/**
 * The demo screen with its parts numbered. Rendered inside TvFrame's 16:9
 * box, client-only, because the theme reads the clock.
 */
export function AnatomyScreen({ locale, active, zoom, onHover, onPick }: AnatomyScreenProps) {
  const themeRef = useRef<HTMLDivElement>(null);
  const layout = useLayout(themeRef, locale);
  const target = active === null ? null : (layout?.parts[active] ?? null);
  const view = zoom && target ? viewOnto(target.focus, target.zoomMax) : WHOLE;

  return (
    <>
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-none"
        style={{ transform: `translate(${view.tx}%, ${view.ty}%) scale(${view.s})` }}
      >
        <div ref={themeRef} className="absolute inset-0">
          <DemoDisplay locale={locale} />
        </div>
        {layout?.parts.map((part, i) =>
          part ? (
            <span
              key={`spot-${i + 1}`}
              aria-hidden
              className={cn(
                'pointer-events-none absolute z-10 transition-opacity duration-300 motion-reduce:transition-none',
                active === i ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                left: `${part.box.left}%`,
                top: `${part.box.top}%`,
                width: `${part.box.width}%`,
                height: `${part.box.height}%`,
                boxShadow: SPOTLIGHT,
              }}
            />
          ) : null
        )}
      </div>

      {/* Outside the zoom, so a marker keeps its size and glides with its part.
          The legend under the set is the accessible version of all this. */}
      {layout && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{ '--m': `${layout.size}px` } as CSSProperties}
        >
          {layout.parts.map((part, i) => {
            if (!part) return null;
            const x = part.x * view.s + view.tx;
            const rawY = part.y * view.s + view.ty;
            const inView = x > 0 && x < 100 && rawY > 0 && rawY < 100;
            // The footer is shorter than a marker on a phone: keep it on screen.
            const y = Math.min(rawY, 100 - layout.radiusY);
            // A pointer shortcut to the legend button: never focused, so focus
            // stays out of this hidden layer.
            return (
              <button
                key={`mark-${i + 1}`}
                type="button"
                tabIndex={-1}
                onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(i)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(i)}
                className={cn(
                  'absolute top-0 left-0 cursor-pointer rounded-full',
                  // Glides in step with the zoom layer (same duration and curve).
                  '[transition:translate_600ms_cubic-bezier(0.22,0.8,0.24,1),opacity_200ms] motion-reduce:[transition:none]',
                  inView ? 'pointer-events-auto' : 'opacity-0'
                )}
                style={{
                  translate: `calc(${x}cqw - 50%) calc(${y}cqh - 50%)`,
                  width: 'var(--m)',
                  height: 'var(--m)',
                }}
              >
                <AnatomyBadge
                  n={i + 1}
                  active={active === i}
                  dimmed={active !== null && active !== i}
                  className="absolute inset-0 transition-[scale,opacity] duration-200 motion-reduce:transition-none"
                  style={{ fontSize: 'calc(var(--m) * 0.54)' }}
                />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
