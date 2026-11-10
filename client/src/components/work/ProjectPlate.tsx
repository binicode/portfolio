/**
 * A drawing "plate" for a project: one of five structural motifs drawn in
 * hairlines. Projects have no screenshots in the CMS, so each gets a
 * consistent, art-directed visual instead of an empty box. Decorative
 * (aria-hidden); a few path elements each, no image bytes.
 *
 * `variant` is the project's position in the newest-first list, so the
 * same project shows the same plate on the work list and its case study.
 */

const W = 400;
const H = 300;

const range = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join('');

function registration() {
  return [
    [14, 14],
    [W - 14, 14],
    [14, H - 14],
    [W - 14, H - 14],
  ]
    .map(([x, y]) => `M${x - 5} ${y}h10M${x} ${y - 5}v10`)
    .join('');
}

/** Pratt truss bridge on two piers. */
function TrussBridge() {
  const nodes = [60, 100, 140, 180, 220, 260, 300, 340];
  const verticals = nodes.slice(1, -1).map((x) => `M${x} 170V120`).join('');
  const diagonals = nodes
    .slice(0, -1)
    .map((x, i) => (i < 3 ? `M${x + 40} 170L${x} 120` : i > 3 ? `M${x} 170L${x + 40} 120` : ''))
    .join('');
  return (
    <>
      <path d={`M40 170H360M60 120H340M60 120L40 170M340 120L360 170${verticals}${diagonals}`} className="d-structure" />
      <path d="M90 170V236M310 170V236M74 236H106M294 236H326" className="d-structure" />
      <path d={`M20 236H380${range(26, (i) => `M${28 + i * 14} 236l-7 8`)}`} className="d-faint" />
      <path d="M40 72H360M40 66v12M360 66v12" className="d-accent" />
    </>
  );
}

/** Masonry arch with voussoir joints. */
function Arch() {
  const cx = 200;
  const cy = 220;
  const r1 = 110;
  const r2 = 132;
  const joints = range(13, (i) => {
    const a = Math.PI - (i * Math.PI) / 12;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return `M${(cx + r1 * c).toFixed(1)} ${(cy - r1 * s).toFixed(1)}L${(cx + r2 * c).toFixed(1)} ${(cy - r2 * s).toFixed(1)}`;
  });
  return (
    <>
      <path
        d={`M${cx - r1} ${cy}A${r1} ${r1} 0 0 1 ${cx + r1} ${cy}M${cx - r2} ${cy}A${r2} ${r2} 0 0 1 ${cx + r2} ${cy}${joints}`}
        className="d-structure"
      />
      <path d={`M40 ${cy}H${cx - r2}M${cx + r2} ${cy}H360M40 ${cy - 140}H360`} className="d-structure" />
      <path d={`M${cx} ${cy}V${cy - r1}M${cx - 8} ${cy}H${cx + 8}`} className="d-accent" />
      <path d={`M20 ${cy + 26}H380${range(26, (i) => `M${28 + i * 14} ${cy + 26}l-7 8`)}`} className="d-faint" />
    </>
  );
}

/** Column grid in plan, with axis bubbles. */
function GridPlan() {
  const xs = [90, 170, 250, 330];
  const ys = [80, 150, 220];
  const axes = xs.map((x) => `M${x} 50V250`).join('') + ys.map((y) => `M60 ${y}H360`).join('');
  const columns = xs.flatMap((x) => ys.map((y) => `M${x - 6} ${y - 6}h12v12h-12z`)).join('');
  return (
    <>
      <path d={axes} className="d-dashed" />
      <path d={columns} className="d-structure d-solid" />
      <path d="M90 270H330M90 264v12M170 264v12M250 264v12M330 264v12" className="d-accent" />
      {xs.map((x) => (
        <circle key={x} cx={x} cy={34} r={9} className="d-bubble" />
      ))}
    </>
  );
}

/** Cantilever from a wall, with distributed load arrows. */
function Cantilever() {
  const loads = range(7, (i) => {
    const x = 120 + i * 36;
    return `M${x} 90V128M${x - 5} 120L${x} 128L${x + 5} 120`;
  });
  return (
    <>
      <path d={`M80 60V250${range(14, (i) => `M80 ${66 + i * 14}l-10 8`)}`} className="d-faint" />
      <path d="M80 60V250M80 136H350M80 156H350M350 136V156" className="d-structure" />
      <path d={`M120 90H336${loads}`} className="d-accent" />
      <path d="M80 200Q230 214 350 236" className="d-dashed" />
    </>
  );
}

/** Ground section: strata with a pile foundation. */
function Strata() {
  const layers = [110, 160, 205, 250];
  const lines = layers.map((y, i) => `M20 ${y}C120 ${y - 10 + i * 4} 260 ${y + 12 - i * 3} 380 ${y - 4}`).join('');
  const hatch = range(28, (i) => `M${24 + i * 13} 250l13 -13`);
  return (
    <>
      <path d={lines} className="d-structure" />
      <path d={hatch} className="d-faint" />
      <path d="M150 60V230M250 60V230M130 60H270" className="d-structure" />
      <path d="M290 60V230M284 60h12M284 230h12" className="d-accent" />
      <path d={range(5, (i) => `M${160 + i * 18} 160h8`)} className="d-faint" />
    </>
  );
}

const MOTIFS = [TrussBridge, GridPlan, Arch, Cantilever, Strata];

export default function ProjectPlate({ variant, className = '' }: { variant: number; className?: string }) {
  const Motif = MOTIFS[((variant % MOTIFS.length) + MOTIFS.length) % MOTIFS.length];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className={`plate ${className}`}>
      <path d={registration()} className="d-faint" />
      <Motif />
    </svg>
  );
}
