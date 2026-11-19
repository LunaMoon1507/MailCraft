import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getProfile, type ProfileResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Shared, app-wide state that several screens need at once: the logged-in
// user's profile (header level chip, Profile tab, Cleanup after earning XP)
// and whether a Google account is linked (Profile tab, Cleanup).
// Fetched once here instead of separately in each component.
// Read it with the useProfile() / useGoogleLink() hooks.

export interface ProfileState {
  /** The logged-in user's profile, or null when signed out / not loaded yet. */
  profile: ProfileResponse | null;
  /** True while a profile request is in flight. */
  loading: boolean;
  /** Message from the last failed request ('' when the last one worked). */
  error: string;
  /** Fetch the profile again, e.g. after awarding points. */
  reload: () => Promise<void>;
}

export interface GoogleLinkState {
  linked: boolean;
  /** True during the first (silent) check and while linking or unlinking. */
  checking: boolean;
  /** Message from the last failed link/unlink ('' otherwise). */
  error: string;
  /** Opens Google's sign-in window and links the account. */
  link: () => Promise<void>;
  /** Signs the Google account out of the extension. */
  unlink: () => Promise<void>;
}

interface Session {
  profile: ProfileState;
  google: GoogleLinkState;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const profile = useProfileLoader();
  const google = useGoogleLinkState();
  const value = useMemo(() => ({ profile, google }), [profile, google]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession() must be used inside <SessionProvider> (see sidepanel/main.tsx).');
  }
  return session;
}

// ---- profile ----

function useProfileLoader(): ProfileState {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Each request gets a number; a response is ignored if a newer request
  // (or a logout) has happened since, so stale data never overwrites fresh.
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await getProfile();
      if (request === latestRequest.current) {
        setProfile(result);
        setError('');
      }
    } catch (err) {
      if (request === latestRequest.current) {
        setError(err instanceof Error ? err.message : 'Could not load your profile.');
      }
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load on login, clear on logout. (Not on every token refresh: same user.)
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      void reload();
    } else {
      latestRequest.current++;
      setProfile(null);
      setError('');
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, reload]);

  return useMemo(() => ({ profile, loading, error, reload }), [profile, loading, error, reload]);
}

// ---- Google link ----

function useGoogleLinkState(): GoogleLinkState {
  const [linked, setLinked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Silent check on open: uses a cached Google token if there is one and
  // never opens Google's sign-in window (only link() does that).
  useEffect(() => {
    let active = true;
    browser.identity
      .getAuthToken({ interactive: false })
      .then((result) => {
        if (active) setLinked(Boolean(result.token));
      })
      .catch(() => {
        // Throws when no account has been granted yet: that just means "not linked".
        if (active) setLinked(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const link = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const response = await browser.runtime.sendMessage({ type: 'GOOGLE_AUTH' });
      if (response?.error) {
        setLinked(false);
        setError(String(response.error));
      } else {
        setLinked(true);
      }
    } catch (err) {
      setLinked(false);
      setError(err instanceof Error ? err.message : 'Could not link your Google account.');
    } finally {
      setChecking(false);
    }
  }, []);

  const unlink = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const response = await browser.runtime.sendMessage({ type: 'LOGOUT_GOOGLE' });
      if (response?.success) {
        setLinked(false);
      } else {
        setError('Could not unlink your Google account, please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlink your Google account.');
    } finally {
      setChecking(false);
    }
  }, []);

  return useMemo(
    () => ({ linked, checking, error, link, unlink }),
    [linked, checking, error, link, unlink],
  );
}
