/**
 * The site's own arrows, drawn for it rather than taken from an icon set:
 * one hairline weight, square ends, the head a little open. Decorative
 * (aria-hidden); the control that holds one carries the words.
 */

type ArrowProps = { className?: string; strokeWidth?: number };

/** The long arrow at the foot of a plate: on to the next one. */
export function ArrowLong({ className = 'h-6 w-12', strokeWidth = 1.25 }: ArrowProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 24" fill="none" className={className}>
      <path
        d="M1 12h45M36.5 3.5 46 12l-9.5 8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Up and out: a call to action, or a link that leaves the page. */
export function ArrowOut({ className = 'size-4', strokeWidth = 1.5 }: ArrowProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 13 13 3M5.5 3H13v7.5" stroke="currentColor" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
