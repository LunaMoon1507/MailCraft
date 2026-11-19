import { useCallback, useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';

export type ServerStatus =
  | { kind: 'checking' }
  | { kind: 'connected'; latencyMs: number }
  | { kind: 'error'; message: string };

// Pings the backend's /api/health on mount and whenever check() is called.
export function useServerHealth() {
  const [status, setStatus] = useState<ServerStatus>({ kind: 'checking' });

  const check = useCallback(async () => {
    setStatus({ kind: 'checking' });
    const started = performance.now();
    try {
      await getHealth(AbortSignal.timeout(5000));
      setStatus({ kind: 'connected', latencyMs: Math.round(performance.now() - started) });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return { status, check };
}
