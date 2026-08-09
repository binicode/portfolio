'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speedMs?: number;
}

export default function TypewriterText({ text, speedMs = 40 }: TypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayedLength(text.length);
      return;
    }

    setDisplayedLength(0);
    if (text.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs]);

  return (
    <span className="relative">
      <span aria-hidden="true">
        {text.slice(0, displayedLength)}
        <span className="animate-pulse border-r-2 border-primary" />
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
