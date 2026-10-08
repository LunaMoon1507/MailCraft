import { useCallback, useEffect, useState } from 'react';
import { API_URL, getHealth } from '@/lib/api';

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

      <section className="mt-6 border-2 border-stone bg-black/30 p-3">
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

        <button
          type="button"
          onClick={() => void check()}
          disabled={status.kind === 'checking'}
          className="mt-3 border-2 border-b-dirt border-l-grass border-r-dirt border-t-grass bg-grass px-3 py-1 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
        >
          Check again
        </button>
      </section>
    </main>
  );
}
