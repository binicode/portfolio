import { ImageResponse } from 'next/og';

// Generated once at build time and served as a static PNG.
export const alt = 'Biniyam Abera, full-stack software engineer. Software engineered to hold up.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#0c0c0d';
const CONCRETE = '#e4e3e4';
const STEEL = '#a3a2a4';
const RUST = '#dd5226';

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
          backgroundColor: INK,
          backgroundImage: 'linear-gradient(180deg, #0c0c0d 45%, #3d1a0e 80%, #873417 100%)',
          color: CONCRETE,
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: RUST, letterSpacing: 2 }}>BINIYAM ABERA · FULL-STACK ENGINEER</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            Software engineered
          </div>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            to hold up.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: STEEL, fontSize: 24 }}>
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: STEEL }} />
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: STEEL }} />
          <div style={{ display: 'flex' }}>Civil engineering to software engineering</div>
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: STEEL }} />
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: STEEL }} />
        </div>
      </div>
    ),
    size,
  );
}
