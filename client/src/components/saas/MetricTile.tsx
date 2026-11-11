import type { ReactNode } from 'react';
import Link from 'next/link';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import type { SourceStatus } from '@/types/saas';
import { formatCount, formatFigure } from './format';

const STATUS: Record<SourceStatus, { label: string; variant: BadgeVariant }> = {
  connected: { label: 'Live', variant: 'success' },
  not_connected: { label: 'Not connected', variant: 'muted' },
  unavailable: { label: 'Unavailable', variant: 'primary' },
};

interface MetricTileProps {
  source: string;
  status: SourceStatus;
  /** What to add in Settings when the source isn't connected. */
  connectHint: string;
  metric?: { label: string; value: number };
  /** e.g. "+12 vs previous week". */
  delta?: { text: string; positive: boolean } | null;
  secondary?: Array<{ label: string; value: number }>;
  /** The chart, or a note when there is nothing to chart. */
  children?: ReactNode;
  caption?: string;
  /** Extra classes, e.g. to drop a tile from the preview on small screens. */
  className?: string;
}

/**
 * One source in the dashboard's metric row: status badge, headline figure,
 * two supporting numbers and a small chart. Not-connected and unavailable
 * sources keep the tile's place with a clear next step.
 */
export default function MetricTile({
  source,
  status,
  connectHint,
  metric,
  delta,
  secondary = [],
  children,
  caption,
  className = 'flex',
}: MetricTileProps) {
  const id = `tile-${source.toLowerCase().replace(/\s+/g, '-')}`;
  const badge = STATUS[status];

  return (
    <section aria-labelledby={id} className={`min-w-0 flex-col rounded-md border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="label text-muted-foreground">
          {source}
        </h2>
        <Badge variant={badge.variant} dot>
          {badge.label}
        </Badge>
      </div>

      {status === 'connected' && metric ? (
        <>
          <p className="mt-5">
            <data
              value={metric.value}
              title={formatCount(metric.value)}
              className="block text-[2.25rem] font-medium leading-none tracking-[-0.03em]"
            >
              {formatFigure(metric.value)}
            </data>
            <span className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
              {metric.label}
              {delta && (
                <span className={`font-mono text-xs tabular-nums ${delta.positive ? 'text-success' : 'text-muted-foreground'}`}>
                  {delta.text}
                </span>
              )}
            </span>
          </p>

          {secondary.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
              {secondary.map((item) => (
                <div key={item.label}>
                  <dt className="label text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 text-[0.9375rem] tabular-nums" title={formatCount(item.value)}>
                    {formatFigure(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <figure className="mt-auto pt-6">
            {children}
            {caption && <figcaption className="label mt-3 text-muted-foreground">{caption}</figcaption>}
          </figure>
        </>
      ) : status === 'unavailable' ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {source} didn’t respond, so its numbers are missing for now. They return on the next refresh.
        </p>
      ) : (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">{connectHint}</p>
          <Link href="/saas/dashboard/settings" className="link mt-4 inline-block text-sm font-medium">
            Connect {source}
          </Link>
        </div>
      )}
    </section>
  );
}
