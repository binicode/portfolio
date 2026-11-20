export type ButtonVariant = 'accent' | 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Rectangular buttons with uppercase mono labels, in the reference's style.
// Colour carries purpose (DESIGN-SYSTEM.md, "Calls to action"):
//   accent    terracotta: start working with me (plan a project, the assistant)
//   primary   sand on teal, Deep Teal on sand: the main action of a product flow
// Filled buttons carry the glaze (.btn-glaze in globals.css); hover is a
// step to a lighter fill, never a fade.
//   secondary outline: the alternative route next to either
const BASE =
  'group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xs font-mono uppercase tracking-[0.04em] whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  accent: 'btn-glaze bg-accent text-accent-foreground hover:bg-accent-bright',
  primary: 'btn-glaze bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-foreground/25 text-foreground hover:border-signal hover:bg-signal/[0.06] hover:text-signal-bright',
  ghost: 'text-foreground hover:bg-foreground/[0.06]',
  danger: 'border border-destructive/40 text-destructive hover:bg-destructive/[0.08]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-micro',
  md: 'h-11 px-5 text-xs',
  lg: 'h-12 px-6 text-xs',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}
