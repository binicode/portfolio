import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'muted' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
};

export default function Badge({ variant = 'muted', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VARIANT_STYLES[variant]}`}>
      {children}
    </span>
  );
}
