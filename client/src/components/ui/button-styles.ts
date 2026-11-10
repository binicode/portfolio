export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/88',
  secondary: 'border border-foreground/25 text-foreground hover:border-foreground hover:bg-foreground/[0.04]',
  ghost: 'text-foreground hover:bg-foreground/[0.06]',
  danger: 'border border-destructive/40 text-destructive hover:bg-destructive/[0.08]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}
