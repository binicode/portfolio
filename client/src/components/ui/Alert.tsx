import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  success: 'border-success/40 text-success',
  error: 'border-destructive/40 text-destructive',
  info: 'border-accent/40 text-accent',
};

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

export default function Alert({ variant, children }: AlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-md border bg-card px-3.5 py-3 text-sm leading-snug ${VARIANT_STYLES[variant]}`}
    >
      <Icon aria-hidden="true" className="mt-px h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </div>
  );
}
