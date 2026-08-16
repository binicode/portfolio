import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div
      className={`animate-fade-in rounded-2xl border border-border bg-card ${
        noPadding ? '' : 'p-6'
      } shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}
