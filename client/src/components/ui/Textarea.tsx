import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { fieldControlClasses, fieldErrorClasses, fieldHintClasses, fieldLabelClasses } from './field-styles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const textareaId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div>
        <label htmlFor={textareaId} className={fieldLabelClasses}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldControlClasses} leading-relaxed ${className}`}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className={fieldErrorClasses}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className={fieldHintClasses}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
