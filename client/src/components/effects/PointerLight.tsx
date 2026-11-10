'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A soft light that follows a fine pointer across its container.
 * Transform-only (the gradient itself never repaints), one rAF per
 * frame at most, and inert on touch devices or with reduced motion.
 */
export default function PointerLight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const light = lightRef.current;
    if (!container || !light) return;

    const allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!allowed.matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      frame = 0;
      light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      x = event.clientX - rect.left - light.offsetWidth / 2;
      y = event.clientY - rect.top - light.offsetHeight / 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnter = () => (light.style.opacity = '1');
    const onLeave = () => (light.style.opacity = '0');

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointerleave', onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative isolate ${className}`}>
      <div
        ref={lightRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 -z-10 h-[32rem] w-[32rem] rounded-full opacity-0 transition-opacity duration-500 [background:radial-gradient(closest-side,rgb(143_176_255/0.16),transparent)] will-change-transform"
      />
      {children}
    </div>
  );
}
