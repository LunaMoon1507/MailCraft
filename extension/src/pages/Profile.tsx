import Card from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { type ProfileResponse, getProfile } from "@/lib/api";
import { logout } from "@/lib/auth";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";

export default function Profile() {
    const [info, setInfo] = useState<ProfileResponse>();
    const [message, setMessage] = useState("");
    const {token, isAuthenticated, loading} = useAuth();

    const stats = info?.userStats;
    const xp = stats ? levelProgress(stats.xp) : null;

    async function loadProfile() {
        try {
            const profileInfo = await getProfile();
            console.log("got profile")
            setInfo(profileInfo);
            setMessage(`Welcome, ${profileInfo.username}!`)
        }
        catch (error) {
            console.log("error when getting profile")
            if (error instanceof Error) {
                setMessage(error.message);
            }
        }
    }


    // test that the points work
    async function testPoints() {
        try {
            await fetch("http://localhost:3000/api/points/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: stats!.user_id,
                    actionType: "DELETE"
                })
            })

            loadProfile();
        }
        catch (error) {
            console.log(error)
        }
    }

    useEffect(()=> {
        loadProfile();
    }, [token, isAuthenticated])

    const handleLogout = () => {
        logout();
        setInfo(undefined);
        setMessage("");
    }

    if (loading) {
        return (
            <Card variant='primary'>
                <div>Loading...</div>
            </Card>
        )
    }
    
    if (!isAuthenticated) {
        return (
            <Card variant='primary'>
                <div>Please log in to view your profile.</div>
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
