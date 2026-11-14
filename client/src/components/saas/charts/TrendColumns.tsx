import type { ChartFrameComponent } from './ChartFrame';
import type { TrendPoint } from './TrendLine';
import { formatCount, formatFigure } from '../format';
import { niceMax } from '../insights';

interface TrendColumnsProps {
  points: TrendPoint[];
  /** Index of the one column drawn in the accent (the newest). */
  emphasis: number;
  summary: string;
  unit: string;
  Frame?: ChartFrameComponent;
  /** Plot height utilities; the feature cards use a shorter plot. */
  height?: string;
}

const DEFAULT_HEIGHT = 'h-48 sm:h-56';

/**
 * The large column chart: one gray series with a single accent column, 4px
 * rounded tops on a square baseline, three gridlines with round values and a
 * label under each column (the accent column's label in the accent too). Each
 * column's full slot is its hover target; arrow keys reach the same readouts.
 */
export default function TrendColumns({ points, emphasis, summary, unit, Frame, height = DEFAULT_HEIGHT }: TrendColumnsProps) {
  const PLOT = `relative ${height}`;
  const n = points.length;
  const top = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const label = `${summary}: ${points.map((point) => `${point.detail}, ${formatCount(point.value)} ${unit}`).join('; ')}.`;

  const plot = (
    <>
      {[0, 50, 100].map((offset) => (
        <span key={offset} aria-hidden="true" className="absolute inset-x-0 border-t border-border" style={{ top: `${offset}%` }} />
      ))}
      <div aria-hidden="true" className="relative flex h-full items-end">
        {points.map((point, index) => (
          <div key={point.key} data-slot className="chart-slot relative flex h-full flex-1 items-end justify-center px-1 sm:px-1.5">
            <span
              className={`chart-bar block w-full max-w-11 rounded-t-[4px] ${index === emphasis ? 'bg-accent' : 'bg-chart-muted'}`}
              style={{ height: `${Math.max((point.value / top) * 100, point.value > 0 ? 1.5 : 0)}%` }}
            />
            {Frame && (
              <span className={`chart-tip ${index >= n / 2 ? 'right-0' : 'left-0'}`}>
                <span className="block font-medium tabular-nums text-foreground">
                  {formatCount(point.value)} {unit}
                </span>
                <span className="block text-muted-foreground">{point.detail}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="@container grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
      <div aria-hidden="true" className={`${PLOT} font-mono text-micro tabular-nums text-muted-foreground`}>
        {[top, top / 2, 0].map((tick, index) => (
          <span key={index} className="absolute right-0 -translate-y-1/2" style={{ top: `${index * 50}%` }}>
            {formatFigure(tick)}
          </span>
        ))}
      </div>
      {Frame ? (
        <Frame label={label} readouts={points.map((point) => `${formatCount(point.value)} ${unit}, ${point.detail}`)} className={PLOT}>
          {plot}
        </Frame>
      ) : (
        <div role="img" aria-label={label} className={PLOT}>
          {plot}
        </div>
      )}
      <span />
      <div aria-hidden="true" className="mt-2.5 flex font-mono text-micro text-muted-foreground">
        {points.map((point, index) => (
          // Each label sits in its column's slot. On narrow charts the first and
          // last are pinned to the slot's outer edge (flex alignment, so a label
          // wider than its slot overflows inward, never past the card).
          <span
            key={point.key}
            className={`flex min-w-0 flex-1 justify-center whitespace-nowrap ${index === emphasis ? 'font-medium text-accent-bright' : ''} ${
              index !== 0 && index !== emphasis && index !== Math.floor(n / 2) ? '@max-md:invisible' : ''
            } ${index === 0 ? '@max-md:justify-start' : ''} ${index === n - 1 ? '@max-md:justify-end' : ''}`}
          >
            <span>{point.axis}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
