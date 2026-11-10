import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** A quiet raised surface. No hover motion: cards are not links by default. */
export default function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card ${noPadding ? '' : 'p-6'} ${className}`}>{children}</div>
  );
}
