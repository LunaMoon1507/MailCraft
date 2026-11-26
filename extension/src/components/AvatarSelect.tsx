import { AVATARS, avatarFor } from "@/lib/avatar";
import { updateAvatar } from "@/lib/api";
import Card from "./Card";
import { useProfile } from '@/hooks/useProfile';

export default function AvatarSelect() {
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

    const handleClick = async (avatar: number) => {
        const newAvatar = await updateAvatar(avatar);
        void reload();
    }
    
    return (
        <Card heading="Select an Avatar">
            <div>Unlock more by leveling up!</div>
            <div className="flex flex-wrap">
                {AVATARS.filter((value, index) => index+1 <= profile.userStats!.highest_level).map((img, index) => (
                    // show only the avatars the user has unlocked (based on their highest level)
                    <span key={index} className="mc-slot" onClick={()=>handleClick(index)}>
                        <img src={avatarFor(index)} alt="" />
                    </span>
                ))}
            </div>    
        </Card>
        
    )
}