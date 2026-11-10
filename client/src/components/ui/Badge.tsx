import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'muted' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'border-accent/35 text-accent',
  muted: 'border-border text-muted-foreground',
  success: 'border-success/40 text-success',
};

export default function Badge({ variant = 'muted', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
