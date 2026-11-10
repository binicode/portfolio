import { forwardRef, type InputHTMLAttributes } from 'react';
import { fieldControlClasses, fieldErrorClasses, fieldHintClasses, fieldLabelClasses } from './field-styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, id, className = '', ...props }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className={fieldLabelClasses}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldControlClasses} ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className={fieldErrorClasses}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className={fieldHintClasses}>
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
