import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import InboxItem, { type InboxAction } from '@/components/InboxItem';
import ProgressBar from '@/components/ProgressBar';
import Toast, { type ToastMessage, type ToastTone } from '@/components/Toast';
import { CreatableDropdown } from '@/components/CreatableDropdown';
import {
  archiveEmail,
  createLabel,
  getEmails,
  getLabels,
  relabelEmail,
  trashEmail,
  type Email,
  type Label,
} from '@/lib/gmailApi';
import { awardPoints } from '@/lib/api';
import { levelProgress } from '@/lib/levels';
import { POINTS_PER_ACTION, type PointsAction } from '@/lib/points';
import { useGoogleLink } from '@/hooks/useGoogleLink';
import { useProfile } from '@/hooks/useProfile';
import diamond from '@graphics/28-diamond.png';

// What happened in the current batch of emails.
interface Tally {
  archived: number;
  labeled: number;
  deleted: number;
  skipped: number;
  xp: number;
}
const EMPTY_TALLY: Tally = { archived: 0, labeled: 0, deleted: 0, skipped: 0, xp: 0 };

// Each action: the Gmail call, the XP action it earns, and what it counts as.
const ACTIONS: Record<
  InboxAction,
  { run: (id: string, labelId: string) => Promise<boolean>; points: PointsAction; tally: keyof Tally; done: string }
> = {
  archive: { run: (id) => archiveEmail(id), points: 'ARCHIVE', tally: 'archived', done: 'Archived' },
  label: { run: (id, labelId) => relabelEmail(id, labelId), points: 'LABEL', tally: 'labeled', done: 'Labeled' },
  trash: { run: (id) => trashEmail(id), points: 'DELETE', tally: 'deleted', done: 'Deleted' },
};

const XP_KEY = `Archive +${POINTS_PER_ACTION.ARCHIVE} · Label +${POINTS_PER_ACTION.LABEL} · Delete +${POINTS_PER_ACTION.DELETE}`;

// The Cleanup tab. Only reachable while logged in (the tab is locked otherwise);
// asks for a linked Gmail before loading anything.
export default function CleanupGame() {
  const google = useGoogleLink();

  if (!google.linked) {
    return (
      <Card variant="secondary" heading="Email cleanup">
        {google.checking ? (
          <p role="status">Checking your Gmail link...</p>
        ) : (
          <>
            <p>Link your Gmail to start cleaning your inbox and earning XP.</p>
            {google.error && <p className="mc-error">{google.error}</p>}
            <div>
              <Button variant="primary" size="sm" onClick={() => void google.link()}>
                Link Google
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  return <CleanupBoard />;
}

function CleanupBoard() {
  const { profile, reload: reloadProfile } = useProfile();

  // null while a batch is loading.
  const [emails, setEmails] = useState<Email[] | null>(null);
  const [batchTotal, setBatchTotal] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [batch, setBatch] = useState<Tally>(EMPTY_TALLY);
  const [sessionXp, setSessionXp] = useState(0);

  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState('');

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastCount = useRef(0);
  const showToast = useCallback((text: string, tone?: ToastTone) => {
    setToast({ id: ++toastCount.current, text, tone });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const loadBatch = useCallback(async () => {
    setEmails(null);
    setLoadError('');
    try {
      const list = await getEmails();
      setEmails(list);
      setBatchTotal(list.length);
      setBatch(EMPTY_TALLY);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load your inbox.');
      setEmails([]);
      setBatchTotal(0);
    }
  }, []);

  const loadLabels = useCallback(async () => {
    try {
      setLabels(await getLabels());
    } catch {
      // The picker stays empty; Archive / Delete / Skip still work.
    }
  }, []);

  useEffect(() => {
    void loadBatch();
    void loadLabels();
  }, [loadBatch, loadLabels]);

  // For the label picker's "+ Create" row.
  async function addLabel(name: string) {
    if (labels.some((label) => label.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    try {
      const created = await createLabel(name);
      if (created) {
        setSelectedLabelId(created.id);
        await loadLabels();
        return true;
      }
    } catch {
      // fall through
    }
    showToast("Couldn't create that label", 'error');
    return false;
  }

  // Functional updates throughout: several emails can be in flight at once.
  const removeEmail = (id: string) => setEmails((current) => current?.filter((email) => email.id !== id) ?? current);

  async function handleAction(action: InboxAction, email: Email) {
    const spec = ACTIONS[action];
    if (action === 'label' && !selectedLabelId) {
      showToast('Pick a label first!', 'error');
      return;
    }

    let done = false;
    try {
      done = await spec.run(email.id, selectedLabelId);
    } catch {
      done = false;
    }
    if (!done) {
      showToast('Something went wrong, please try again.', 'error');
      return;
    }

    // The email has left the inbox in Gmail, so it leaves the list even if
    // saving XP fails below.
    removeEmail(email.id);
    setBatch((tally) => ({ ...tally, [spec.tally]: tally[spec.tally] + 1 }));

    try {
      const result = await awardPoints(spec.points);
      setBatch((tally) => ({ ...tally, xp: tally.xp + result.awardedPoints }));
      setSessionXp((xp) => xp + result.awardedPoints);
      if (result.leveledUp) {
        showToast(`Level up! LV ${result.level}`, 'level');
      } else {
        showToast(`+${result.awardedPoints} XP`);
      }
      void reloadProfile(); // updates the header's level chip
    } catch {
      showToast(`${spec.done}, but XP couldn't be saved`, 'error');
    }
  }

  // Skipping counts toward the batch but earns no XP.
  function handleSkip(email: Email) {
    removeEmail(email.id);
    setBatch((tally) => ({ ...tally, skipped: tally.skipped + 1 }));
  }

  const toast$ = <Toast message={toast} onDone={clearToast} />;

  if (emails === null) {
    return (
      <>
        {toast$}
        <Card variant="secondary" heading="Email cleanup">
          <p role="status">Loading your inbox...</p>
        </Card>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {toast$}
        <Card variant="secondary" heading="Email cleanup">
          <p className="mc-error">{loadError}</p>
          <div>
            <Button variant="primary" size="sm" onClick={() => void loadBatch()}>
              Try again
            </Button>
          </div>
        </Card>
      </>
    );
  }

  if (batchTotal === 0) {
    return (
      <>
        {toast$}
        <Card variant="secondary" heading="Email cleanup">
          <p>Your inbox is empty. Nothing to clean up!</p>
          <div>
            <Button variant="primary" size="sm" onClick={() => void loadBatch()}>
              Check again
            </Button>
          </div>
        </Card>
      </>
    );
  }

  const handled = batchTotal - emails.length;
  const stats = profile?.userStats;

  return (
    <>
      {toast$}
      <Card variant="primary">
        <div className="flex items-baseline justify-between gap-px2">
          <h2 className="mc-panel__title">This session</h2>
          <span className="mc-stat__value text-accent">+{sessionXp} XP</span>
        </div>
        <ProgressBar value={handled / batchTotal} label="Emails sorted in this batch" />
        <div className="flex flex-wrap justify-between gap-x-px3">
          <span className="mc-label">
            {handled} / {batchTotal} sorted
          </span>
          <span className="mc-label">{XP_KEY}</span>
        </div>
      </Card>

      {emails.length === 0 ? (
        <BatchCleared tally={batch} xp={stats?.xp} onLoadMore={() => void loadBatch()} />
      ) : (
        <>
          <CreatableDropdown
            label="Label as"
            selectedId={selectedLabelId}
            onChangeId={setSelectedLabelId}
            onCreate={addLabel}
            items={labels.filter((label) => label.type === 'user')}
          />
          <ul className="flex flex-col gap-px3" aria-label="Inbox emails">
            {emails.map((email) => (
              <li key={email.id}>
                <InboxItem email={email} onAction={handleAction} onSkip={handleSkip} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function BatchCleared({ tally, xp, onLoadMore }: { tally: Tally; xp?: number; onLoadMore: () => void }) {
  const parts = [
    tally.archived && `${tally.archived} archived`,
    tally.labeled && `${tally.labeled} labeled`,
    tally.deleted && `${tally.deleted} deleted`,
    tally.skipped && `${tally.skipped} skipped`,
  ].filter(Boolean);
  const progress = xp != null ? levelProgress(xp) : null;

  return (
    <Card variant="secondary" className="items-center text-center">
      <span className="mc-slot h-20 w-20">
        <img src={diamond} alt="" />
      </span>
      <h2 className="mc-title">Batch cleared!</h2>
      <p>
        {parts.join(', ')}. +{tally.xp} XP.
      </p>
      {progress && (
        <p className="mc-label">
          {progress.toNext} XP to level {progress.level + 1}
        </p>
      )}
      <Button variant="primary" onClick={onLoadMore}>
        Load more emails
      </Button>
    </Card>
  );
}
