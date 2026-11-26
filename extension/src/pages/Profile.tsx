import Button from '@/components/Button';
import ConnectionsCard from '@/components/ConnectionsCard';
import ProfileCard from '@/components/ProfileCard';
import AvatarSelect from '@/components/AvatarSelect';
import Login from '@/pages/Login';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';

// The Profile tab (the side panel's default tab).
// Signed out: sign up / log in. Signed in: level, XP and stats, then Log out.
// Connections (server + Gmail) show either way.
export default function Profile() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <ProfileCard /> : <Login />}
      {isAuthenticated && <AvatarSelect />}
      <ConnectionsCard />
      {isAuthenticated && (
        <div>
          {/* Clearing the stored token logs out everywhere: useAuth and the shared profile react to it. */}
          <Button variant="danger" size="sm" onClick={() => void logout()}>
            Log out
          </Button>
        </div>
      )}
    </>
  );
}
