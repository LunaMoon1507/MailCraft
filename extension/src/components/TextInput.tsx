import { type ComponentProps, type ReactNode, useId } from 'react';

// Styling lives in src/assets/theme/components.css (.mc-field, .mc-input). See THEME.md.
export interface InputProps extends ComponentProps<'input'> {
  label: string;
  updateValue: (value: string) => void;
  error?: string;
  /** Shown on the same row, right of the input (e.g. a Search button). */
  trailing?: ReactNode;
}

export default function TextInput({ label, error, updateValue, trailing, id, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const input = (
    <input
      type="text"
      id={inputId}
      name={label}
      className={['mc-input', trailing && 'w-auto min-w-0 flex-1', className].filter(Boolean).join(' ')}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      onChange={(e) => updateValue(e.target.value)}
      {...props}
    />
  );

  return (
    <div className="mc-field">
      <label htmlFor={inputId} className="mc-label">
        {label}
      </label>
      {trailing ? (
        <div className="flex items-center gap-px1">
          {input}
          {trailing}
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={errorId} className="mc-error">
          {error}
        </p>
      )}
    </div>
  );
}
