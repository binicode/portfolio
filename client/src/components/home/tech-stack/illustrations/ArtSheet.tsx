import type { ReactNode } from 'react';

/**
 * The shared drawing sheet for the four stack illustrations: one 320×160
 * box, registration crosses in the corners, and the hairline classes
 * (.d-*) the project plates and the original structure drawing use. Same
 * proportions and line weights for every category; transparent background.
 */
export default function ArtSheet({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className="stack-art">
      <path d="M8 3v10M3 8h10M312 3v10M307 8h10M8 147v10M3 152h10M312 147v10M307 152h10" className="d-faint" />
      {children}
    </svg>
  );
}
