import { type ComponentProps, useId } from 'react';

// Styling lives in src/assets/theme/components.css (.mc-field, .mc-input). See THEME.md.
export interface InputProps extends ComponentProps<'input'> {
  label: string;
  updateValue: (value: string) => void;
  error?: string;
}

export default function TextInput({ label, error, updateValue, id, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="mc-field">
      <label htmlFor={inputId} className="mc-label">
        {label}
      </label>
      <input
        type="text"
        id={inputId}
        name={label}
        className={`mc-input ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => updateValue(e.target.value)}
        {...props}
      />
      {error && (
        <p id={errorId} className="mc-error">
          {error}
        </p>
      )}
    </div>
  );
}
