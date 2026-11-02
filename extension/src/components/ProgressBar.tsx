// Segmented Minecraft-style bar (XP, cleanup progress).
// Styling lives in src/assets/theme/components.css (.mc-bar). See THEME.md.
export interface ProgressBarProps {
  /** Fraction filled, 0 to 1. Values outside the range are clamped. */
  value: number;
  /** Accessible name, e.g. "Progress to level 5". */
  label: string;
  className?: string;
}

export default function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`mc-bar ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="mc-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
