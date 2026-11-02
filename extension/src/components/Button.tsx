import { type ComponentProps } from 'react';

// Styling lives in src/assets/theme/components.css (.mc-btn*). See THEME.md.
export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the parent. */
  block?: boolean;
}

// primary = grass block, secondary = oak planks, danger = redstone
const variants: Record<ButtonVariant, string> = {
  primary: 'mc-btn--grass',
  secondary: 'mc-btn--wood',
  danger: 'mc-btn--danger',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'mc-btn--sm',
  md: 'mc-btn--md',
  lg: 'mc-btn--lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['mc-btn', variants[variant], sizes[size], block && 'mc-btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
