import { useEffect, useState } from 'react';
import { activeTabItem, type TabId } from '@/lib/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import LevelChip from '@/components/LevelChip';
import TabBar, { type TabItem, panelId, tabId } from '@/components/TabBar';
import Profile from '@/pages/Profile';
import CleanupGame from '@/pages/CleanupGame';
import Friends from '@/pages/Friends';
import grassBlock from '@graphics/5-grass.png';
import steve from '@graphics/8-steve.png';
import pickaxe from '@graphics/6-pickaxe.png';
import wolf from '@graphics/23-wolf.png';

const LOCKED_REASON = 'Log in to unlock';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const level = profile?.userStats?.level;

  // The tab the user last picked (saved in extension storage).
  const [chosenTab, setChosenTab] = useState<TabId>('profile');
  const [tabLoaded, setTabLoaded] = useState(false);

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
        <div className="flex min-w-0 flex-1 flex-col gap-px2">
          <div className="flex items-center justify-between gap-px2">
            <h1 className="mc-title">MailCraft</h1>
            {isAuthenticated && level != null && <LevelChip level={level} />}
          </div>
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
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'cleanup' && <CleanupGame />}
          {activeTab === 'friends' && <Friends />}
        </div>
      )}
    </main>
  );
}
