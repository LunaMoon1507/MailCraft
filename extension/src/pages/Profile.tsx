import Card from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { type ProfileResponse, getProfile } from "@/lib/api";
import { logout } from "@/lib/auth";
import Button from "@/components/Button";

export default function Profile() {
    const [info, setInfo] = useState<ProfileResponse>();
    const [message, setMessage] = useState("");
    const {token, isAuthenticated, loading} = useAuth();

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
        <Card variant='primary'>
            <div>Profile</div>
            <div>{message}</div>
            {info && info.userStats &&
                 <div>
                    <p>User Stats:</p>
                    Level: {info.userStats.level}
                </div>
            }
            <Button variant='secondary' size='sm' onClick={handleLogout}>Log Out</Button>
        </Card>
    )
}