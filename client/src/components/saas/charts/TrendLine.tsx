import { useId } from 'react';
import type { ChartFrameComponent } from './ChartFrame';
import { formatCount, formatFigure } from '../format';
import { niceMax } from '../insights';

export interface TrendPoint {
  key: string;
  value: number;
  /** Short x-axis label, e.g. "Nov 2". */
  axis: string;
  /** Readout context, e.g. "Nov 2 – Nov 9". */
  detail: string;
}

interface TrendLineProps {
  points: TrendPoint[];
  /** Accessible name prefix, e.g. "Hacker News mentions per week, oldest first". */
  summary: string;
  unit: string;
  /** ChartFrame for hover and arrow-key readouts; omit for a static chart. */
  Frame?: ChartFrameComponent;
  /** Plot height utilities; the feature cards use a shorter plot. */
  height?: string;
}

const DEFAULT_HEIGHT = 'h-48 sm:h-56';

/**
 * The large time-series chart: a 2px accent line over a fading wash, a dot
 * per real point (the latest larger), three gridlines with round values, and
 * dates beneath. Server-rendered SVG and HTML; each point's hover target is
 * its full slot, and arrow keys reach the same readouts through the frame.
 */
export default function TrendLine({ points, summary, unit, Frame, height = DEFAULT_HEIGHT }: TrendLineProps) {
  const PLOT = `relative ${height}`;
  const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const n = points.length;
  const top = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const x = (index: number) => (n === 1 ? 50 : (index / (n - 1)) * 100);
  const y = (value: number) => 100 - (value / top) * 100;
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const area = `M${x(0)},100 L${line.replaceAll(' ', ' L')} L${x(n - 1)},100 Z`;
  const label = `${summary}: ${points.map((point) => `${point.detail}, ${formatCount(point.value)} ${unit}`).join('; ')}.`;
  const slotWidth = 100 / Math.max(n - 1, 1);

  const plot = (
    <>
      {[0, 50, 100].map((offset) => (
        <span key={offset} aria-hidden="true" className="absolute inset-x-0 border-t border-border" style={{ top: `${offset}%` }} />
      ))}
      <div aria-hidden="true" className="absolute inset-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.26 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <polyline
            points={line}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-accent"
          />
        </svg>

        {points.map((point, index) => (
          <span
            key={point.key}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${
              index === n - 1 ? 'size-2.5 bg-accent-bright' : 'size-2 bg-accent'
            }`}
            style={{ left: `${x(index)}%`, top: `${y(point.value)}%` }}
          />
        ))}

        {Frame &&
          points.map((point, index) => (
            <div
              key={point.key}
              data-slot
              className="chart-slot absolute inset-y-0"
              style={{ left: `${x(index) - slotWidth / 2}%`, width: `${slotWidth}%` }}
            >
              <span className="chart-cross absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
              <span
                className="chart-cross absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
                style={{ top: `${y(point.value)}%` }}
              />
              <span className={`chart-tip ${index >= n / 2 ? 'right-1/2' : 'left-1/2'}`}>
                <span className="block font-medium tabular-nums text-foreground">
                  {formatCount(point.value)} {unit}
                </span>
                <span className="block text-muted-foreground">{point.detail}</span>
              </span>
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
      <div aria-hidden="true" className="relative mt-2.5 h-4 font-mono text-micro text-muted-foreground">
        {points.map((point, index) => (
          <span
            key={point.key}
            className={`absolute whitespace-nowrap ${
              index === 0 ? '' : index === n - 1 ? '-translate-x-full' : '-translate-x-1/2'
            } ${(index % 2 === 1 || index === n - 2) && index !== n - 1 ? '@max-lg:hidden' : ''} ${index === n - 1 ? 'text-accent-bright' : ''}`}
            style={{ left: `${x(index)}%` }}
          >
            {point.axis}
          </span>
        ))}
      </div>
    </div>
  );
}
