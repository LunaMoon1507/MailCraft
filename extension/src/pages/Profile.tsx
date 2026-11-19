import Card from "@/components/Card";
import { awardPoints } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";

// Shown only while logged in (App.tsx renders <Login> otherwise).
// The profile itself is loaded once in SessionContext and shared app-wide.
export default function Profile() {
    const { profile, loading, error, reload } = useProfile();

    const stats = profile?.userStats;
    const xp = stats ? levelProgress(stats.xp) : null;
    const message = profile ? `Welcome, ${profile.username}!` : error;

    // test that the points work
    async function testPoints() {
        try {
            await awardPoints("DELETE");
            await reload();
        }
        catch (error) {
            console.log(error)
        }
    }

    // Clearing the stored token logs out everywhere: useAuth sees it and the
    // shared profile is cleared automatically.
    const handleLogout = () => {
        void logout();
    }

    if (!profile && loading) {
        return (
            <Card variant='primary'>
                <div>Loading...</div>
            </Card>
        )
    }

    return (
        <Card variant='primary' heading="Profile">
            {message && <p>{message}</p>}
            {stats && xp &&
                <div className="flex flex-col gap-px2">
                    <div className="flex items-end justify-between">
                        <span className="mc-label">Level</span>
                        <span className="mc-level">{stats.level}</span>
                    </div>
                    <ProgressBar value={xp.fraction} label={`Progress to level ${stats.level + 1}`} />
                    <p className="mc-label text-right">{xp.into} / {xp.needed} XP</p>
                    <div>
                        <div className="mc-stat"><span className="mc-label">Total XP</span><span className="mc-stat__value">{stats.xp}</span></div>
                        <div className="mc-stat"><span className="mc-label">Streak</span><span className="mc-stat__value">{stats.current_streak} days</span></div>
                    </div>
                </div>
            }
            <div className="flex flex-wrap gap-px2">
                <Button variant='danger' size='sm' onClick={handleLogout}>Log Out</Button>
                <Button variant='primary' size='sm' onClick={testPoints}>Test points adding</Button>
            </div>
        </Card>
    )
}

// Level formula from README §8: level = floor(sqrt(xp / 10)) + 1,
// so level L starts at 10 * (L - 1)^2 XP.
function levelProgress(xp: number) {
    const level = Math.floor(Math.sqrt(xp / 10)) + 1;
    const start = 10 * (level - 1) ** 2;
    const next = 10 * level ** 2;
    return { into: xp - start, needed: next - start, fraction: (xp - start) / (next - start) };
}
