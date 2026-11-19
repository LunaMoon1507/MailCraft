// Small "LV 7" box for the header. Pops when the level changes.
// Styling lives in src/assets/theme/components.css (.mc-chip). See THEME.md.
export interface LevelChipProps {
  level: number;
  className?: string;
}

export default function LevelChip({ level, className = '' }: LevelChipProps) {
  return (
    <span key={level} className={['mc-chip', 'animate-pop', className].filter(Boolean).join(' ')}>
      <span className="sr-only">Level</span>
      <span className="mc-label" aria-hidden="true">
        LV
      </span>
      <span className="mc-chip__value">{level}</span>
    </span>
  );
}
