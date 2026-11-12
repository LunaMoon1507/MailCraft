// Background service worker (Manifest V3). Can be stopped at any time, so
// keep no state in variables here; use chrome.storage and chrome.alarms.
export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel.
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error('Failed to set side panel behavior', error));
  
  browser.alarms.get("dailyInboxSnapshot", (alarm) => {
    if (!alarm) {
      browser.alarms.create("dailyInboxSnapshot", {
        periodInMinutes: 1440
      });
    }
  });

  // Listen for alarm triggers
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "dailyInboxSnapshot") {
      await captureAndSendInboxSnapshot();
    }
  });

  // Handle Google OAuth requests
  // Returns a token that can be used to make the gmail api calls
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "GOOGLE_AUTH") {
        browser.identity.getAuthToken(
          {
            interactive: true
          },
          (result) => {
            if (browser.runtime.lastError) {
              sendResponse({
                error: browser.runtime.lastError.message,
              });
              return;
            }

            sendResponse({
              accessToken: result,
            });
          }
        );

        return true;
      }


      else if (message.type === 'LOGOUT_GOOGLE') {
        disconnectOauth().then(() => {
            return({success: true});
        }).catch((err) => {
            console.error(err);
            sendResponse({success: false});
            return true;
        });
        
        sendResponse({success: true})
        return true;
        
      }
    }
  )

});


async function disconnectOauth() {
  // Get the cached Google access token
  const authResult = await browser.identity.getAuthToken({
    interactive: false,
  });

  const token = authResult.token;

  if (!token) {
    console.log('No cached Google token found.');
    return true;
  }

  // Remove the token from Chrome's identity cache
  await browser.identity.removeCachedAuthToken({ token });

  // Revoke the token with Google
  const response = await fetch(
    'https://oauth2.googleapis.com/revoke',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to revoke Google token. Status: ${response.status}`
    );
    return false;
  }

  console.log('Google token successfully revoked.');
  return true;
}

// Automatically captures the inbox unread count
async function captureAndSendInboxSnapshot() {
  try {
    const storageData = await browser.storage.local.get(["userId"]);
    const userId = storageData.userId;
    if (!userId) return;

    const authResult = await browser.identity.getAuthToken({ interactive: false });
    const token = authResult.token;
    if (!token) return;

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.ok) return;
    const data = await response.json();
    const unreadCount = data.messagesUnread ?? 0;

    const todayStr = new Date().toISOString().split('T')[0];

    await fetch('http://localhost:3000/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId.toString(),
        unreadCount: unreadCount,
        date: todayStr
      })
    });
  } catch (error) {
    console.error("Failed to capture and send end-of-day inbox snapshot:", error);
  }
}