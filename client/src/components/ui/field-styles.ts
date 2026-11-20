export const fieldLabelClasses = 'block text-sm font-medium text-foreground';

// On touch screens fields are 16px: iOS Safari zooms the page into any
// focused field smaller than that. Same 24px line, so the height is unchanged.
export const fieldControlClasses =
  'mt-2 block w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-body-sm leading-6 text-foreground ' +
  'pointer-coarse:text-base ' +
  'placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 ' +
  'aria-invalid:border-destructive disabled:opacity-50';

export const fieldHintClasses = 'mt-1.5 text-caption text-muted-foreground';
export const fieldErrorClasses = 'mt-1.5 text-caption text-destructive';
