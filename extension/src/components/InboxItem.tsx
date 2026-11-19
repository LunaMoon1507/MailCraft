import { useState } from 'react';
import Button from '@/components/Button';
import { type Email } from '@/lib/gmailApi';

export type InboxAction = 'archive' | 'label' | 'trash';

interface InboxItemProps {
  email: Email;
  /** Runs an action; resolves when it has finished (whether it worked or not). */
  onAction: (action: InboxAction, email: Email) => Promise<void>;
  onSkip: (email: Email) => void;
}

// One inbox email in the Cleanup tab: sender, subject, and an always-visible
// row of actions (works with keyboard and touch, unlike a hover overlay).
// While one action runs, the row's other buttons are disabled.
export default function InboxItem({ email, onAction, onSkip }: InboxItemProps) {
  const [busy, setBusy] = useState<InboxAction | null>(null);
  const sender = senderName(email.from);

  async function run(action: InboxAction) {
    setBusy(action);
    try {
      await onAction(action, email);
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="mc-panel gap-px2 p-px3" aria-busy={busy !== null} aria-label={`Email from ${sender}`}>
      <span className="mc-label truncate" title={email.from}>
        {sender}
      </span>
      <p className="mc-stat__value break-words">{email.subject || '(no subject)'}</p>
      <div className="-mx-px1 flex flex-wrap gap-px1">
        <Button
          variant="primary"
          size="sm"
          loading={busy === 'archive'}
          disabled={busy !== null}
          onClick={() => void run('archive')}
          aria-label={`Archive email from ${sender}`}
        >
          Archive
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={busy === 'label'}
          disabled={busy !== null}
          onClick={() => void run('label')}
          aria-label={`Label email from ${sender}`}
        >
          Label
        </Button>
        <Button
          variant="danger"
          size="sm"
          loading={busy === 'trash'}
          disabled={busy !== null}
          onClick={() => void run('trash')}
          aria-label={`Delete email from ${sender}`}
        >
          Delete
        </Button>
        <Button
          variant="plain"
          size="sm"
          disabled={busy !== null}
          onClick={() => onSkip(email)}
          aria-label={`Skip email from ${sender}`}
        >
          Skip
        </Button>
      </div>
    </article>
  );
}

// '"UF Bookstore" <noreply@uf.edu>' -> 'UF Bookstore'; a bare address stays as is.
function senderName(from: string) {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  return match?.[1]?.trim() || match?.[2] || from || 'Unknown sender';
}
