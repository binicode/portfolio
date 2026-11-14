import { Triangle } from 'lucide-react';
import { formatChange } from './insights';

const TREND = {
  up: { pill: 'bg-success/12 text-success', word: 'up' },
  down: { pill: 'bg-destructive/12 text-destructive', word: 'down' },
  flat: { pill: 'bg-muted text-muted-foreground', word: 'unchanged' },
} as const;

/**
 * A relative change against a named earlier value: "▲ +50%" in green, "▼ −7%"
 * in red. Shape and words carry the direction too, so it never rests on
 * colour; the comparison is in the tooltip and read out to screen readers.
 */
export default function DeltaPill({ change, context }: { change: number; context: string }) {
  const delta = formatChange(change);
  const style = TREND[delta.trend];
  return (
    <span
      title={`${delta.text} vs ${context}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-micro font-medium tabular-nums ${style.pill}`}
    >
      {delta.trend !== 'flat' && (
        <Triangle aria-hidden="true" strokeWidth={0} className={`size-2 fill-current ${delta.trend === 'down' ? 'rotate-180' : ''}`} />
      )}
      {delta.text}
      <span className="sr-only">
        {' '}
        {style.word} vs {context}
      </span>
    </span>
  );
}
