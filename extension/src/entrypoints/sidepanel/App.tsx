import { useCallback, useEffect, useState } from 'react';
import { API_URL, getHealth } from '@/lib/api';
import { activeTabItem, type TabId } from '@/lib/tabs';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TabBar, { type TabItem, panelId, tabId } from '@/components/TabBar';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import OAuth from '@/pages/OAuth';
import CleanupGame from '@/pages/CleanupGame';
import Friends from '@/pages/Friends';
import grassBlock from '@graphics/5-grass.png';
import steve from '@graphics/8-steve.png';
import pickaxe from '@graphics/6-pickaxe.png';
import wolf from '@graphics/23-wolf.png';

type Status =
  | { kind: 'checking' }
  | { kind: 'connected'; latencyMs: number }
  | { kind: 'error'; message: string };

const LOCKED_REASON = 'Log in to unlock';

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'checking' });
  const { isAuthenticated, loading: authLoading } = useAuth();

  // The tab the user last picked (saved in extension storage).
  const [chosenTab, setChosenTab] = useState<TabId>('profile');
  const [tabLoaded, setTabLoaded] = useState(false);

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

  useEffect(() => {
    let active = true;
    void activeTabItem.getValue().then((saved) => {
      if (active) {
        setChosenTab(saved);
        setTabLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const locked = !isAuthenticated;
  const tabs: TabItem<TabId>[] = [
    { id: 'profile', label: 'Profile', icon: steve },
    { id: 'cleanup', label: 'Cleanup', icon: pickaxe, disabled: locked, disabledReason: LOCKED_REASON },
    { id: 'friends', label: 'Friends', icon: wolf, disabled: locked, disabledReason: LOCKED_REASON },
  ];

  // A locked tab (e.g. right after logging out) shows Profile instead, but the
  // saved choice is kept so the user lands back there after logging in.
  const activeTab = tabs.find((tab) => tab.id === chosenTab && !tab.disabled)?.id ?? 'profile';

  function selectTab(id: TabId) {
    setChosenTab(id);
    void activeTabItem.setValue(id);
  }

  // Wait for the login state and the saved tab before drawing a panel, so the
  // side panel doesn't flash Profile (or a "please log in" card) on open.
  const ready = !authLoading && tabLoaded;

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

      <TabBar
        label="MailCraft sections"
        tabs={tabs}
        active={activeTab}
        onChange={selectTab}
        className="sticky top-px1 z-10"
      />

      {ready && (
        <div
          role="tabpanel"
          id={panelId(activeTab)}
          aria-labelledby={tabId(activeTab)}
          className="flex flex-col gap-6"
        >
          {activeTab === 'profile' && (
            <>
              {isAuthenticated ? <Profile /> : <Login />}

              <Card variant="secondary" heading="Backend connection">
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void check()}
                    disabled={status.kind === 'checking'}
                  >
                    Check again
                  </Button>
                </div>
              </Card>

              <OAuth />
            </>
          )}
          {activeTab === 'cleanup' && <CleanupGame />}
          {activeTab === 'friends' && <Friends />}
        </div>
      )}
    </main>
  );
}
