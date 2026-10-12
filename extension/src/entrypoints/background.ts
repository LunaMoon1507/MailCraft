// Background service worker (Manifest V3). Can be stopped at any time, so
// keep no state in variables here; use chrome.storage and chrome.alarms.
export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel.
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error('Failed to set side panel behavior', error));
});
