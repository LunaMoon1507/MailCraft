import { type ReactNode } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { API_URL } from '@/lib/api';
import { useServerHealth } from '@/hooks/useServerHealth';
import { useGoogleLink } from '@/hooks/useGoogleLink';

type RowState = 'ok' | 'error' | 'pending';

// Profile tab: backend server status and the Google (Gmail) link, one row each.
export default function ConnectionsCard() {
  const { status, check } = useServerHealth();
  const google = useGoogleLink();

  const serverState: RowState =
    status.kind === 'connected' ? 'ok' : status.kind === 'error' ? 'error' : 'pending';
  const serverValue =
    status.kind === 'connected'
      ? `Connected · ${status.latencyMs} ms`
      : status.kind === 'error'
        ? 'Not connected'
        : 'Checking...';

  const googleState: RowState = google.checking ? 'pending' : google.linked ? 'ok' : 'error';
  const googleValue = google.checking ? 'Checking...' : google.linked ? 'Linked' : 'Not linked';

  return (
    <Card variant="secondary" heading="Connections">
      <ConnectionRow
        state={serverState}
        label="Server"
        value={serverValue}
        error={status.kind === 'error' ? `${status.message}. Is the backend running at ${API_URL}?` : ''}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void check()}
            disabled={status.kind === 'checking'}
            aria-label="Check server connection"
          >
            Check
          </Button>
        }
      />
      <ConnectionRow
        state={googleState}
        label="Gmail"
        value={googleValue}
        error={google.error}
        action={
          google.linked ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={google.checking}
              onClick={() => void google.unlink()}
              aria-label="Unlink Google account"
            >
              Unlink
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={google.checking}
              onClick={() => void google.link()}
            >
              Link Google
            </Button>
          )
        }
      />
      {!google.checking && !google.linked && (
        <p className="mc-subtitle">Link your Gmail to start cleaning up your inbox.</p>
      )}
    </Card>
  );
}

interface ConnectionRowProps {
  state: RowState;
  label: string;
  value: string;
  action: ReactNode;
  /** Shown under the row when something went wrong. */
  error?: string;
}

function ConnectionRow({ state, label, value, action, error }: ConnectionRowProps) {
  return (
    <div className="flex flex-col gap-px1">
      <div className="flex items-center gap-px2">
        <span aria-hidden="true" className={`mc-status mc-status--${state}`} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mc-label">{label}</span>
          <span className="mc-stat__value text-pixel-sm" role="status" aria-live="polite">
            {value}
          </span>
        </div>
        {action}
      </div>
      {error && <p className="mc-error">{error}</p>}
    </div>
  );
}
