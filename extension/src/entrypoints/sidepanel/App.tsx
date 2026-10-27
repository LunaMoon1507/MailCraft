import { useCallback, useEffect, useState } from 'react';
import { API_URL, getHealth } from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import grassBlock from '@graphics/5-grass.png';

type Status =
  | { kind: 'checking' }
  | { kind: 'connected'; latencyMs: number }
  | { kind: 'error'; message: string };

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'checking' });

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

  return (
    <main className="mc-app">
      <header className="flex items-center gap-px3">
        <span className="mc-slot">
          <img src={grassBlock} alt="" />
        </span>
        <div className="flex flex-col gap-px2">
          <h1 className="mc-title">MailCraft</h1>
          <p className="mc-subtitle">Inbox cleanup, block by block.</p>
        </div>
      </header>

      <Card variant="primary" heading="Backend connection">
        <div className="flex items-center gap-px2" role="status" aria-live="polite">
          <span
            aria-hidden="true"
            className={
              'mc-status ' +
              (status.kind === 'connected'
                ? 'mc-status--ok'
                : status.kind === 'error'
                  ? 'mc-status--error'
                  : 'mc-status--pending')
            }
          />
          <span>
            {status.kind === 'checking' && 'Checking...'}
            {status.kind === 'connected' && `Connected (${status.latencyMs} ms)`}
            {status.kind === 'error' && 'Not connected'}
          </span>
        </div>

        {status.kind === 'error' && (
          <p className="mc-error">
            {status.message}. Is the backend running at {API_URL}?
          </p>
        )}
        <div>
          <Button variant="primary" size="sm" onClick={() => void check()} disabled={status.kind === 'checking'}>
            Check again
          </Button>
        </div>
      </Card>
      <Login />
      <Profile />
    </main>
  );
}
