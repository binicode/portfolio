/**
 * The stack, drawn as a building section: the interface is the roof truss,
 * the API the floors and columns, the data layer the foundation, and the
 * third-party services are attached at the side. Callout letters match the
 * legend rendered next to it in HTML (readable at every size).
 *
 * Every layer is a single <path>, so the drawing costs a couple of dozen
 * DOM nodes. It is static on load (animated SVG transforms repaint on the
 * main thread); the hero tabs dim the other layers (.layer-*) instead.
 */

// Warren truss: bottom chord y=190 (x 100–380), top chord y=130 (x 130–350).
const TRUSS_BOTTOM = [100, 155, 210, 265, 320, 380];
const TRUSS_TOP = [130, 185, 240, 295, 350];
const trussDiagonals = TRUSS_BOTTOM.flatMap((x, i) =>
  i < TRUSS_TOP.length ? [`M${x} 190L${TRUSS_TOP[i]} 130L${TRUSS_BOTTOM[i + 1]} 190`] : [],
).join('');
const truss = `M100 190H380M130 130H350${trussDiagonals}`;

const COLUMNS = [130, 200, 280, 350];
const columns = COLUMNS.map((x) => `M${x} 190V360`).join('');
const SLABS = [245, 300];
const slabs = SLABS.map((y) => `M110 ${y}H370`).join('');

// Ground line with short diagonal hatching beneath it.
const groundHatch = Array.from({ length: 30 }, (_, i) => 36 + i * 14)
  .map((x) => `M${x} 360l-8 9`)
  .join('');

// Foundation hatching, clipped to the foundation box by its extent.
const foundationHatch = Array.from({ length: 22 }, (_, i) => 110 + i * 12)
  .map((x) => `M${x} 406l${Math.min(46, 370 - x)} -${Math.min(46, 370 - x)}`)
  .join('');

const SERVICES_Y = [208, 248, 288, 328];
const serviceLinks = SERVICES_Y.map((y) => `M66 ${y}H110`).join('');

const registration = [
  [16, 16],
  [464, 16],
  [16, 424],
  [464, 424],
]
  .map(([x, y]) => `M${x - 6} ${y}h12M${x} ${y - 6}v12`)
  .join('');

function Callout({ x, y, letter, to }: { x: number; y: number; letter: string; to: [number, number] }) {
  return (
    <g className={`layer layer-${letter.toLowerCase()}`}>
      <path d={`M${to[0]} ${to[1]}L${x} ${y}`} className="d-leader" />
      <circle cx={x} cy={y} r="12" className="d-bubble" />
      <text x={x} y={y + 4.5} textAnchor="middle" className="d-bubble-text">
        {letter}
      </text>
    </g>
  );
}

export default function StackDrawing({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 440"
      role="img"
      aria-label="The stack drawn as a building section: a Next.js and React interface as the roof, an Express API as the floors, MongoDB Atlas data as the foundation, and Stripe, Shopify, Gemini and Voyage AI attached as services."
      className={`stack-drawing ${className}`}
    >
      <path d={registration} className="d-faint" />

      <g className="layer layer-c">
        <path d="M30 360H450" className="d-structure" />
        <path d={groundHatch} className="d-faint" />
        <rect x="110" y="360" width="260" height="46" className="d-structure d-fill" />
        <path d={foundationHatch} className="d-faint" />
      </g>

      <g className="layer layer-b">
        <path d={columns} className="d-structure" />
        <path d={slabs} className="d-slab" />
      </g>

      <g className="layer layer-a">
        <path d={truss} className="d-structure" />
        <path d="M100 190V198M380 190V198" className="d-faint" />
      </g>

      <g className="layer layer-d">
        <path d={serviceLinks} className="d-dashed" />
        {SERVICES_Y.map((y) => (
          <circle key={y} cx="56" cy={y} r="9" className="d-node" />
        ))}
      </g>

      <g>
        {/* Overall dimension: the full width of the structure. */}
        <path d="M100 96H380M100 89v14M380 89v14" className="d-accent" />
        <text x="240" y="86" textAnchor="middle" className="d-label">
          Full stack
        </text>
        <Callout x={428} y={150} letter="A" to={[350, 150]} />
        <Callout x={428} y={272} letter="B" to={[370, 272]} />
        <Callout x={428} y={383} letter="C" to={[370, 383]} />
        <Callout x={56} y={160} letter="D" to={[56, 199]} />
      </g>
    </svg>
  );
}
