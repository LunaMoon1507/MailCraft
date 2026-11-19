// Thin wrapper around the MailCraft backend. All server calls go through
// here so the base URL, headers and (later) the JWT live in one place.
import { storage } from '#imports';
import { authToken, isTokenExpiring, refreshAccessToken } from './auth';
import type { PointsAction } from './points';

export const API_URL: string = import.meta.env.WXT_API_URL ?? 'http://localhost:3000';

export interface HealthResponse {
  status: 'ok';
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`, { signal });
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}

// helper function for any api calls that need the user to be signed in
// automatically adds the authorization header, and renews an expired
// access token with the refresh token so the user stays logged in
async function makeAuthRequest(url: string, options: RequestInit = {}) {
  let token = await authToken.getValue();
  if (!token) {
    throw new Error("Please log in");
  }

  // Renew ahead of time if the token is about to expire (saves a failed request).
  if (isTokenExpiring(token)) {
    token = (await refreshAccessToken()) ?? token;
  }

  const send = (accessToken: string) => fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let res = await send(token);

  if (res.status === 401) {
    // Access token rejected: try once to renew it, then retry the request.
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error("Session expired, please log in");
    }
    res = await send(newToken);
    if (res.status === 401) {
      throw new Error("Session expired, please log in");
    }
  }

  return res;
}

// update as needed, created for testing purposes
export interface ProfileResponse {
  username: string,
  userStats: {
    level: number;
    xp: number;
    highest_level: number;
    current_streak: number;
    longest_streak: number;
    last_active_date: Date;
    best_day_count: number;
    best_day_date: Date;
    user_id: bigint;
    } | null;
}

export async function getProfile() {
  let res: Response;
  try {
    res = await makeAuthRequest(`${API_URL}/api/profile`, {
      method: "GET",
    });
  }
  catch (error) {
    // fetch throws a TypeError when the server can't be reached at all.
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server. Check Connections below.");
    }
    // makeAuthRequest's own errors ("Please log in", "Session expired...") pass through.
    throw error;
  }

  if (!res.ok) {
    throw await errorFrom(res, "Couldn't load your profile, please try again.");
  }

  return (await res.json()) as ProfileResponse;
}

export interface AwardPointsResponse {
  success: true;
  awardedPoints: number;
  totalPoints: number;
  level: number;
  leveledUp: boolean;
  bestDayCount: number;
  bestDayDate: string;
}

// Logs a cleanup action for the logged-in user and returns their updated points.
// The server works out the user from the login token and the XP from the action.
export async function awardPoints(actionType: PointsAction, count = 1) {
  const res = await makeAuthRequest(`${API_URL}/api/points/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionType, count }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Awarding points failed: HTTP ${res.status}`);
  }
  return (await res.json()) as AwardPointsResponse;
}

// ---- Friends ----

export interface FriendSearchResult {
  username: string;
  isSelf: boolean;
  isFriend: boolean;
}

export interface Friend {
  username: string;
  since: string;
}

// Reads `{ error }` from a failed response so the UI can show the server's message.
async function errorFrom(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  return new Error(body.error ?? fallback);
}

// Exact username match. Returns null when no user has that username.
export async function searchUser(username: string) {
  const res = await makeAuthRequest(
    `${API_URL}/api/friends/search?username=${encodeURIComponent(username)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw await errorFrom(res, 'Search failed, please try again.');
  return (await res.json()) as FriendSearchResult;
}

export async function getFriends() {
  const res = await makeAuthRequest(`${API_URL}/api/friends`);
  if (!res.ok) throw await errorFrom(res, 'Could not load your friends list.');
  return (await res.json()) as Friend[];
}

// Adds the user as a friend; the friendship shows up for both people.
export async function addFriend(username: string) {
  const res = await makeAuthRequest(`${API_URL}/api/friends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw await errorFrom(res, 'Could not add friend, please try again.');
}

// Unfriends the user for both people.
export async function removeFriend(username: string) {
  const res = await makeAuthRequest(`${API_URL}/api/friends/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw await errorFrom(res, 'Could not remove friend, please try again.');
}
