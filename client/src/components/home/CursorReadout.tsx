'use client';

import { useEffect, useRef } from 'react';

const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');

/**
 * Drafting-style X/Y readout of the pointer over the hero. Fine pointers
 * only; updates two text nodes at most once per frame. Decorative, so it is
 * hidden from assistive technology.
 */
export default function CursorReadout() {
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      if (xRef.current) xRef.current.textContent = pad(x);
      if (yRef.current) yRef.current.textContent = pad(y);
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    // Both coordinates sit on the left: the right corner belongs to the
    // fixed assistant button.
    <div aria-hidden="true" className="hs-readout">
      <span className="flex gap-4">
        <span>
          X <span ref={xRef}>0000</span>
        </span>
        <span>
          Y <span ref={yRef}>0000</span>
        </span>
      </span>
      <span className="absolute left-1/2 -translate-x-1/2">Scroll</span>
    </div>
  );
}
