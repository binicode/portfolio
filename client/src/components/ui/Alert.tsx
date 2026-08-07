import type { ReactNode } from 'react';

type AlertVariant = 'success' | 'error' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-primary/10 text-primary border-primary/20',
};

const ICONS: Record<AlertVariant, ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export default function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${VARIANT_STYLES[variant]}`}>
      {ICONS[variant]}
      <span>{children}</span>
    </div>
  );
}
