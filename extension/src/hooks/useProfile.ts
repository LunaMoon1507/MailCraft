import { useSession } from '@/context/SessionContext';

// The logged-in user's profile, shared app-wide: { profile, loading, error, reload }.
// Call reload() after anything that changes XP (e.g. awardPoints).
export function useProfile() {
  return useSession().profile;
}
