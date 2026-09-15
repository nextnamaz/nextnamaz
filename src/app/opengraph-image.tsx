import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'NextNamaz: put prayer times on your mosque TV';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Everything this card needs is read once, at build: the route is
 * prerendered, so neither the wordmark nor the fonts have to exist at
 * request time (reading files then is how an OG image renders locally and
 * fails on the host). Each read has a fallback, so a missing file degrades
 * the card rather than breaking it.
 *
 * The fonts are the site's own, self-hosted for the display themes: Amiri
 * for the headline, as on the page, and Reem Kufi for the line beneath.
 * satori's built-in font measures some words wider than it draws them,
 * which left a visible hole in the headline; a real font does not.
 */
/** Paths stay literal at each call so the file tracer packs three files, not the project. */
function attempt<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function wordmark(): { src: string; width: number } | null {
  const file = attempt(() => readFileSync(join(process.cwd(), 'public', 'logo.svg')));
  if (!file) return null;
  const svg = file.toString('utf8');
  const [, , w = 0, h = 0] = (/viewBox="([\d.\s-]+)"/.exec(svg)?.[1] ?? '').trim().split(/\s+/).map(Number);
  const ratio = h > 0 ? w / h : 4;
  return { src: `data:image/svg+xml;base64,${file.toString('base64')}`, width: Math.round(72 * ratio) };
}

const WORDMARK = wordmark();
const AMIRI = attempt(() =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', 'amiri', 'files', 'amiri-latin-700-normal.woff'))
);
const KUFI = attempt(() =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', 'reem-kufi', 'files', 'reem-kufi-latin-400-normal.woff'))
);

const fonts = [
  AMIRI && { name: 'Amiri', data: AMIRI, weight: 700 as const, style: 'normal' as const },
  KUFI && { name: 'Reem Kufi', data: KUFI, weight: 400 as const, style: 'normal' as const },
].filter((f): f is NonNullable<typeof f> => f !== null);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAFAF8',
          padding: '64px 80px 56px',
          borderBottom: '20px solid #E8A817',
          fontFamily: KUFI ? 'Reem Kufi' : undefined,
        }}
      >
        {WORDMARK ? (
          <img src={WORDMARK.src} width={WORDMARK.width} height={72} alt="" />
        ) : (
          <div style={{ fontSize: 40, fontWeight: 700, color: '#1A1A1A', display: 'flex' }}>NextNamaz</div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: AMIRI ? 'Amiri' : undefined,
            fontWeight: 700,
            fontSize: 84,
            lineHeight: 1.12,
            color: '#1A1A1A',
          }}
        >
          <div style={{ display: 'flex' }}>Put prayer times</div>
          <div style={{ display: 'flex' }}>on your mosque TV.</div>
        </div>

        <div style={{ fontSize: 30, color: '#6B6B6B', display: 'flex' }}>
          It&apos;s a web page. Open it on the TV, scan the code with your phone, done.
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
