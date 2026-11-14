'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface ChartFrameProps {
  /** Accessible name: what the chart shows and every value in it. */
  label: string;
  /** One spoken readout per data slot, in order, e.g. "4,210 views, Vector search on a budget". */
  readouts: string[];
  className?: string;
  /** Server-rendered plot. Each data point's hover target carries `data-slot`. */
  children: ReactNode;
}

/**
 * The frame's type, for charts that accept it as a prop. Charts take the
 * frame rather than importing it, so a static chart (the home page poster)
 * pulls no client code into its page.
 */
export type ChartFrameComponent = (props: ChartFrameProps) => ReactNode;

/**
 * Makes a server-rendered chart keyboard-readable. Focus it, then use the
 * arrow keys (Home/End to jump, Escape to leave): the active point gets
 * `data-active`, which shows the same readout as hovering, and its value is
 * announced. The plot itself stays server-rendered; this island only moves
 * an attribute and owns the live region.
 */
export default function ChartFrame({ label, readouts, className = '', children }: ChartFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-slot]').forEach((slot, index) => {
      slot.toggleAttribute('data-active', index === active);
    });
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = readouts.length - 1;
    if (last < 0) return;
    const from = active ?? -1;
    const next: Record<string, number | null> = {
      ArrowRight: Math.min(from + 1, last),
      ArrowDown: Math.min(from + 1, last),
      ArrowLeft: from < 0 ? last : Math.max(from - 1, 0),
      ArrowUp: from < 0 ? last : Math.max(from - 1, 0),
      Home: 0,
      End: last,
      Escape: null,
    };
    if (event.key in next) {
      event.preventDefault();
      setActive(next[event.key]);
    }
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="chart"
      aria-label={`${label} Use the arrow keys to read each value.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      className={`chart-frame ${className}`}
    >
      {children}
      <span aria-live="polite" className="sr-only">
        {active === null ? '' : readouts[active]}
      </span>
    </div>
  );
}
