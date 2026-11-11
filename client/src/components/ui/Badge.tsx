import type { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'muted' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  /** Leading status dot, so state never rests on colour alone. */
  dot?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'border-accent/35 text-accent',
  muted: 'border-border text-muted-foreground',
  success: 'border-success/40 text-success',
};

export default function Badge({ variant = 'muted', dot = false, children }: BadgeProps) {
  return (
    <span
      className={`label inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs border px-2 py-0.5 ${VARIANT_STYLES[variant]}`}
    >
      {dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
