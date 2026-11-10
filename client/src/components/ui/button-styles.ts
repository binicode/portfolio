export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

// Rectangular buttons with uppercase mono labels, in the reference's style.
const BASE =
  'group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xs font-mono uppercase tracking-[0.04em] whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/85',
  secondary: 'border border-foreground/25 text-foreground hover:border-foreground hover:bg-foreground/[0.04]',
  ghost: 'text-foreground hover:bg-foreground/[0.06]',
  danger: 'border border-destructive/40 text-destructive hover:bg-destructive/[0.08]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[0.6875rem]',
  md: 'h-11 px-5 text-xs',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}
