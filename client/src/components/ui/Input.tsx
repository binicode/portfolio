import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-bold text-foreground">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`mt-1.5 w-full rounded-xl border border-white/10 bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-red-500/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
