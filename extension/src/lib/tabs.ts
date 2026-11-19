import { storage } from '#imports';

// The side panel's three tabs. Profile is the default.
export type TabId = 'profile' | 'cleanup' | 'friends';

// Remembers the last tab the user picked, so the side panel reopens there.
export const activeTabItem = storage.defineItem<TabId>('local:activeTab', {
  fallback: 'profile',
});
