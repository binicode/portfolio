import { formatCount, formatFigure } from '../format';

export interface Column {
  key: string;
  /** Category or item name, shown in the hover readout. */
  label: string;
  /** Optional second line in the readout, such as a date. */
  detail?: string;
  value: number;
}

interface ColumnSparkProps {
  data: Column[];
  /** Index of the one column drawn in the accent; the rest are de-emphasised. */
  emphasis: number;
  /** Accessible name prefix, e.g. "Views of the last 8 videos, oldest first". */
  summary: string;
  unit: string;
  /** Optional x-axis end labels (time series). */
  axis?: { start: string; end: string };
  /** Hover readouts. Off in inert previews, where they can never show. */
  readouts?: boolean;
}

/**
 * A small single-series column chart for a stat tile. Server-rendered
 * HTML: columns are at most 24px wide with a 4px rounded data end and a
 * square baseline, separated by air; one column carries the accent. A
 * hairline marks the maximum, labelled for scale. Hovering a column's full
 * slot (wider than the mark) shows its value and name. Screen readers get
 * every value in the accessible name, so nothing depends on hover.
 */
export default function ColumnSpark({ data, emphasis, summary, unit, axis, readouts = true }: ColumnSparkProps) {
  const max = Math.max(0, ...data.map((column) => column.value));
  const label = `${summary}: ${data.map((column) => `${column.label}, ${formatCount(column.value)} ${unit}`).join('; ')}.`;

  return (
    <div>
      <div role="img" aria-label={label} className="relative h-24 pt-5">
        {/* Max gridline and its value, for scale. */}
        <span aria-hidden="true" className="absolute inset-x-0 top-5 border-t border-border" />
        <span aria-hidden="true" className="absolute left-0 top-0 font-mono text-[0.6875rem] leading-4 text-muted-foreground tabular-nums">
          {formatFigure(max)}
        </span>

        <div className="relative flex h-full items-end border-b border-border">
          {data.map((column, index) => {
            const height = max > 0 ? Math.max((column.value / max) * 100, column.value > 0 ? 2 : 0) : 0;
            const alignEnd = index >= data.length / 2;
            return (
              <div key={column.key} className="group/col relative flex h-full flex-1 items-end justify-center px-px">
                <span
                  className={`block w-full max-w-6 rounded-t-[4px] transition-[filter] duration-150 group-hover/col:brightness-125 ${
                    index === emphasis ? 'bg-accent' : 'bg-chart-muted'
                  }`}
                  style={{ height: `${height}%` }}
                />
                {readouts && (
                  <span
                    className={`chart-tip ${alignEnd ? 'right-0' : 'left-0'} group-hover/col:opacity-100`}
                  >
                    <span className="block font-medium tabular-nums text-foreground">
                      {formatCount(column.value)} {unit}
                    </span>
                    <span className="block text-muted-foreground">{column.label}</span>
                    {column.detail && <span className="block text-muted-foreground">{column.detail}</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Always present (empty without an axis) so plots line up across tiles. */}
      <div aria-hidden="true" className="mt-1.5 flex h-4 justify-between font-mono text-[0.6875rem] leading-4 text-muted-foreground">
        {axis && (
          <>
            <span>{axis.start}</span>
            <span>{axis.end}</span>
          </>
        )}
      </div>
    </div>
  );
}
