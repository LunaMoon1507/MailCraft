import { type ComponentProps, type ReactNode } from 'react';

// Styling lives in src/assets/theme/components.css (.mc-panel*). See THEME.md.
export type CardVariant = 'primary' | 'secondary' | 'plain';

export interface CardProps extends ComponentProps<'section'> {
  variant?: CardVariant;
  /** Small all-caps heading shown at the top of the card. */
  heading?: ReactNode;
}

// primary = grass-topped dirt block, secondary = oak planks, plain = dark panel
const variants: Record<CardVariant, string> = {
  primary: 'mc-panel--grass',
  secondary: 'mc-panel--wood',
  plain: '',
};

export default function Card({
  variant = 'primary',
  heading,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = ['mc-panel', variants[variant], className].filter(Boolean).join(' ');
  return (
    <section className={classes} {...props}>
      {heading && <h2 className="mc-panel__title">{heading}</h2>}
      {children}
    </section>
  );
}
