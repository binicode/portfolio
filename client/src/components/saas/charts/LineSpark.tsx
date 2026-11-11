import { formatCount, formatFigure } from '../format';

export interface LinePoint {
  key: string;
  /** Period name for the readout, e.g. "Oct 29 – Nov 4". */
  label: string;
  value: number;
}

interface LineSparkProps {
  data: LinePoint[];
  summary: string;
  unit: string;
  axis: { start: string; end: string };
  /** Hover crosshair and readouts. Off in inert previews, where they can never show. */
  readouts?: boolean;
}

/**
 * A small single-series trend line for a stat tile: a 2px line over a
 * faint wash, in the de-emphasis hue, ending in an accent dot (the current
 * period) with a surface ring and its value. The line is SVG stretched to
 * the box with non-scaling strokes; the dot, label and hover crosshair are
 * HTML, so they stay round and crisp at any width. Each period's hover band
 * is the full slot, wider than the line.
 */
export default function LineSpark({ data, summary, unit, axis, readouts = true }: LineSparkProps) {
  const n = data.length;
  const max = Math.max(1, ...data.map((point) => point.value));
  const x = (index: number) => (n === 1 ? 50 : (index / (n - 1)) * 100);
  const y = (value: number) => 100 - (value / max) * 100;

  const points = data.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const area = `M${x(0)},100 L${points.replaceAll(' ', ' L')} L${x(n - 1)},100 Z`;
  const last = data[n - 1];
  const label = `${summary}: ${data.map((point) => `${point.label}, ${formatCount(point.value)}`).join('; ')}.`;

  return (
    <div>
      <div role="img" aria-label={label} className="relative h-24 pt-5">
        <span aria-hidden="true" className="absolute inset-x-0 top-5 border-t border-border" />
        {last.value !== max && (
          <span aria-hidden="true" className="absolute left-0 top-0 font-mono text-[0.6875rem] leading-4 text-muted-foreground tabular-nums">
            {formatFigure(max)}
          </span>
        )}

        {/* Plot box, inset by the dot radius so the end dot is never clipped. */}
        <div className="absolute inset-x-1 bottom-0 top-5 border-b border-border">
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <path d={area} className="fill-chart-muted/15" />
            <polyline
              points={points}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-chart-muted"
            />
          </svg>

          {/* Current period: accent dot with a surface ring, value beside it. */}
          <span
            aria-hidden="true"
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-card"
            style={{ left: `${x(n - 1)}%`, top: `${y(last.value)}%` }}
          />
          <span
            aria-hidden="true"
            className="absolute right-0 font-mono text-[0.6875rem] leading-4 tabular-nums text-foreground"
            style={{ top: `calc(${y(last.value)}% - 1.25rem)` }}
          >
            {formatFigure(last.value)}
          </span>

          {/* Crosshair: one hover band per period, centred on its x. */}
          {readouts && data.map((point, index) => (
            <div
              key={point.key}
              className="group/pt absolute inset-y-0"
              style={{ left: `${x(index) - 50 / Math.max(n - 1, 1)}%`, width: `${100 / Math.max(n - 1, 1)}%` }}
            >
              <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/30 opacity-0 group-hover/pt:opacity-100" />
              <span
                className="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0 ring-2 ring-card group-hover/pt:opacity-100"
                style={{ top: `${y(point.value)}%` }}
              />
              <span className={`chart-tip ${index >= n / 2 ? 'right-1/2' : 'left-1/2'} group-hover/pt:opacity-100`}>
                <span className="block font-medium tabular-nums text-foreground">
                  {formatCount(point.value)} {unit}
                </span>
                <span className="block text-muted-foreground">{point.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-1.5 flex h-4 justify-between font-mono text-[0.6875rem] leading-4 text-muted-foreground">
        <span>{axis.start}</span>
        <span>{axis.end}</span>
      </div>
    </div>
  );
}
