'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  label: string;
  durationMs?: number;
}

export default function AnimatedCounter({ target, label, durationMs = 1200 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) {
          return;
        }
        hasAnimatedRef.current = true;

        if (prefersReducedMotion || target === 0) {
          setCount(target);
          return;
        }

        const startTime = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - startTime) / durationMs, 1);
          setCount(Math.round(progress * target));
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return (
    <div ref={ref}>
      <p className="text-4xl font-bold text-foreground">{count}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
