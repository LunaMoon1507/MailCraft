import { useCallback, useEffect, useState } from 'react';
import { API_URL, getHealth } from '@/lib/api';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
    <main className="min-h-screen bg-night p-4 font-pixel text-white">
      <h1 className="text-xl font-bold tracking-wide">MailCraft</h1>
      <p className="mt-1 text-sm text-stone">Inbox cleanup, block by block.</p>

      <Card variant="primary">
        <h2 className="text-xs uppercase tracking-widest text-stone">Backend connection</h2>

        <div className="mt-2 flex items-center gap-2" role="status" aria-live="polite">
          <span
            className={
              'inline-block size-3 ' +
              (status.kind === 'connected'
                ? 'bg-grass'
                : status.kind === 'error'
                  ? 'bg-red-500'
                  : 'animate-pulse bg-amber-400')
            }
          />
          <span className="text-sm">
            {status.kind === 'checking' && 'Checking…'}
            {status.kind === 'connected' && `Connected (${status.latencyMs} ms)`}
            {status.kind === 'error' && 'Not connected'}
          </span>
        </div>

        {status.kind === 'error' && (
          <p className="mt-2 text-xs break-words text-red-300">
            {status.message}. Is the backend running at {API_URL}?
          </p>
        )}
        <Button variant='primary' size='sm' onClick={()=> void check()} disabled={status.kind==='checking'}>Check again</Button>
      </Card>
    </main>
  );
}
