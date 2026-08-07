import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`animate-fade-in rounded-[20px] border border-white/5 bg-card p-6 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}
