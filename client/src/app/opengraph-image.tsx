import { ImageResponse } from 'next/og';

// Generated once at build time and served as a static PNG.
export const alt = 'Biniyam Abera, full-stack software engineer. Software engineered to hold up.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#0f2233';
const CONCRETE = '#ecedea';
const STEEL = '#9aabba';

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
          color: CONCRETE,
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: STEEL }}>Biniyam Abera, full-stack software engineer</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3 }}>
            Software engineered
          </div>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3 }}>
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
