import { ImageResponse } from 'next/og';

export const alt = 'NextNamaz — prayer times on any screen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Deliberately uses the ImageResponse default font rather than loading Amiri:
 * pulling a face out of node_modules at request time is the usual way an OG
 * route builds locally and 500s on Vercel. Colour and layout carry the brand.
 */
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
          padding: '72px 80px',
          borderBottom: '24px solid #E8A817',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: '#E8A817',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 30, color: '#1A1A1A', letterSpacing: '-0.01em' }}>
            NextNamaz
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 86,
              lineHeight: 1.05,
              color: '#1A1A1A',
              letterSpacing: '-0.03em',
            }}
          >
            Prayer times,
          </div>
          <div
            style={{
              fontSize: 86,
              lineHeight: 1.05,
              color: '#1A1A1A',
              letterSpacing: '-0.03em',
            }}
          >
            on any screen.
          </div>
        </div>

        <div style={{ fontSize: 30, color: '#6B6B6B', display: 'flex' }}>
          Open a link on a TV. Scan the QR code. Done.
        </div>
      </div>
    ),
    size,
  );
}
