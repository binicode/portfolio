import { ImageResponse } from 'next/og';

// Generated once at build time and served as a static PNG.
export const alt = 'Biniyam Abera, full-stack software engineer. Software engineered to hold up.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The palette from globals.css (ImageResponse can't read CSS variables).
const INK = '#10191e';
const BONE = '#ede7dc';
const ASH = '#a9b6bb';
const RUST = '#e8642f';
const VERDIGRIS = '#62c2ab';

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
          backgroundImage: 'linear-gradient(180deg, #132b29 0%, #10191e 42%, #3d1a0e 80%, #8a3a1a 100%)',
          color: BONE,
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, color: RUST, letterSpacing: 2 }}>BINIYAM ABERA · FULL-STACK ENGINEER</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            Software engineered
          </div>
          <div style={{ display: 'flex', fontSize: 108, fontWeight: 500, lineHeight: 0.95, letterSpacing: -5 }}>
            <span>to&nbsp;</span>
            <span style={{ color: VERDIGRIS }}>hold up</span>
            <span>.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: ASH, fontSize: 24 }}>
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: ASH }} />
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: ASH }} />
          <div style={{ display: 'flex' }}>Civil engineering to software engineering</div>
          <div style={{ display: 'flex', flex: 1, height: 2, backgroundColor: ASH }} />
          <div style={{ display: 'flex', width: 2, height: 22, backgroundColor: ASH }} />
        </div>
      </div>
    ),
    size,
  );
}
