import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const textareaId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div>
        <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`mt-1.5 w-full rounded-xl border border-input bg-input/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-destructive/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
