import Card from "@/components/Card";
import { useState, useEffect } from "react";
import { type ProfileResponse, getProfile } from "@/lib/api";
import { logout } from "@/lib/auth";
import Button from "@/components/Button";

export default function Profile() {
    const [info, setInfo] = useState<ProfileResponse>();
    const [message, setMessage] = useState("");

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
    }, [])

    const handleLogout = () => {
        logout();
        setInfo(undefined);
        setMessage("");
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
            <Button variant='secondary' size='sm' onClick={loadProfile}>Refresh Profile</Button>
            <Button variant='secondary' size='sm' onClick={handleLogout}>Log Out</Button>
        </Card>
    )
}