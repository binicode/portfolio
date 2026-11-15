import type { ReactNode } from 'react';
import { ArrowOut } from './Arrow';

export type PillTone = 'solid' | 'outline';

/** Classes for the element that carries the pill (a link or a button). */
export function pillClasses(className = ''): string {
  return `group/pill inline-flex shrink-0 items-center gap-1 rounded-full ${className}`.trim();
}

// Hover is a change of colour, not of opacity: the pill steps from ink (or
// bone, in a dark product) to rust, the action colour, and the arrow turns
// to point where you're going.
const PART: Record<PillTone, string> = {
  solid:
    'bg-primary text-primary-foreground group-hover/pill:bg-accent group-hover/pill:text-accent-foreground group-active/pill:bg-accent-bright',
  outline:
    'border border-foreground/25 text-foreground group-hover/pill:border-accent group-hover/pill:text-accent',
};

/**
 * The reference's call to action: a pill with the words and a round arrow
 * beside it. Both halves belong to one control (the parent link or button,
 * see `pillClasses`), so there's one tab stop and one accessible name.
 */
export default function PillParts({
  children,
  tone = 'solid',
  arrow = true,
  size = 'md',
}: {
  children: ReactNode;
  tone?: PillTone;
  arrow?: boolean;
  size?: 'sm' | 'md';
}) {
  const height = size === 'sm' ? 'h-10' : 'h-12';
  const motion = 'transition-[background-color,border-color,color] duration-200 ease-[var(--ease-out)]';
  return (
    <>
      <span
        className={`inline-flex ${height} items-center rounded-full ${size === 'sm' ? 'px-5 text-sm' : 'px-6 text-[0.9375rem]'} font-medium whitespace-nowrap ${motion} ${PART[tone]}`}
      >
        {children}
      </span>
      {arrow && (
        <span aria-hidden="true" className={`inline-grid ${height} aspect-square place-items-center rounded-full ${motion} ${PART[tone]}`}>
          <ArrowOut className="size-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover/pill:rotate-45" />
        </span>
      )}
    </>
  );
}
