import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { useProfile } from '@/hooks/useProfile';
import steve from '@graphics/8-steve.png';

// Profile tab, signed in: who you are, your level and XP, and your stats.
// Data comes from the shared profile in SessionContext.
export default function ProfileCard() {
  const { profile, loading, error, reload } = useProfile();

  if (!profile) {
    return (
      <Card variant="primary" heading="Profile">
        {loading || !error ? (
          <p role="status">Loading...</p>
        ) : (
          <>
            <p className="mc-error">{error}</p>
            <div>
              <Button variant="primary" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  const stats = profile.userStats;
  const xp = stats ? levelProgress(stats.xp) : null;

  return (
    <Card variant="primary" heading="Profile">
      <div className="flex items-center gap-px3">
        <span className="mc-slot">
          <img src={steve} alt="" />
        </span>
        <div className="flex min-w-0 flex-col gap-px1">
          <span className="mc-stat__value break-words">{profile.username}</span>
          <span className="mc-subtitle">Welcome back!</span>
        </div>
      </div>

      {stats && xp ? (
        <>
          <div className="flex flex-col gap-px2">
            <div className="flex items-end justify-between">
              <span className="mc-label">Level</span>
              <span className="mc-level">{stats.level}</span>
            </div>
            <ProgressBar value={xp.fraction} label={`Progress to level ${stats.level + 1}`} />
            <p className="mc-label text-right">
              {xp.into} / {xp.needed} XP to level {stats.level + 1}
            </p>
          </div>
          <div>
            <Stat label="Total XP" value={stats.xp} />
            <Stat label="Streak" value={plural(stats.current_streak, 'day')} />
            <Stat label="Longest streak" value={plural(stats.longest_streak, 'day')} />
            <Stat label="Best day" value={plural(stats.best_day_count, 'email')} />
          </div>
        </>
      ) : (
        <p>No XP yet. Head to Cleanup to earn your first points!</p>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mc-stat">
      <span className="mc-label">{label}</span>
      <span className="mc-stat__value">{value}</span>
    </div>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Level formula from README §8: level = floor(sqrt(xp / 10)) + 1,
// so level L starts at 10 * (L - 1)^2 XP.
function levelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 10)) + 1;
  const start = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { into: xp - start, needed: next - start, fraction: (xp - start) / (next - start) };
}
