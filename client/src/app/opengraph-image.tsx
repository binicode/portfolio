import { ImageResponse } from 'next/og';

// Generated once at build time and served as a static PNG.
export const alt = 'Biniyam Abera, freelance full-stack engineer. Your product, built to hold up.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The palette from globals.css (ImageResponse can't read CSS variables).
const TEAL = '#084c4c';
const TEAL_LIT = '#136f6e';
const TEAL_TEXT = '#0b4a4a';
const TEAL_TEXT_MUTED = '#3e5c59';
const SAND_FIELD = '#efe4d4';
const SAND_FIELD_LIT = '#f7efe4';
const SAND_FIELD_EDGE = '#e7d8c3';

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
          padding: '72px 80px',
          // The hero's first screen: the sand field, lit like the reference's
          // backdrop, teal type, and a band of Deep Teal along the bottom.
          backgroundColor: SAND_FIELD,
          backgroundImage: `radial-gradient(circle at 50% 45%, ${SAND_FIELD_LIT} 0%, ${SAND_FIELD_EDGE} 100%)`,
          borderBottom: `16px solid ${TEAL}`,
          color: TEAL_TEXT,
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: TEAL_TEXT_MUTED, letterSpacing: 2 }}>BINIYAM ABERA · FREELANCE FULL-STACK ENGINEER</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            Your product,
          </div>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            <span>built to&nbsp;</span>
            <span style={{ color: TEAL_LIT }}>hold up</span>
            <span>.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: TEAL_TEXT_MUTED, fontSize: 24 }}>
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: TEAL_TEXT_MUTED }} />
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: TEAL_TEXT_MUTED }} />
          <div style={{ display: 'flex' }}>Civil engineering to software engineering</div>
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: TEAL_TEXT_MUTED }} />
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: TEAL_TEXT_MUTED }} />
        </div>
      </div>
    ),
    size,
  );
}
